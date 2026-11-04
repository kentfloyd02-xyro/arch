import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useAdminDashboardPageController() {
  const { orders, products } = useApp();

  const [showPrices, setShowPrices] = useState(() => {
    try {
      return localStorage.getItem('archon_admin_show_prices') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleShowPrices = () => {
    setShowPrices((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('archon_admin_show_prices', String(next));
      } catch {}
      return next;
    });
  };

  // Conditions & calculations for sales
  const validSalesOrders = orders.filter(
    (order) => order.status !== 'CANCELLED' && order.status !== 'REFUNDED'
  );

  const totalRevenue = validSalesOrders.reduce(
    (sum, order) => sum + (order.totalAmount || 0),
    0
  );

  const totalRevenueFormatted = showPrices
    ? `PHP ${totalRevenue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    : 'PHP ******';

  const totalOrdersCount = orders.length;

  const activeDeliveriesCount = orders.filter(
    (order) => order.status === 'PREPARING' || order.status === 'IN_TRANSIT'
  ).length;

  const lowStockProducts = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  );
  const lowStockCount = lowStockProducts.length;

  const outOfStockProducts = products.filter((product) => product.stock <= 0);
  const outOfStockCount = outOfStockProducts.length;

  const pendingRefundsCount = orders.filter(
    (order) => order.status === 'REFUND_REQUESTED'
  ).length;

  // Monthly trend calculations
  const rawMonthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - index));
    const key = d.toISOString().slice(0, 7);
    const revenue = validSalesOrders
      .filter((order) => {
        const orderDateStr = order.date || order.createdAt;
        return orderDateStr && String(orderDateStr).slice(0, 7) === key;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      key,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue
    };
  });

  const maxMonthlyRevenue = Math.max(
    1,
    ...rawMonthlyTrend.map((month) => month.revenue)
  );

  const monthlyTrend = rawMonthlyTrend.map((month) => ({
    ...month,
    heightPercent: `${Math.max(5, (month.revenue / maxMonthlyRevenue) * 78)}%`,
    formattedRevenue: showPrices
      ? month.revenue
        ? `${Math.round(month.revenue / 1000)}k`
        : '0'
      : '***'
  }));

  // Product sales ranking
  const rawProductSales = products
    .map((product) => {
      const pId = product.id || product.customId;
      return {
        id: product.id,
        title: product.title,
        soldInOrders: validSalesOrders.reduce(
          (sum, order) =>
            sum +
            (order.items || [])
              .filter(
                (item) =>
                  item.id === pId ||
                  item.customId === pId ||
                  item.productId === pId
              )
              .reduce((itemSum, item) => itemSum + item.quantity, 0),
          0
        )
      };
    })
    .sort((a, b) => b.soldInOrders - a.soldInOrders)
    .slice(0, 5);

  const maxSold = Math.max(1, rawProductSales[0]?.soldInOrders || 1);

  const productSales = rawProductSales.map((product) => ({
    ...product,
    widthPercent: `${Math.max(4, (product.soldInOrders / maxSold) * 100)}%`
  }));

  // Category sales
  const categoryTotals = validSalesOrders.reduce((summary, order) => {
    (order.items || []).forEach((item) => {
      const itemKey = item.id || item.customId || item.productId;
      const product = products.find(
        (candidate) => candidate.id === itemKey || candidate.customId === itemKey
      );
      const category = product?.category || 'mortar';
      summary[category] =
        (summary[category] || 0) + (item.total || item.price * item.quantity || 0);
    });
    return summary;
  }, {});

  const categoryEntries = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );
  const maxCategoryAmount = Math.max(1, categoryEntries[0]?.[1] || 1);

  const categoryColors = [
    'bg-cyan-400',
    'bg-violet-400',
    'bg-amber-400',
    'bg-emerald-400'
  ];

  const categorySales = categoryEntries.map(([category, amount], index) => ({
    category,
    amount,
    formattedAmount: showPrices
      ? `PHP ${amount.toLocaleString()}`
      : 'PHP ******',
    widthPercent: `${Math.max(3, (amount / maxCategoryAmount) * 100)}%`,
    colorClass: categoryColors[index % categoryColors.length]
  }));

  // Order status pipeline counts
  const mapKey = (status) => {
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
  };

  const statusCounts = [
    { label: 'Pending', key: 'pending' },
    { label: 'Preparing', key: 'preparing' },
    { label: 'Shipped', key: 'shipped' },
    { label: 'Delivered', key: 'delivered' },
    { label: 'Cancelled', key: 'cancelled' },
    { label: 'Return', key: 'return' },
    { label: 'Refund', key: 'refund' }
  ].map(({ label, key }) => ({
    label,
    key,
    count: orders.filter((order) => mapKey(order.status) === key).length
  }));

  // Customer account count
  const customerEmailSet = new Set();
  orders.forEach((o) => {
    if (o.customerEmail) customerEmailSet.add(o.customerEmail.toLowerCase().trim());
  });
  const customersCount = customerEmailSet.size;

  const promoCodes = ['ARCHON20', 'ARCHON500', 'FREESHIP'];

  return {
    showPrices,
    toggleShowPrices,
    totalRevenueFormatted,
    totalOrdersCount,
    activeDeliveriesCount,
    lowStockCount,
    outOfStockCount,
    pendingRefundsCount,
    customersCount,
    monthlyTrend,
    productSales,
    categorySales,
    statusCounts,
    promoCodes
  };
}

export default useAdminDashboardPageController;
