import React from 'react';
import { useAdminShipmentsPageController } from '../../controllers/AdminShipmentsPageController';
import { Truck, Search, Printer } from 'lucide-react';

export default function AdminShipmentsPage() {
  const {
    shipmentSearch,
    setShipmentSearch,
    shipmentStatusFilter,
    setShipmentStatusFilter,
    printOrderDocument,
    filteredShipments
  } = useAdminShipmentsPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header and Search Filters */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#142958]">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Delivery Tracking &amp; Dispatch Logistics ({filteredShipments.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time fulfillment stages from plant batching to final job site delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={shipmentStatusFilter}
            onChange={(e) => setShipmentStatusFilter(e.target.value)}
            className="py-1.5 px-3 bg-[#07132c] text-xs font-semibold text-white rounded-xl border border-[#142958] focus:outline-none cursor-pointer"
          >
            <option value="all">All Dispatches</option>
            <option value="preparing">Preparing &amp; Packing</option>
            <option value="shipped">In-Transit</option>
            <option value="delivered">Delivered</option>
            <option value="return">Returned / Refunded</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={shipmentSearch}
              onChange={(e) => setShipmentSearch(e.target.value)}
              placeholder="Search destination, order..."
              className="pl-8 pr-3 py-1.5 bg-[#07132c] text-xs text-white placeholder-slate-400 rounded-xl border border-[#142958] focus:outline-none w-44 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-3">
        {filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
            No shipment dispatches match your filter criteria.
          </div>
        ) : (
          filteredShipments.map((order) => (
            <div
              key={order.orderNumber}
              className="p-4 sm:p-5 rounded-2xl bg-[#07132c] border border-[#142958] space-y-3 hover:border-amber-500/40 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-[#142958]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs sm:text-sm text-blue-400">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] bg-[#0b1b3d] text-slate-300 font-bold px-2 py-0.5 rounded border border-[#142958]">
                      {order.paymentMethod}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${order.statusBadgeClass}`}
                    >
                      {order.statusDisplay}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Recipient: <strong>{order.customerName}</strong> ({order.customerPhone})
                  </div>
                </div>

                <div className="flex sm:flex-col justify-between sm:items-end items-center">
                  <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                    {order.formattedTotal}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dispatched: {order.formattedDate}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-[#0b1b3d] p-2.5 rounded-xl border border-[#142958]">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">
                  Shipping Destination:
                </span>
                <span className="line-clamp-2">{order.deliveryAddress}</span>
              </div>

              {/* Dispatch Progression */}
              <div className="bg-[#0b1b3d]/60 p-3 rounded-xl border border-[#142958] space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  Dispatch Progression:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {order.progressionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border text-center text-[10px] font-bold ${step.stepClass}`}
                    >
                      {step.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => printOrderDocument(order, 'label')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] bg-[#0b1b3d] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-amber-500/50"
                >
                  <Printer size={13} />
                  Print shipping label
                </button>
                <button
                  type="button"
                  onClick={() => printOrderDocument(order, 'invoice')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#142958] bg-[#0b1b3d] px-2.5 py-1.5 text-[10px] font-bold text-slate-200 hover:border-blue-500/50"
                >
                  <Printer size={13} />
                  Print invoice
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
