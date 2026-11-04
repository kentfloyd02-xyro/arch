import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserRound,
  Package,
  Settings,
  Star,
  CircleHelp
} from 'lucide-react';

export function useCustomerViewController() {
  const { currentUser, setCurrentView, logoutUser, orders } = useApp();

  const [activeSection, setActiveSection] = useState('overview');

  const knownEmails = [currentUser?.email, ...(currentUser?.previousEmails || [])]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const customerOrdersCount = orders.filter(
    (order) =>
      !knownEmails.length ||
      knownEmails.includes((order.customerEmail || '').toLowerCase())
  ).length;

  const sections = [
    { id: 'overview', label: 'Overview', icon: UserRound },
    { id: 'orders', label: 'Orders & returns', icon: Package, count: customerOrdersCount },
    { id: 'profile', label: 'Profile & addresses', icon: Settings },
    { id: 'rewards', label: 'Rewards & wishlist', icon: Star },
    { id: 'support', label: 'Help & preferences', icon: CircleHelp }
  ];

  const currentSectionLabel =
    sections.find((s) => s.id === activeSection)?.label || 'Customer Portal';

  return {
    currentUser,
    activeSection,
    setActiveSection,
    currentSectionLabel,
    sections,
    setCurrentView,
    logoutUser
  };
}

export default useCustomerViewController;
