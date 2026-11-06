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
  X,
  AlertTriangle,
  XCircle,
  AlertCircle
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
    printReturnLabel,
    filteredOrders,
    rejectionPopupOrder,
    dismissRejectionPopup
  } = useCustomerOrdersPageController();

  return (
    <section className={panelClass}>
      {/* Header and Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">Order history</h2>
          <p className="mt-1 text-[10px] text-slate-400">
            Reorder, delivery progress, and returns tracking
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
            <option value="REFUND_REJECTED">RETURN REJECTED</option>
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
              className="rounded-xl border border-[#142958] bg-[#07132c] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono text-xs text-blue-300">
                      {order.orderNumber}
                    </strong>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${order.statusBadgeClass}`}
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
              <div className="space-y-2 border-t border-[#142958] pt-3">
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
                      (order.rating || order.customerRating || order.isRated) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300 cursor-default select-none"
                          title="Rating locked"
                        >
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span>Rated ({order.customerRating || order.rating || 5}★)</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRateModal(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-200 hover:bg-amber-500/20"
                        >
                          <Star size={11} />
                          <span>Rate</span>
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>

              {order.deliveryAddress && (
                <p className="flex items-start gap-1.5 text-[10px] text-slate-400">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  {order.deliveryAddress}
                </p>
              )}

              {/* Rating & Notes display */}
              {order.delivered && order.rating && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-[10px] text-amber-200 flex items-start gap-2">
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

              {/* Rejection Notice Banner */}
              {order.isRejectedRefund && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 p-3.5 text-xs text-rose-200 shadow-md space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <XCircle size={16} className="text-rose-400 shrink-0" />
                    <span className="text-xs uppercase tracking-wide">NOTICE: Return Request Rejected</span>
                  </div>
                  <div className="bg-[#07132c] p-2.5 rounded-lg border border-rose-500/25 space-y-1">
                    <div className="text-[11px] text-slate-200">
                      <span className="font-bold text-rose-300">Admin Rejection Reason: </span>
                      <span className="italic">"{order.refundDetails?.rejectedReason || 'Claim criteria not met or invalid proof'}"</span>
                    </div>
                    {order.refundDetails?.rejectedAt && (
                      <p className="text-[9px] text-slate-400">
                        Rejected on {new Date(order.refundDetails.rejectedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300">
                    ⚠️ <strong>1-Trial Limit Policy:</strong> Under Archon Nell store policy, each delivered order item has a single (1) return evaluation trial. Because this claim was reviewed and rejected, return requests for this order have been permanently closed.
                  </p>
                </div>
              )}

              {/* Order Actions */}
              <div className="flex flex-wrap gap-2 border-t border-[#142958] pt-3">
                <button
                  onClick={() => openTracking(order)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  <Truck size={13} />
                  Track order
                </button>

                {order.delivered && (
                  (order.rating || order.customerRating || order.isRated) ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-300 cursor-default select-none shadow-sm"
                      title="Rating already submitted and locked"
                    >
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>Rated ({order.customerRating || order.rating || 5}★)</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openRateModal(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-[10px] font-bold text-amber-200 hover:bg-amber-500/25 shadow-sm transition-all"
                    >
                      <Star size={13} className="text-amber-300" />
                      <span>Rate</span>
                    </button>
                  )
                )}

                <button
                  onClick={() => reorder(order)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] px-3 py-2 text-[10px] font-bold text-slate-200 hover:bg-[#142958] transition-colors"
                >
                  <ShoppingBag size={13} />
                  Reorder
                </button>

                {/* Return Request Button: ONLY if delivered AND trial has NOT been used */}
                {order.canRequestReturn && (
                  <button
                    onClick={() => openRefund(order)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-3 py-2 text-[10px] font-bold text-purple-200 hover:bg-purple-500/20 transition-colors"
                  >
                    <RotateCcw size={13} />
                    Request return
                  </button>
                )}

                {/* Print return label ONLY when return is currently under review */}
                {order.returnRequested && !order.isRejectedRefund && (
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

      {/* Customer Notification Popup for Rejected Return */}
      {rejectionPopupOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1b3d] border border-rose-500/40 rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-6 text-white space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#142958]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Return Claim Rejected
                  </h3>
                  <p className="text-xs font-mono text-rose-300">
                    Order #{rejectionPopupOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissRejectionPopup}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#142958]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Your return/refund claim for Order <span className="font-mono font-bold text-white">#{rejectionPopupOrder.orderNumber}</span> has been reviewed by Archon Nell Quality Control and was <span className="text-rose-400 font-bold uppercase">Rejected</span>.
              </p>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <span className="block text-[10px] uppercase font-bold text-rose-300 mb-0.5">
                  Rejection Reason:
                </span>
                <span className="text-slate-100 font-medium">
                  "{rejectionPopupOrder.refundDetails?.rejectedReason || 'Claim did not satisfy engineering inspection standards.'}"
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>1-Trial Return Policy:</strong> Each purchased order item is entitled to 1 return inspection evaluation only. Re-submitting return claims for this order is now disabled.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={dismissRejectionPopup}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
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
