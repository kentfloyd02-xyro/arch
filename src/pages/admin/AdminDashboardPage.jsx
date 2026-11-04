import React from 'react';
import { useAdminDashboardPageController } from '../../controllers/AdminDashboardPageController';
import {
  DollarSign,
  ShoppingBag,
  Truck,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminDashboardPage({ onNavigateTab }) {
  const {
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
  } = useAdminDashboardPageController();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-[#0b1b3d] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-md flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-xl font-black text-emerald-400 truncate font-mono">
                {totalRevenueFormatted}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
                Total Sales
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleShowPrices}
            className="p-1.5 sm:p-2 rounded-xl bg-[#07132c] border border-[#142958] hover:border-emerald-500/50 text-slate-400 hover:text-emerald-300 transition-all flex-shrink-0"
            title={showPrices ? 'Hide price (show asterisks)' : 'Show price'}
          >
            {showPrices ? (
              <Eye className="w-4 h-4 text-emerald-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        <div className="bg-[#0b1b3d] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-md flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base sm:text-2xl font-black text-white">
              {totalOrdersCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
              Total Orders
            </div>
          </div>
        </div>

        <div className="bg-[#0b1b3d] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-md flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base sm:text-2xl font-black text-amber-400">
              {activeDeliveriesCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
              Active In-Transit
            </div>
          </div>
        </div>

        <div className="bg-[#0b1b3d] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-md flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base sm:text-2xl font-black text-rose-400">
              {lowStockCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">
              Low Stock Alert
            </div>
          </div>
        </div>
      </div>

      {/* Overview Banner */}
      <section className="flex items-center justify-between gap-5 rounded-[20px] border border-[#142958] bg-[linear-gradient(115deg,#0b1b3d,#102750)] px-6 py-[22px] max-[520px]:flex-col max-[520px]:items-start max-[520px]:p-[17px]">
        <div>
          <span className="text-[10px] font-extrabold tracking-[.12em] text-[#8294b3]">
            OVERVIEW
          </span>
          <h2 className="mt-1.5 text-[22px] font-extrabold text-white">Dashboard</h2>
          <p className="mt-1 text-xs text-slate-400">
            Here's what's happening across your store today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab?.('orders')}
          className="flex flex-row-reverse items-center gap-[7px] rounded-[10px] bg-blue-600 px-[13px] py-2.5 text-[11px] font-bold text-white hover:bg-blue-500 transition-colors"
        >
          <ArrowLeft className="rotate-180" size={15} />
          Review orders
        </button>
      </section>

      {/* Grid of Analytics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Revenue Trend */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">Revenue trend</h3>
              <p className="mt-1 text-[10px] text-slate-400">Monthly Sales · PHP</p>
            </div>
            <TrendingUp size={17} className="text-blue-300" />
          </div>
          <div className="mt-5 flex h-36 items-end gap-2 sm:gap-4">
            {monthlyTrend.map((month) => (
              <div
                key={month.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[9px] text-slate-400 font-mono">
                  {month.formattedRevenue}
                </span>
                <div
                  className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-700 to-cyan-400"
                  style={{ height: month.heightPercent }}
                />
                <span className="text-[9px] text-slate-500">{month.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top-selling Products */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">Top-selling products</h3>
              <p className="mt-1 text-[10px] text-slate-400">Units Sold</p>
            </div>
            <ShoppingBag size={17} className="text-emerald-300" />
          </div>
          <div className="mt-4 space-y-3">
            {productSales.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-200">
                    {product.title}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#142958]">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: product.widthPercent }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-300">
                  {product.soldInOrders}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Sales by Category */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-white">Sales by category</h3>
          <p className="mt-1 text-[10px] text-slate-400">
            Based on items in recorded orders
          </p>
          <div className="mt-4 space-y-3">
            {categorySales.length ? (
              categorySales.map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <span className="w-24 truncate text-xs capitalize text-slate-300">
                    {item.category}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-[#142958]">
                    <div
                      className={`h-full rounded-full ${item.colorClass}`}
                      style={{ width: item.widthPercent }}
                    />
                  </div>
                  <span className="w-24 text-right text-[10px] text-slate-400 font-mono">
                    {item.formattedAmount}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No order line items recorded yet.</p>
            )}
          </div>
        </section>

        {/* Order Pipeline */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-white">Order pipeline</h3>
          <p className="mt-1 text-[10px] text-slate-400">Current order status counts</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {statusCounts.map(({ label, key, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => onNavigateTab?.('orders', key)}
                className="rounded-xl border border-[#142958] bg-[#07132c] p-3 text-left hover:border-blue-500/50 transition-all"
              >
                <span className="block text-[9px] font-bold text-slate-400 uppercase">
                  {label}
                </span>
                <span className="mt-1 block text-lg font-black text-white">{count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Inventory Alerts */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Inventory alerts</h3>
            <AlertTriangle size={17} className="text-amber-300" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab?.('inventory')}
              className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-left hover:bg-amber-500/15 transition-colors"
            >
              <span className="block text-[10px] text-amber-200">
                Low stock (10 or fewer)
              </span>
              <strong className="mt-1 block text-xl text-amber-300">
                {lowStockCount}
              </strong>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.('inventory')}
              className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-left hover:bg-rose-500/15 transition-colors"
            >
              <span className="block text-[10px] text-rose-200">Out of stock</span>
              <strong className="mt-1 block text-xl text-rose-300">
                {outOfStockCount}
              </strong>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab?.('inventory')}
            className="mt-3 text-[10px] font-bold text-blue-300 hover:underline"
          >
            Open inventory →
          </button>
        </section>

        {/* Returns & Insights */}
        <section className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Returns &amp; customer insights
              </h3>
              <p className="mt-1 text-[10px] text-slate-400">
                Customer Accounts &amp; Orders
              </p>
            </div>
            <Users size={17} className="text-violet-300" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#142958] bg-[#07132c] p-3">
              <span className="block text-[10px] text-slate-400">
                Customer profiles in orders
              </span>
              <strong className="mt-1 block text-xl text-white">{customersCount}</strong>
            </div>
            <div className="rounded-xl border border-[#142958] bg-[#07132c] p-3">
              <span className="block text-[10px] text-slate-400">
                Pending return requests
              </span>
              <strong className="mt-1 block text-xl text-purple-300">
                {pendingRefundsCount}
              </strong>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {promoCodes.map((code) => (
              <span
                key={code}
                className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 font-mono text-[9px] text-blue-200"
              >
                {code}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-slate-500">
            Traffic sources, campaign performance, loyalty, and abandoned-cart logs are
            not collected in this demo.
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab?.('refunds')}
            className="mt-2 text-[10px] font-bold text-purple-300 hover:underline"
          >
            Review return requests →
          </button>
        </section>
      </div>
    </div>
  );
}
