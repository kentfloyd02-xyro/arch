import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useCustomerSupportPageController() {
  const { currentUser, setIsCsOpen } = useApp();

  const storagePrefix = `archon-customer-${currentUser?.id || 'guest'}`;

  const readLocal = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(`${storagePrefix}-${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [preferences, setPreferences] = useState(() =>
    readLocal('preferences', {
      emailNews: true,
      smsUpdates: true,
      marketing: false
    })
  );

  const savePreferences = (next) => {
    setPreferences(next);
    localStorage.setItem(`${storagePrefix}-preferences`, JSON.stringify(next));
  };

  const updatePreferenceField = (key, value) => {
    savePreferences({ ...preferences, [key]: value });
  };

  const openSupportChat = () => {
    setIsCsOpen(true);
  };

  return {
    preferences,
    updatePreferenceField,
    openSupportChat
  };
}

export default useCustomerSupportPageController;
