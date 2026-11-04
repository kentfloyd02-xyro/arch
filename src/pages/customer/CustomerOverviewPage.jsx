import React from 'react';
import { useCustomerOverviewPageController } from '../../controllers/CustomerOverviewPageController';
import { Package, Truck, Wallet, Star, ArrowRight } from 'lucide-react';

const panelClass = 'rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6';

export default function CustomerOverviewPage({ onNavigateSection }) {
  const {
    customerName,
    ordersCount,
    activeOrdersCount,
    purchasedTotalFormatted,
    rewardPointsFormatted,
    rewardTier,
    recentOrders
  } = useCustomerOverviewPageController();

  return (
    <div className="space-y-5">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className={panelClass}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Orders</span>
            <Package size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{ordersCount}</div>
          <div className="mt-1 text-[10px] text-slate-400">Placed in store</div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">In Progress</span>
            <Truck size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{activeOrdersCount}</div>
          <div className="mt-1 text-[10px] text-slate-400">Processing or shipping</div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Completed Spend</span>
            <Wallet size={16} className="text-emerald-400" />
          </div>
          <div className="truncate text-lg font-black text-emerald-300 font-mono">
            {purchasedTotalFormatted}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Net delivered orders</div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">{rewardTier} Member</span>
            <Star size={16} className="text-violet-400" />
          </div>
          <div className="text-2xl font-black text-violet-300">{rewardPointsFormatted}</div>
          <div className="mt-1 text-[10px] text-slate-400">Loyalty points earned</div>
        </div>
      </div>

      {/* Recent Orders Preview */}
      <section className={panelClass}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-white">Recent Purchases</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Your most recent orders and current delivery states
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection?.('orders')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View all orders</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-[#142958] bg-[#07132c] p-6 text-center text-xs text-slate-400">
            You haven't placed any orders yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentOrders.map((order) => (
              <div
                key={order.orderNumber}
                className="flex items-center justify-between p-3 rounded-xl border border-[#142958] bg-[#07132c] hover:border-blue-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-300">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${order.statusBadgeClass}`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {order.formattedDate} · {order.itemsCount} item types
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-white">
                  {order.formattedTotal}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
