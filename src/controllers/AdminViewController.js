import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { aggregateCustomerAccounts } from './AdminUsersPageController';
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  RotateCcw,
  Users,
  ClipboardList,
  MessageCircle
} from 'lucide-react';

export function useAdminViewController() {
  const { setCurrentView, logoutUser, products, orders } = useApp();

  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const savedTab = localStorage.getItem('archon_admin_active_tab');
      const validTabs = ['dashboard', 'inventory', 'orders', 'shipments', 'refunds', 'support', 'users', 'audit'];
      if (savedTab && validTabs.includes(savedTab)) {
        return savedTab;
      }
    } catch (e) {}
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('archon_admin_active_tab', tab);
    } catch (e) {}
  };

  const refundOrdersCount = orders.filter(
    (o) => o.status === 'REFUND_REQUESTED' || o.status === 'REFUNDED'
  ).length;

  const [totalUsersCount, setTotalUsersCount] = useState(() => {
    return aggregateCustomerAccounts([], orders).length;
  });

  useEffect(() => {
    let active = true;
    api.getCustomers()
      .then((customers) => {
        if (!active || !Array.isArray(customers)) return;
        const total = aggregateCustomerAccounts(customers, orders).length;
        setTotalUsersCount(total);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [orders]);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Product & Inventory', icon: Package, count: products.length },
    { id: 'orders', label: 'Orders', icon: FileText, count: orders.length },
    { id: 'shipments', label: 'Delivery Status', icon: Truck, count: orders.length },
    { id: 'refunds', label: 'Returns & Refunds', icon: RotateCcw, count: refundOrdersCount },
    { id: 'support', label: 'Help Desk', icon: MessageCircle },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: ClipboardList }
  ];

  return {
    setCurrentView,
    logoutUser,
    activeTab,
    setActiveTab,
    navigation
  };
}

export default useAdminViewController;
