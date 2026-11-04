import React from 'react';
import { useAdminOrdersPageController } from '../../controllers/AdminOrdersPageController';
import { FileText, Search, Printer, CheckCircle2, X } from 'lucide-react';

export default function AdminOrdersPage() {
  const {
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
  } = useAdminOrdersPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#142958]">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Customer Purchase Orders ({filteredOrders.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process invoices, approve packaging, dispatch warehouse orders, and print compliance receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={orderStatusFilter}
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-[#07132c] text-xs font-semibold text-white rounded-xl border border-[#142958] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="return">Return Requested</option>
            <option value="refund">Refunded</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order #, customer..."
              className="pl-8 pr-3 py-1.5 bg-[#07132c] text-xs text-white placeholder-slate-400 rounded-xl border border-[#142958] focus:outline-none w-44 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
            No orders match your filter criteria.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.orderNumber}
              className="p-4 sm:p-5 rounded-2xl bg-[#07132c] border border-[#142958] space-y-3 hover:border-blue-500/40 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-[#142958]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
                    {order.orderNumber}
                  </span>
                  <span className="text-[10px] bg-[#0b1b3d] text-slate-300 font-bold px-2 py-0.5 rounded border border-[#142958]">
                    {order.paymentMethod}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {order.formattedDate}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                  {order.formattedTotal}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Contractor / Client:
                  </span>
                  <span className="text-white font-semibold">{order.customerName}</span>
                  <span className="text-slate-400 text-[11px] block">
                    {order.customerEmail} · {order.customerPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Delivery Address:
                  </span>
                  <span className="text-slate-300 text-[11px] line-clamp-2">
                    {order.deliveryAddress || 'No address specified'}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-[#0b1b3d] p-3 rounded-xl border border-[#142958] space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Purchased Items:
                </span>
                <div className="space-y-1">
                  {(order.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-[11px] text-slate-200"
                    >
                      <span className="truncate pr-2">
                        {item.title} <strong className="text-blue-300">×{item.quantity}</strong>
                      </span>
                      <span className="font-mono text-slate-400 whitespace-nowrap">
                        PHP {((item.total || item.price * item.quantity) || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    Status:
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${order.statusBadgeClass}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printOrderDocument(order, 'invoice')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] bg-[#0b1b3d] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-blue-500/50"
                  >
                    <Printer size={13} />
                    Print invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => printOrderDocument(order, 'label')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] bg-[#0b1b3d] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-blue-500/50"
                  >
                    <Printer size={13} />
                    Print shipping label
                  </button>

                  {order.isPending && (
                    <button
                      type="button"
                      onClick={() => openCancelModal(order.orderNumber)}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.isDelivered && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Delivered (Final)</span>
                    </span>
                  )}

                  {!order.isCancelled && !order.isRefund && order.nextConfig && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.orderNumber, order.nextConfig.next)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-md border border-white/10 active:scale-95 transition-all ${order.nextConfig.style}`}
                      title={`Advance order to ${order.nextConfig.next}`}
                    >
                      <span>{order.nextConfig.label}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Cancel Order Modal */}
      {adminCancelOrderNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#142958] bg-[#0b1b3d] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#142958] pb-3">
              <h3 className="text-sm font-bold text-white">
                <span>Cancel Order #{adminCancelOrderNumber}</span>
              </h3>
              <button onClick={closeCancelModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Cancellation Reason: *
                </label>
                <select
                  value={adminCancelReasonType}
                  onChange={(e) => {
                    setAdminCancelReasonType(e.target.value);
                    if (e.target.value !== 'Other reason') {
                      setAdminCancelOtherReason('');
                    }
                  }}
                  className="w-full rounded-xl border border-[#142958] bg-[#07132c] p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="Ordered wrong product or size">Ordered wrong product or size</option>
                  <option value="Job site schedule delayed">Job site schedule delayed</option>
                  <option value="Found lower price elsewhere">Found lower price elsewhere</option>
                  <option value="Change of project plans">Change of project plans</option>
                  <option value="Incorrect shipping address">Incorrect shipping address</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              {adminCancelReasonType === 'Other reason' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Custom Reason (8–25 characters): *
                  </label>
                  <input
                    type="text"
                    value={adminCancelOtherReason}
                    onChange={(e) => setAdminCancelOtherReason(e.target.value.slice(0, 25))}
                    placeholder="Enter specific reason..."
                    className="w-full rounded-xl border border-[#142958] bg-[#07132c] p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="px-3 py-1.5 rounded-lg border border-[#142958] text-slate-300 hover:bg-[#142958]"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={isCancelDisabled}
                  onClick={confirmAdminCancelOrder}
                  className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
