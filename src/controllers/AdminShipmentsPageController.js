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

export function useAdminShipmentsPageController() {
  const { orders, showToast } = useApp();

  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');

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

  const q = shipmentSearch.toLowerCase().trim();

  const filteredShipments = orders
    .filter((o) => {
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (shipmentStatusFilter !== 'all') {
        const mapped = mapStatusToKey(o.status);
        if (shipmentStatusFilter === 'return') {
          if (!['return', 'refund'].includes(mapped)) return false;
        } else if (mapped !== shipmentStatusFilter) {
          return false;
        }
      }
      return true;
    })
    .map((order) => {
      const statusKey = mapStatusToKey(order.status);
      const isDelivered = statusKey === 'delivered';
      const isShipped = statusKey === 'shipped';
      const isPreparing = statusKey === 'preparing';
      const isCancelled = order.status === 'CANCELLED';

      let statusDisplay = formatStatusLabel(order.status);
      if (order.status === 'REFUND_REQUESTED') statusDisplay = 'Return Under Review';
      if (order.status === 'REFUNDED') statusDisplay = 'Refund Processed';

      const statusBadgeClass = isDelivered
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : isCancelled
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : ['REFUND_REQUESTED', 'REFUNDED'].includes(order.status)
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : isShipped
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

      const progressionSteps = [
        { name: '1. Placed', done: true },
        { name: '2. Verified', done: true },
        { name: '3. Packed', done: isPreparing || isShipped || isDelivered },
        { name: '4. In-Transit', done: isShipped || isDelivered },
        { name: '5. Delivered', done: isDelivered }
      ].map((step) => ({
        ...step,
        stepClass: isCancelled
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          : step.done
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          : 'bg-[#07132c] border-[#142958] text-slate-500'
      }));

      return {
        ...order,
        statusDisplay,
        statusBadgeClass,
        progressionSteps,
        formattedDate: new Date(order.date || order.createdAt).toLocaleDateString(),
        formattedTotal: `PHP ${Number(order.totalAmount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      };
    });

  return {
    shipmentSearch,
    setShipmentSearch,
    shipmentStatusFilter,
    setShipmentStatusFilter,
    printOrderDocument,
    filteredShipments
  };
}

export default useAdminShipmentsPageController;
