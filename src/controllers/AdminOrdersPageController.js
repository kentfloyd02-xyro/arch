import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function mapStatusToKey(status) {
  if (!status) return 'pending';
  const s = String(status).toUpperCase();
  if (s === 'CONFIRMED' || s === 'PENDING') return 'pending';
  if (s === 'PREPARING') return 'preparing';
  if (s === 'IN_TRANSIT' || s === 'SHIPPED') return 'shipped';
  if (s === 'DELIVERED') return 'delivered';
  if (s === 'REFUND_REQUESTED' || s === 'RETURN') return 'return';
  if (s === 'REFUNDED' || s === 'REFUND') return 'refund';
  if (s === 'CANCELLED') return 'cancelled';
  return 'pending';
}

export function formatStatusLabel(status) {
  const key = mapStatusToKey(status);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function useAdminOrdersPageController() {
  const { orders, updateOrderStatus, cancelOrder, showToast } = useApp();

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [adminCancelOrderNumber, setAdminCancelOrderNumber] = useState(null);
  const [adminCancelReasonType, setAdminCancelReasonType] = useState(
    'Ordered wrong product or size'
  );
  const [adminCancelOtherReason, setAdminCancelOtherReason] = useState('');

  const openCancelModal = (orderNumber) => {
    setAdminCancelOrderNumber(orderNumber);
    setAdminCancelReasonType('Ordered wrong product or size');
    setAdminCancelOtherReason('');
  };

  const closeCancelModal = () => {
    setAdminCancelOrderNumber(null);
    setAdminCancelReasonType('Ordered wrong product or size');
    setAdminCancelOtherReason('');
  };

  const confirmAdminCancelOrder = () => {
    if (adminCancelReasonType === 'Other reason') {
      const trimmed = adminCancelOtherReason.trim();
      if (trimmed.length < 8) {
        showToast('Other reason must be at least 8 characters.', 'warning');
        return;
      }
      if (trimmed.length > 25) {
        showToast('Other reason cannot exceed 25 characters.', 'warning');
        return;
      }
      cancelOrder(adminCancelOrderNumber, trimmed);
    } else {
      cancelOrder(adminCancelOrderNumber, adminCancelReasonType);
    }
    closeCancelModal();
  };

  const printOrderDocument = (order, type) => {
    const isInvoice = type === 'invoice';
    const rawDate = order.date || order.createdAt || order.created_at;
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const formattedDate = isNaN(parsedDate.getTime())
      ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const rows = (order.items || [])
      .map(
        (item) =>
          `<tr><td>${item.title}</td><td>${item.quantity}</td><td>PHP ${(
            item.total || item.price * item.quantity
          ).toLocaleString()}</td></tr>`
      )
      .join('');
    const popup = window.open('', '_blank', 'width=800,height=900');
    if (!popup) {
      showToast('Allow pop-ups to print this document.', 'warning');
      return;
    }
    popup.document.write(
      `<!doctype html><html><head><title>${
        isInvoice ? 'Invoice' : 'Shipping Label'
      } ${order.orderNumber}</title><style>body{font:14px Arial,sans-serif;color:#111;padding:36px}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px;border-bottom:1px solid #ccc;text-align:left}.label{border:2px solid #111;padding:24px;max-width:520px}.muted{color:#555}</style></head><body>${
        isInvoice
          ? `<h1>Archon Nell — Order Invoice</h1><p>Order: ${order.orderNumber}<br>Date: ${formattedDate}</p><h3>${order.customerName}</h3><p>${
              order.customerEmail || ''
            }<br>${order.customerPhone || ''}<br>${
              order.deliveryAddress || ''
            }</p><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><h2>Total: PHP ${order.totalAmount.toLocaleString()}</h2><p class="muted">Official Archon Nell Commercial Invoice.</p>`
          : `<div class="label"><h1>SHIP TO</h1><h2>${order.customerName}</h2><p>${
              order.deliveryAddress || 'No delivery address on record'
            }</p><p>${order.customerPhone || ''}</p><hr><strong>${
              order.orderNumber
            }</strong><p class="muted">Shipping label preview — no carrier booking created.</p></div>`
      }</body></html>`
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const q = orderSearch.toLowerCase().trim();

  const filteredOrders = orders
    .filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.gcashRefNumber && o.gcashRefNumber.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (orderStatusFilter !== 'all') {
        const mapped = mapStatusToKey(o.status);
        if (mapped !== orderStatusFilter && o.status !== orderStatusFilter) {
          return false;
        }
      }

      return true;
    })
    .map((order) => {
      const mappedKey = mapStatusToKey(order.status);
      const isPending = mappedKey === 'pending';
      const isCancelled = order.status === 'CANCELLED';
      const isDelivered = order.status === 'DELIVERED';
      const isRefund =
        order.status === 'REFUNDED' || order.status === 'REFUND_REQUESTED';

      const statusBadgeClass = isDelivered
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : isCancelled
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : isRefund
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

      const nextConfigMap = {
        CONFIRMED: {
          next: 'PREPARING',
          label: 'Next: Preparing →',
          style: 'bg-amber-600 hover:bg-amber-500 text-white'
        },
        PENDING: {
          next: 'PREPARING',
          label: 'Next: Preparing →',
          style: 'bg-amber-600 hover:bg-amber-500 text-white'
        },
        PREPARING: {
          next: 'IN_TRANSIT',
          label: 'Next: Shipped →',
          style: 'bg-blue-600 hover:bg-blue-500 text-white'
        },
        IN_TRANSIT: {
          next: 'DELIVERED',
          label: 'Next: Delivered →',
          style: 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }
      };

      const nextConfig = nextConfigMap[order.status] || null;

      return {
        ...order,
        mappedKey,
        isPending,
        isCancelled,
        isDelivered,
        isRefund,
        statusLabel: formatStatusLabel(order.status),
        statusBadgeClass,
        nextConfig,
        formattedDate: new Date(order.date || order.createdAt).toLocaleDateString(),
        formattedTotal: `PHP ${Number(order.totalAmount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      };
    });

  const isCancelDisabled =
    adminCancelReasonType === 'Other reason' &&
    (adminCancelOtherReason.trim().length < 8 ||
      adminCancelOtherReason.trim().length > 25);

  return {
    orderSearch,
    setOrderSearch,
    orderStatusFilter,
    setOrderStatusFilter,
    adminCancelOrderNumber,
    adminCancelReasonType,
    setAdminCancelReasonType,
    adminCancelOtherReason,
    setAdminCancelOtherReason,
    openCancelModal,
    closeCancelModal,
    confirmAdminCancelOrder,
    isCancelDisabled,
    updateOrderStatus,
    printOrderDocument,
    filteredOrders
  };
}

export default useAdminOrdersPageController;
