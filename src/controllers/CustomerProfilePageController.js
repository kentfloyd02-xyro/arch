import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useCustomerProfilePageController() {
  const { currentUser, updateUserProfile, showToast } = useApp();

  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    company: currentUser?.company || ''
  });

  const [billingPreference, setBillingPreference] = useState(
    currentUser?.billingPreference || 'standard'
  );

  const storagePrefix = `archon-customer-${currentUser?.id || 'guest'}`;

  const readLocal = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(`${storagePrefix}-${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [addresses, setAddresses] = useState(() => readLocal('addresses', []));
  const [addressDraft, setAddressDraft] = useState({ label: '', address: '' });

  const saveAddresses = (next) => {
    setAddresses(next);
    localStorage.setItem(`${storagePrefix}-addresses`, JSON.stringify(next));
  };

  const submitAddress = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const trimmedLabel = (addressDraft.label || '').trim();
    const trimmedAddress = (addressDraft.address || '').trim();

    if (trimmedLabel.length < 2) {
      showToast('Validation Error: Address label must be at least 2 characters (e.g. Warehouse, Job Site).', 'warning');
      return;
    }
    if (trimmedAddress.length < 5) {
      showToast('Validation Error: Street address must be at least 5 characters.', 'warning');
      return;
    }

    saveAddresses([...addresses, { id: `${Date.now()}`, label: trimmedLabel, address: trimmedAddress }]);
    setAddressDraft({ label: '', address: '' });
    showToast('New site delivery address saved.', 'success');
  };

  const removeAddress = (id) => {
    saveAddresses(addresses.filter((item) => item.id !== id));
    showToast('Delivery address removed.', 'info');
  };

  const submitProfile = (e) => {
    if (e?.preventDefault) e.preventDefault();

    const trimmedName = (profileDraft.name || '').trim();
    const trimmedEmail = (profileDraft.email || '').trim().toLowerCase();

    if (trimmedName.length < 2) {
      showToast('Validation Error: Full name must be at least 2 characters.', 'warning');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      showToast('Validation Error: Please enter a valid email address.', 'warning');
      return;
    }

    const previousEmails =
      currentUser?.email &&
      currentUser.email.toLowerCase() !== trimmedEmail
        ? [...new Set([...(currentUser.previousEmails || []), currentUser.email])]
        : currentUser?.previousEmails || [];

    updateUserProfile({ ...profileDraft, name: trimmedName, email: trimmedEmail, billingPreference, previousEmails });
    showToast('Profile information validated and updated successfully.', 'success');
  };

  const consentGranted = currentUser?.privacyConsent
    ? currentUser.privacyConsent.granted !== false
    : true;

  const togglePrivacyConsent = async () => {
    const nextState = !consentGranted;
    await updateUserProfile({
      privacyConsent: {
        granted: nextState,
        consentedAt: new Date().toISOString(),
        policyVersion: 'RA10173-2026.1'
      }
    });

    if (nextState) {
      showToast('Data Privacy Consent granted under RA 10173.', 'success');
    } else {
      showToast(
        'Data Privacy Consent withheld. Personal contact details masked in admin views.',
        'info'
      );
    }
  };

  return {
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
  };
}

export default useCustomerProfilePageController;
