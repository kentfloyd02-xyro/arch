import React from 'react';
import { useAdminRefundsPageController } from '../../controllers/AdminRefundsPageController';
import { RotateCcw, CheckCircle2, ArchiveRestore } from 'lucide-react';

export default function AdminRefundsPage() {
  const { refundOrders, handleApproveRefund } = useAdminRefundsPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-[#142958]">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-purple-400" />
          <span>Returns, Damaged Material &amp; Refund Claims ({refundOrders.length})</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review return claims under Consumer Act (RA 7394) and restock undamaged inventory.
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
                    Reason:
                  </span>
                  <span className="text-rose-300 font-bold">{order.reason}</span>
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
                      className="w-24 h-24 object-cover rounded-xl border border-[#142958]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                {!order.isApproved ? (
                  <button
                    onClick={() => handleApproveRefund(order.orderNumber)}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                    <span>Approve Refund &amp; Restock</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Claim Completed &amp; Restocked</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
