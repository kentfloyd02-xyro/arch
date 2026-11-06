import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useCustomerProfilePageController() {
  const { currentUser, updateUserProfile, showToast } = useApp();

  const [profileDraft, setProfileDraft] = useState({
    name: currentUser?.name || currentUser?.full_name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || currentUser?.phoneNumber || currentUser?.phone_number || '',
    address: currentUser?.address || currentUser?.defaultAddress || currentUser?.default_address || ''
  });

  useEffect(() => {
    if (currentUser) {
      setProfileDraft({
        name: currentUser.name || currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || currentUser.phoneNumber || currentUser.phone_number || '',
        address: currentUser.address || currentUser.defaultAddress || currentUser.default_address || ''
      });
    }
  }, [currentUser]);

  const [billingPreference, setBillingPreference] = useState(
    currentUser?.billingPreference || 'standard'
  );

  const storagePrefix = `archon-customer-${currentUser?.id || currentUser?.email || 'guest'}`;

  const readLocal = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(`${storagePrefix}-${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [addresses, setAddresses] = useState(() => {
    const list = readLocal('addresses', []);
    const userAddr = currentUser?.address || currentUser?.defaultAddress || currentUser?.default_address;
    if (list.length === 0 && userAddr && userAddr.trim()) {
      return [{ id: 'primary', label: 'Primary Delivery Address', address: userAddr.trim() }];
    }
    return list;
  });

  const saveAddresses = (next) => {
    setAddresses(next);
    localStorage.setItem(`${storagePrefix}-addresses`, JSON.stringify(next));
  };

  useEffect(() => {
    const userAddr = currentUser?.address || currentUser?.defaultAddress || currentUser?.default_address;
    if (userAddr && userAddr.trim()) {
      setAddresses((prev) => {
        if (!prev.some((item) => item.address?.trim() === userAddr.trim())) {
          const next = [{ id: 'primary', label: 'Primary Delivery Address', address: userAddr.trim() }, ...prev];
          saveAddresses(next);
          return next;
        }
        return prev;
      });
    }
  }, [currentUser]);

  const [addressDraft, setAddressDraft] = useState({ label: '', address: '' });

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
    const cleanPhone = (profileDraft.phone || '').replace(/\D/g, '').slice(0, 11);
    const cleanAddress = (profileDraft.address || '').trim();

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

    updateUserProfile({
      name: trimmedName,
      fullName: trimmedName,
      email: trimmedEmail,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      address: cleanAddress,
      defaultAddress: cleanAddress,
      billingPreference,
      previousEmails
    });
    showToast('Profile information validated and updated successfully.', 'success');
  };

  const consentGranted = currentUser?.privacyConsent
    ? currentUser.privacyConsent.granted !== false
    : true;

  const togglePrivacyConsent = async () => {
    const nextState = !consentGranted;
    const consentObj = {
      granted: nextState,
      consentedAt: new Date().toISOString(),
      policyVersion: 'RA10173-2026.1'
    };

    await updateUserProfile({
      privacyConsent: consentObj
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
