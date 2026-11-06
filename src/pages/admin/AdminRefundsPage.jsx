import React from 'react';
import { useAdminRefundsPageController } from '../../controllers/AdminRefundsPageController';
import { RotateCcw, CheckCircle2, ArchiveRestore, XCircle, AlertTriangle, X } from 'lucide-react';

export default function AdminRefundsPage() {
  const {
    refundOrders,
    handleApproveRefund,
    rejectModalOrder,
    rejectReason,
    setRejectReason,
    customReason,
    setCustomReason,
    openRejectModal,
    closeRejectModal,
    handleConfirmReject,
    isSubmitting
  } = useAdminRefundsPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-[#142958]">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-purple-400" />
          <span>Returns, Damaged Material &amp; Refund Claims ({refundOrders.length})</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review return claims under Consumer Act (RA 7394). Single 1-trial return limit per order.
        </p>
      </div>

      {/* Refunds List */}
      <div className="space-y-3">
        {refundOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
            No pending or processed refund requests at this time.
          </div>
        ) : (
          refundOrders.map((order) => (
            <div
              key={order.orderNumber}
              className="p-4 sm:p-5 rounded-2xl bg-[#07132c] border border-[#142958] space-y-3 hover:border-purple-500/40 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-[#142958]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs sm:text-sm text-purple-300">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${order.statusBadgeClass}`}
                  >
                    {order.statusLabel}
                  </span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {order.formattedTotal}
                </div>
              </div>

              <div className="bg-[#0b1b3d] p-3 rounded-xl border border-[#142958] text-xs space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Claim Reason:
                  </span>
                  <span className="text-purple-300 font-bold">{order.reason}</span>
                </div>
                {order.detailsText && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Contractor Description:
                    </span>
                    <span className="text-slate-200">{order.detailsText}</span>
                  </div>
                )}
                {order.damagePhoto && (
                  <div className="pt-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                      Uploaded Evidence:
                    </span>
                    <img
                      src={order.damagePhoto}
                      alt="Damage Evidence"
                      className="w-28 h-28 object-cover rounded-xl border border-[#142958]"
                    />
                  </div>
                )}

                {/* If rejected, display the rejection notice */}
                {order.isRejected && (
                  <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>Rejection Justification:</span>
                    </div>
                    <p className="mt-1 text-slate-200 font-medium">"{order.rejectedReason}"</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Policy enforcement: 1-trial return limit reached. Customer return button has been locked.
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {order.isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => openRejectModal(order)}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Reject Claim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveRefund(order.orderNumber)}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      <span>Approve Refund &amp; Restock</span>
                    </button>
                  </>
                )}

                {order.isApproved && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claim Completed &amp; Restocked</span>
                  </span>
                )}

                {order.isRejected && (
                  <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    <span>Claim Rejected (1-Trial Limit Applied)</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1b3d] border border-[#142958] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-white animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#142958] flex items-center justify-between bg-[#07132c]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Reject Return &amp; Refund Claim
                  </h3>
                  <p className="text-xs font-mono text-purple-300">
                    Order #{rejectModalOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#142958] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-300">Strict 1-Trial Policy Rule:</span>
                  <span>
                    Rejecting this claim will notify the customer and permanently lock the "Request return" button for this order. The customer will not be allowed to submit another return claim.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Select Rejection Reason *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#07132c] border border-[#142958] rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500/50"
                >
                  <option value="Damage evidence does not show manufacturing defect">
                    Damage evidence does not show manufacturing defect
                  </option>
                  <option value="Customer mishandling or improper jobsite storage">
                    Customer mishandling or improper jobsite storage
                  </option>
                  <option value="Product seal broken, consumed, or altered beyond inspection">
                    Product seal broken, consumed, or altered beyond inspection
                  </option>
                  <option value="Claim filed beyond eligible warranty/return window">
                    Claim filed beyond eligible warranty/return window
                  </option>
                  <option value="Incomplete product packaging or missing batch identifiers">
                    Incomplete product packaging or missing batch identifiers
                  </option>
                  <option value="Other (Please specify)">Other (Please specify)</option>
                </select>
              </div>

              {rejectReason === 'Other (Please specify)' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Custom Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter detailed reason for rejection..."
                    className="w-full bg-[#07132c] border border-[#142958] rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-rose-500/50 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#07132c] border-t border-[#142958] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#142958] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting || (rejectReason === 'Other (Please specify)' && !customReason.trim())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
