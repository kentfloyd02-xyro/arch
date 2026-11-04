import React from 'react';
import { useCustomerSupportPageController } from '../../controllers/CustomerSupportPageController';
import { CircleHelp, ChevronRight, BookOpen, Bell } from 'lucide-react';

const panelClass = 'rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6';

export default function CustomerSupportPage() {
  const { preferences, updatePreferenceField, openSupportChat } =
    useCustomerSupportPageController();

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Help Desk Card */}
      <section className={panelClass}>
        <h2 className="text-sm font-extrabold text-white">Help desk</h2>
        <p className="mt-1 text-[10px] text-slate-400">
          Direct communication lines with our engineering and support team.
        </p>

        <button
          onClick={openSupportChat}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#142958] bg-[#07132c] p-3 text-left hover:border-blue-500/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <CircleHelp size={15} className="text-blue-300" />
            Open support chat
          </span>
          <ChevronRight size={15} className="text-slate-500" />
        </button>

        <div className="mt-3 rounded-xl border border-[#142958] bg-[#07132c] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <BookOpen size={15} className="text-amber-300" />
            Order help
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Open an order's tracking panel for status details, or use the return request action after delivery.
          </p>
        </div>

        <p className="mt-3 text-[9px] text-slate-500">
          Our engineering support team responds to all inquiries within 24 hours.
        </p>
      </section>

      {/* Communication Preferences */}
      <section className={panelClass}>
        <div className="flex items-center gap-2">
          <Bell size={17} className="text-blue-300" />
          <h2 className="text-sm font-extrabold text-white">
            Communication preferences
          </h2>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          These choices are saved locally; preferences are saved to your account.
        </p>

        <div className="mt-4 space-y-2">
          {[
            ['emailNews', 'Email newsletter'],
            ['smsUpdates', 'SMS order updates'],
            ['marketing', 'Marketing notifications']
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[#142958] bg-[#07132c] p-3 text-xs text-slate-200 hover:border-blue-500/40 transition-colors"
            >
              {label}
              <input
                type="checkbox"
                checked={Boolean(preferences[key])}
                onChange={(e) => updatePreferenceField(key, e.target.checked)}
                className="h-4 w-4 accent-blue-500 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
