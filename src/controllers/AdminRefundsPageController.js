import { useApp } from '../context/AppContext';

export function useAdminRefundsPageController() {
  const { orders, approveRefund } = useApp();

  const refundOrders = orders
    .filter((o) => {
      const s = String(o.status || o.deliveryStatus || '').toUpperCase();
      return s === 'REFUND_REQUESTED' || s === 'REFUNDED';
    })
    .map((order) => {
      const s = String(order.status || order.deliveryStatus || '').toUpperCase();
      const isApproved = s === 'REFUNDED';
      const statusBadgeClass = isApproved
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      const statusLabel = isApproved ? 'Refund Approved' : 'Review Pending';
      const details = order.refundDetails || {};

      return {
        ...order,
        isApproved,
        statusBadgeClass,
        statusLabel,
        reason: details.reason || 'Damaged packaging',
        detailsText: details.details || '',
        damagePhoto: details.damagePhoto || null,
        formattedTotal: `PHP ${Number(order.totalAmount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      };
    });

  const handleApproveRefund = (orderNumber) => {
    approveRefund(orderNumber, true);
  };

  return {
    refundOrders,
    handleApproveRefund
  };
}

export default useAdminRefundsPageController;
