import React from 'react';
import { useCustomerProfilePageController } from '../../controllers/CustomerProfilePageController';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  CreditCard,
  Plus,
  X
} from 'lucide-react';

const panelClass = 'rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6';
const inputClass = 'w-full rounded-xl border border-[#142958] bg-[#07132c] px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500';

export default function CustomerProfilePage() {
  const {
    profileDraft,
    setProfileDraft,
    billingPreference,
    setBillingPreference,
    submitProfile,
    consentGranted,
    togglePrivacyConsent,
    addresses,
    addressDraft,
    setAddressDraft,
    submitAddress,
    removeAddress
  } = useCustomerProfilePageController();

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Philippine Data Privacy Consent Card */}
      <section className={`${panelClass} xl:col-span-2 border-blue-500/30 bg-gradient-to-br from-[#091838] via-[#0b1b3d] to-[#122b5e]`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                consentGranted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {consentGranted ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold text-white">
                  Philippine Data Privacy Consent (RA 10173)
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    consentGranted
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {consentGranted
                    ? '✓ Consent Granted to Admin'
                    : '✕ Consent Withheld (Protected)'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                In accordance with the{' '}
                <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, you have control over whether Archon Nell store administrators and dispatch managers can view your full personal contact records.
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                {consentGranted
                  ? 'Your consent is currently ACTIVE. Store administrators can view verified contact details to coordinate freight delivery.'
                  : 'Your consent is WITHHELD. Your email, mobile number, and site address are automatically masked in administrative dashboards.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePrivacyConsent}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center justify-center gap-2 shadow-md ${
              consentGranted
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border-rose-500/30 hover:border-rose-500/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {consentGranted ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-300" />
                <span>Revoke Admin Access</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Grant Consent to Admin</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Personal Info Form */}
      <section className={panelClass}>
        <h2 className="text-sm font-extrabold text-white">Personal information</h2>
        <p className="mt-1 text-[10px] text-slate-400">
          Saved to your Archon Nell profile.
        </p>

        <form onSubmit={submitProfile} className="mt-4 space-y-3">
          {[
            ['name', 'Full name'],
            ['email', 'Email address'],
            ['phone', 'Phone number'],
            ['company', 'Company']
          ].map(([key, label]) => (
            <label key={key} className="block text-[10px] font-semibold text-slate-400">
              {label}
              <input
                required={key === 'name' || key === 'email'}
                type={key === 'email' ? 'email' : 'text'}
                value={profileDraft[key]}
                onChange={(e) =>
                  setProfileDraft((draft) => ({ ...draft, [key]: e.target.value }))
                }
                className={`${inputClass} mt-1`}
              />
            </label>
          ))}

          <label className="block text-[10px] font-semibold text-slate-400">
            Billing preference
            <select
              value={billingPreference}
              onChange={(e) => setBillingPreference(e.target.value)}
              className={`${inputClass} mt-1 cursor-pointer`}
            >
              <option value="standard">Standard invoice</option>
              <option value="business">Business purchase order</option>
              <option value="cash-on-delivery">Cash on delivery preference</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
          >
            Save profile
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-100">
          Password changes require secure authentication and are not supported by this demo account.
        </div>
      </section>

      {/* Address Book */}
      <section className={panelClass}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white">Address book</h2>
            <p className="mt-1 text-[10px] text-slate-400">
              Addresses are stored locally in this browser.
            </p>
          </div>
          <MapPin size={18} className="text-blue-300" />
        </div>

        <form onSubmit={submitAddress} className="mt-4 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
          <input
            required
            value={addressDraft.label}
            onChange={(e) =>
              setAddressDraft((draft) => ({ ...draft, label: e.target.value }))
            }
            placeholder="Home, Office..."
            className={inputClass}
          />
          <input
            required
            value={addressDraft.address}
            onChange={(e) =>
              setAddressDraft((draft) => ({ ...draft, address: e.target.value }))
            }
            placeholder="Full shipping or billing address"
            className={inputClass}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {addresses.length ? (
            addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#142958] bg-[#07132c] p-3"
              >
                <div>
                  <strong className="text-xs text-white">{address.label}</strong>
                  <p className="mt-1 text-[10px] text-slate-400">{address.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAddress(address.id)}
                  aria-label={`Remove ${address.label} address`}
                  className="text-slate-500 hover:text-rose-300 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-[#142958] p-5 text-center text-[10px] text-slate-500">
              No saved addresses yet.
            </p>
          )}
        </div>
      </section>

      {/* Payment Methods Info */}
      <section className={`${panelClass} xl:col-span-2`}>
        <div className="flex items-center gap-2">
          <CreditCard size={17} className="text-amber-300" />
          <h2 className="text-sm font-extrabold text-white">Payment methods</h2>
        </div>
        <p className="mt-2 text-xs text-slate-300">
          No card or wallet credentials are stored in this demo. Choose a payment method during checkout; only the order's method label is recorded.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-lg border border-[#142958] bg-[#07132c] px-3 py-2 text-[10px] text-slate-300">
            GCash at checkout
          </span>
          <span className="rounded-lg border border-[#142958] bg-[#07132c] px-3 py-2 text-[10px] text-slate-300">
            Other checkout methods per order
          </span>
        </div>
      </section>
    </div>
  );
}
