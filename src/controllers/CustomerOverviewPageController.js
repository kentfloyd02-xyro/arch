import { useApp } from '../context/AppContext';

export function formatMoney(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function useCustomerOverviewPageController() {
  const { currentUser, orders, setCurrentView } = useApp();

  const knownEmails = [currentUser?.email, ...(currentUser?.previousEmails || [])]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const customerOrders = orders.filter(
    (order) =>
      !knownEmails.length ||
      knownEmails.includes((order.customerEmail || '').toLowerCase())
  );

  const activeOrders = customerOrders.filter((order) =>
    ['CONFIRMED', 'PREPARING', 'IN_TRANSIT'].includes(order.status)
  );

  const validPurchasedOrders = customerOrders.filter(
    (order) => !['CANCELLED', 'REFUNDED'].includes(order.status)
  );

  const purchasedTotal = validPurchasedOrders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0
  );

  const rewardPoints = Math.floor(purchasedTotal / 100);
  const rewardTier =
    rewardPoints >= 10000
      ? 'Platinum'
      : rewardPoints >= 3000
      ? 'Gold'
      : rewardPoints >= 500
      ? 'Silver'
      : 'Member';

  const recentOrders = customerOrders.slice(0, 3).map((order) => {
    const rawStatus = String(order.status || '').toUpperCase();
    const rDetails = order.refundDetails || {};
    const rStatus = String(rDetails.refundStatus || '').toUpperCase();
    const isRejectedRefund = rawStatus === 'REFUND_REJECTED' || rStatus === 'REJECTED' || Boolean(rDetails.rejectedReason);
    const isApprovedRefund = rawStatus === 'REFUNDED' || rStatus === 'APPROVED';
    const isRefundRequested = (rawStatus === 'REFUND_REQUESTED' || rStatus === 'PENDING_REVIEW') && !isRejectedRefund && !isApprovedRefund;
    const isDelivered = rawStatus === 'DELIVERED';
    const isCancelled = rawStatus === 'CANCELLED';

    let statusBadgeClass = 'bg-blue-500/15 text-blue-200';
    let statusLabel = rawStatus;

    if (isRejectedRefund) {
      statusLabel = 'Return rejected';
      statusBadgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    } else if (isApprovedRefund) {
      statusLabel = 'Return approved';
      statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    } else if (isRefundRequested) {
      statusLabel = 'Return under review';
      statusBadgeClass = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    } else if (isCancelled) {
      statusLabel = 'Cancelled';
      statusBadgeClass = 'bg-rose-500/15 text-rose-300';
    } else if (isDelivered) {
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

    return {
      orderNumber: order.orderNumber,
      statusLabel,
      statusBadgeClass,
      formattedDate: new Date(order.date || order.createdAt).toLocaleDateString(),
      formattedTotal: formatMoney(order.totalAmount),
      itemsCount: order.items?.length || 0
    };
  });

  return {
    customerName: currentUser?.name || 'Customer',
    ordersCount: customerOrders.length,
    activeOrdersCount: activeOrders.length,
    purchasedTotalFormatted: formatMoney(purchasedTotal),
    rewardPointsFormatted: rewardPoints.toLocaleString(),
    rewardTier,
    recentOrders,
    setCurrentView
  };
}

export default useCustomerOverviewPageController;
