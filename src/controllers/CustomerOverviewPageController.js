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
    const isDelivered = order.status === 'DELIVERED';
    const isCancelled = order.status === 'CANCELLED';
    const statusBadgeClass = isDelivered
      ? 'bg-emerald-500/15 text-emerald-300'
      : isCancelled
      ? 'bg-rose-500/15 text-rose-300'
      : 'bg-blue-500/15 text-blue-200';

    const statusLabels = {
      CONFIRMED: 'Processing',
      PREPARING: 'Preparing',
      IN_TRANSIT: 'Shipped · Out for delivery',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUND_REQUESTED: 'Return under review',
      REFUNDED: 'Refund completed'
    };

    return {
      orderNumber: order.orderNumber,
      statusLabel: statusLabels[order.status] || order.status,
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
