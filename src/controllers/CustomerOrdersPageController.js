import { useState } from 'react';
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

  const knownEmails = [currentUser?.email, ...(currentUser?.previousEmails || [])]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const customerOrders = orders.filter(
    (order) =>
      !knownEmails.length ||
      knownEmails.includes((order.customerEmail || '').toLowerCase())
  );

  const q = search.trim().toLowerCase();

  const filteredOrders = customerOrders
    .filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        (order.items || []).some((item) => item.title.toLowerCase().includes(q));
      return matchesSearch && (statusFilter === 'all' || order.status === statusFilter);
    })
    .map((order) => {
      const delivered = order.status === 'DELIVERED';
      const returnRequested = ['REFUND_REQUESTED', 'REFUNDED'].includes(order.status);
      const isCancelled = order.status === 'CANCELLED';
      const canCancel = ['CONFIRMED', 'PENDING'].includes(order.status);
      const inProgress = ['CONFIRMED', 'PREPARING', 'IN_TRANSIT'].includes(order.status);

      const statusLabels = {
        CONFIRMED: 'Processing',
        PREPARING: 'Preparing',
        IN_TRANSIT: 'Shipped · Out for delivery',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
        REFUND_REQUESTED: 'Return under review',
        REFUNDED: 'Refund completed'
      };

      const statusBadgeClass = delivered
        ? 'bg-emerald-500/15 text-emerald-300'
        : isCancelled
        ? 'bg-rose-500/15 text-rose-300'
        : 'bg-blue-500/15 text-blue-200';

      const items = (order.items || []).map((item) => ({
        ...item,
        formattedTotal: formatMoney(item.total ?? item.price * item.quantity)
      }));

      return {
        ...order,
        delivered,
        returnRequested,
        isCancelled,
        canCancel,
        inProgress,
        statusLabel: statusLabels[order.status] || order.status,
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

  const downloadInvoice = (order) => {
    const rawDate = order.date || order.createdAt || order.created_at;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const formattedDate = isNaN(parsedDate.getTime())
      ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const rows = (order.items || [])
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.title)}</td><td>${item.quantity}</td><td>${formatMoney(
            item.total ?? item.price * item.quantity
          )}</td></tr>`
      )
      .join('');
    const invoice = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(
      order.orderNumber
    )}</title><style>body{font:14px Arial,sans-serif;color:#172033;padding:40px;max-width:800px;margin:auto}h1{color:#102750}table{border-collapse:collapse;width:100%;margin-top:24px}td,th{text-align:left;padding:12px;border-bottom:1px solid #dbe2ef}</style></head><body><h1>Archon Nell · Order Invoice</h1><p>Order ${escapeHtml(
      order.orderNumber
    )} · ${formattedDate}</p><p>${escapeHtml(
      order.customerName
    )}<br>${escapeHtml(order.customerEmail)}<br>${escapeHtml(
      order.deliveryAddress
    )}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><h2>Total: ${formatMoney(
      order.totalAmount
    )}</h2><p>Official Customer Invoice.</p></body></html>`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([invoice], { type: 'text/html' }));
    link.download = `invoice-${order.orderNumber}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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
    downloadInvoice,
    printReturnLabel,
    filteredOrders
  };
}

export default useCustomerOrdersPageController;
