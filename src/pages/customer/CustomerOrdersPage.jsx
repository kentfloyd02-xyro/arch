import React from 'react';
import { useCustomerOrdersPageController } from '../../controllers/CustomerOrdersPageController';
import {
  Search,
  MapPin,
  Star,
  Truck,
  Download,
  ShoppingBag,
  RotateCcw,
  X
} from 'lucide-react';

const panelClass = 'rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6';

export default function CustomerOrdersPage() {
  const {
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
  } = useCustomerOrdersPageController();

  return (
    <section className={panelClass}>
      {/* Header and Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Order history</h2>
          <p className="mt-1 text-[10px] text-slate-400">
            Invoices, reorder, delivery progress, and returns
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an order"
              className="w-40 rounded-lg border border-[#142958] bg-[#07132c] py-2 pl-8 pr-2 text-[10px] text-white sm:w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[#142958] bg-[#07132c] px-2 text-[10px] text-white cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="IN_TRANSIT">IN TRANSIT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUND_REQUESTED">REFUND REQUESTED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-[#142958] bg-[#07132c] p-8 text-center text-xs text-slate-400">
          No orders match this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <article
              key={order.orderNumber}
              className="rounded-xl border border-[#142958] bg-[#07132c] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono text-xs text-blue-300">
                      {order.orderNumber}
                    </strong>
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-bold ${order.statusBadgeClass}`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Placed {order.formattedDate} · {order.items.length} item types
                  </p>
                </div>
                <strong className="text-sm text-white font-mono">{order.formattedTotal}</strong>
              </div>

              {/* Items List */}
              <div className="mt-3 space-y-2 border-t border-[#142958] pt-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="font-mono">{item.formattedTotal}</span>
                    {order.delivered && (
                      <button
                        type="button"
                        onClick={() => openRateModal(order)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-200 hover:bg-amber-500/20"
                      >
                        <Star
                          size={11}
                          className={order.rating ? 'fill-amber-400 text-amber-400' : ''}
                        />
                        {order.rating ? `Rated (${order.rating}★)` : 'Rate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {order.deliveryAddress && (
                <p className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-400">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  {order.deliveryAddress}
                </p>
              )}

              {order.delivered && order.rating && (
                <div className="mt-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-[10px] text-amber-200 flex items-start gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0 mt-0.5">
                    {[...Array(order.rating)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-amber-300">Your Rating &amp; Notes: </span>
                    <span className="italic text-slate-200">"{order.notes}"</span>
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#142958] pt-3">
                <button
                  onClick={() => openTracking(order)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  <Truck size={13} />
                  Track order
                </button>

                {order.delivered && (
                  <button
                    type="button"
                    onClick={() => openRateModal(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-[10px] font-bold text-amber-200 hover:bg-amber-500/25 shadow-sm transition-all"
                  >
                    <Star
                      size={13}
                      className={order.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-300'}
                    />
                    <span>{order.rating ? `Rated (${order.rating}★)` : 'Rate'}</span>
                  </button>
                )}

                <button
                  onClick={() => downloadInvoice(order)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-[#142958] transition-colors"
                >
                  <Download size={13} />
                  Invoice
                </button>

                <button
                  onClick={() => reorder(order)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-[#142958] transition-colors"
                >
                  <ShoppingBag size={13} />
                  Reorder
                </button>

                {order.delivered && !order.returnRequested && (
                  <button
                    onClick={() => openRefund(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-3 py-2 text-[10px] font-bold text-purple-200 hover:bg-purple-500/20 transition-colors"
                  >
                    <RotateCcw size={13} />
                    Request return
                  </button>
                )}

                {order.returnRequested && (
                  <button
                    onClick={() => printReturnLabel(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-3 py-2 text-[10px] font-bold text-purple-200 hover:bg-purple-500/20 transition-colors"
                  >
                    <Download size={13} />
                    Print return label
                  </button>
                )}

                {order.canCancel && (
                  <button
                    type="button"
                    onClick={() => openCancelModal(order)}
                    className="rounded-lg border border-rose-500/25 px-3 py-2 text-[10px] font-bold text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    Cancel order
                  </button>
                )}
              </div>

              {order.inProgress && (
                <p className="mt-2 text-[9px] text-slate-500">
                  Status updates are synced with our dispatch logistics system.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#142958] bg-[#0b1b3d] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#142958] pb-3">
              <h3 className="text-sm font-bold text-white">
                <span>Cancel Order #{cancelModalOrder.orderNumber}</span>
              </h3>
              <button onClick={closeCancelModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={confirmCancelOrder} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Cancellation Reason: *
                </label>
                <select
                  value={cancelReasonType}
                  onChange={(e) => {
                    setCancelReasonType(e.target.value);
                    if (e.target.value !== 'Other reason') {
                      setCancelOtherReason('');
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

              {cancelReasonType === 'Other reason' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Specify Reason (8–25 characters): *
                  </label>
                  <input
                    type="text"
                    value={cancelOtherReason}
                    onChange={(e) => setCancelOtherReason(e.target.value.slice(0, 25))}
                    placeholder="Enter reason..."
                    className="w-full rounded-xl border border-[#142958] bg-[#07132c] p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="rounded-lg border border-[#142958] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#142958]"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelSubmitDisabled}
                  className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
