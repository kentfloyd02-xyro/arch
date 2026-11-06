import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function formatMoney(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char])
  );
}

export function useCustomerOrdersPageController() {
  const {
    currentUser,
    orders,
    products,
    addToCart,
    cancelOrder,
    setSelectedOrderForTracking,
    setIsTrackingOpen,
    setSelectedOrderForRefund,
    setIsRefundOpen,
    openRateModal,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReasonType, setCancelReasonType] = useState('Ordered wrong product or size');
  const [cancelOtherReason, setCancelOtherReason] = useState('');
  const [rejectionPopupOrder, setRejectionPopupOrder] = useState(null);

  const knownEmails = [currentUser?.email, ...(currentUser?.previousEmails || [])]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const customerOrders = orders.filter((order) => {
    if (!currentUser) return true;
    const orderEmail = (order.customerEmail || order.customer_email || '').toLowerCase();
    const orderUserId = order.userId || order.user_id;
    const currentId = currentUser?.id || currentUser?._id;
    if (orderUserId && currentId && String(orderUserId) === String(currentId)) return true;
    if (knownEmails.length && orderEmail && knownEmails.includes(orderEmail)) return true;
    return !knownEmails.length;
  });

  // Popup check for newly rejected orders that haven't been acknowledged yet
  useEffect(() => {
    try {
      const ackList = JSON.parse(localStorage.getItem('archon_ack_rejections') || '[]');
      const newlyRejected = customerOrders.find((o) => {
        const s = String(o.status || o.deliveryStatus || '').toUpperCase();
        const rDet =
          o.refundDetails ||
          (typeof o.refund_details === 'string' ? JSON.parse(o.refund_details) : o.refund_details) ||
          {};
        const rSt = String(rDet.refundStatus || rDet.status || '').toUpperCase();
        const isRej =
          s === 'REFUND_REJECTED' ||
          rSt === 'REJECTED' ||
          Boolean(rDet.rejectedReason) ||
          Boolean(rDet.trialUsed && s !== 'REFUNDED');
        return isRej && !ackList.includes(o.orderNumber);
      });
      if (newlyRejected) {
        setRejectionPopupOrder(newlyRejected);
      }
    } catch {}
  }, [customerOrders]);

  const dismissRejectionPopup = () => {
    if (rejectionPopupOrder) {
      try {
        const ackList = JSON.parse(localStorage.getItem('archon_ack_rejections') || '[]');
        if (!ackList.includes(rejectionPopupOrder.orderNumber)) {
          ackList.push(rejectionPopupOrder.orderNumber);
          localStorage.setItem('archon_ack_rejections', JSON.stringify(ackList));
        }
      } catch {}
      setRejectionPopupOrder(null);
    }
  };

  const q = search.trim().toLowerCase();

  const filteredOrders = customerOrders
    .filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.items || []).some((item) => item.title.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;

      const rawStatus = String(order.status || order.deliveryStatus || '').toUpperCase();
      const rDet =
        order.refundDetails ||
        (typeof order.refund_details === 'string' ? JSON.parse(order.refund_details) : order.refund_details) ||
        {};
      const rSt = String(rDet.refundStatus || rDet.status || '').toUpperCase();
      const isRej =
        rawStatus === 'REFUND_REJECTED' ||
        rSt === 'REJECTED' ||
        Boolean(rDet.rejectedReason) ||
        Boolean(rDet.trialUsed && rawStatus !== 'REFUNDED');

      if (statusFilter === 'REFUND_REJECTED') return isRej;
      return rawStatus === statusFilter;
    })
    .map((order) => {
      const rawStatus = String(order.status || order.deliveryStatus || '').toUpperCase();
      const rDetails =
        order.refundDetails ||
        (typeof order.refund_details === 'string' ? JSON.parse(order.refund_details) : order.refund_details) ||
        {};
      const rStatus = String(rDetails.refundStatus || rDetails.status || '').toUpperCase();

      const isRejectedRefund =
        rawStatus === 'REFUND_REJECTED' ||
        rStatus === 'REJECTED' ||
        Boolean(rDetails.rejectedReason) ||
        Boolean(rDetails.trialUsed && rawStatus !== 'REFUNDED');

      const isApprovedRefund = rawStatus === 'REFUNDED' || rStatus === 'APPROVED';
      const isRefundRequested =
        (rawStatus === 'REFUND_REQUESTED' || rStatus === 'PENDING_REVIEW') &&
        !isRejectedRefund &&
        !isApprovedRefund;

      const isCancelled = rawStatus === 'CANCELLED';
      const delivered = rawStatus === 'DELIVERED';
      const canCancel = ['CONFIRMED', 'PENDING'].includes(rawStatus);
      const inProgress = ['CONFIRMED', 'PREPARING', 'IN_TRANSIT'].includes(rawStatus);

      // Strict 1-trial policy: once requested, approved, or rejected, return cannot be requested again
      const isReturnTrialUsed =
        isRefundRequested ||
        isApprovedRefund ||
        isRejectedRefund ||
        Boolean(rDetails.trialUsed);
      const canRequestReturn = delivered && !isReturnTrialUsed;

      let statusLabel = 'Delivered';
      let statusBadgeClass = 'bg-blue-500/15 text-blue-200';

      if (isRejectedRefund) {
        statusLabel = 'Return rejected';
        statusBadgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      } else if (isApprovedRefund) {
        statusLabel = 'Refund completed';
        statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      } else if (isRefundRequested) {
        statusLabel = 'Return under review';
        statusBadgeClass = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      } else if (isCancelled) {
        statusLabel = 'Cancelled';
        statusBadgeClass = 'bg-rose-500/15 text-rose-300';
      } else if (delivered) {
        statusLabel = 'Delivered';
        statusBadgeClass = 'bg-emerald-500/15 text-emerald-300';
      } else {
        const statusLabels = {
          CONFIRMED: 'Processing',
          PREPARING: 'Preparing',
          IN_TRANSIT: 'Shipped · Out for delivery'
        };
        statusLabel = statusLabels[rawStatus] || rawStatus;
        statusBadgeClass = 'bg-blue-500/15 text-blue-200';
      }

      const items = (order.items || []).map((item) => ({
        ...item,
        formattedTotal: formatMoney(item.total ?? item.price * item.quantity)
      }));

      return {
        ...order,
        refundDetails: {
          ...rDetails,
          rejectedReason: rDetails.rejectedReason || order.cancelReason || 'Claim criteria not met or invalid proof'
        },
        delivered,
        isApprovedRefund,
        isRejectedRefund,
        isRefundRequested,
        isReturnTrialUsed,
        canRequestReturn,
        returnRequested: isRefundRequested,
        isCancelled,
        canCancel,
        inProgress,
        statusLabel,
        statusBadgeClass,
        formattedDate: new Date(order.date || order.createdAt).toLocaleDateString(),
        formattedTotal: formatMoney(order.totalAmount),
        items
      };
    });

  const openCancelModal = (order) => {
    setCancelModalOrder(order);
    setCancelReasonType('Ordered wrong product or size');
    setCancelOtherReason('');
  };

  const closeCancelModal = () => {
    setCancelModalOrder(null);
    setCancelReasonType('Ordered wrong product or size');
    setCancelOtherReason('');
  };

  const confirmCancelOrder = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!cancelModalOrder) return;

    if (cancelReasonType === 'Other reason') {
      const trimmed = cancelOtherReason.trim();
      cancelOrder(cancelModalOrder.orderNumber, trimmed);
    } else {
      cancelOrder(cancelModalOrder.orderNumber, cancelReasonType);
    }
    closeCancelModal();
  };

  const isCancelSubmitDisabled =
    cancelReasonType === 'Other reason' &&
    (cancelOtherReason.trim().length < 8 || cancelOtherReason.trim().length > 25);

  const openTracking = (order) => {
    setSelectedOrderForTracking(order);
    setIsTrackingOpen(true);
  };

  const openRefund = (order) => {
    if (order.isReturnTrialUsed) {
      showToast('Each order item has a strict 1-trial return policy.', 'warning');
      return;
    }
    setSelectedOrderForRefund(order);
    setIsRefundOpen(true);
  };

  const reorder = (order) => {
    let added = 0;
    (order.items || []).forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.id);
      if (product && product.stock >= item.quantity) {
        addToCart(product, item.quantity);
        added += 1;
      }
    });
    if (!added) {
      showToast('These items are unavailable or no longer in stock.', 'warning');
    } else {
      showToast(
        `${added} item${added === 1 ? '' : 's'} added to your cart.`,
        'success'
      );
    }
  };

  const printReturnLabel = (order) => {
    const popup = window.open('', '_blank', 'width=700,height=600');
    if (!popup) {
      showToast('Allow pop-ups to print this return label.', 'warning');
      return;
    }
    popup.document.write(
      `<html><head><title>Return label ${escapeHtml(
        order.orderNumber
      )}</title><style>body{font:16px Arial;padding:40px}.label{border:2px dashed #222;padding:28px;max-width:500px}h1{font-size:20px}</style></head><body><div class="label"><h1>RETURN REQUEST</h1><p>From: ${escapeHtml(
        order.customerName
      )}</p><p>${escapeHtml(order.deliveryAddress)}</p><p>Order: ${escapeHtml(
        order.orderNumber
      )}</p><p>Official Archon Nell Return Authorization (RMA) Label.</p></div></body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    cancelModalOrder,
    cancelReasonType,
    setCancelReasonType,
    cancelOtherReason,
    setCancelOtherReason,
    openCancelModal,
    closeCancelModal,
    confirmCancelOrder,
    isCancelSubmitDisabled,
    openTracking,
    openRefund,
    openRateModal,
    reorder,
    printReturnLabel,
    filteredOrders,
    rejectionPopupOrder,
    dismissRejectionPopup
  };
}

export default useCustomerOrdersPageController;
