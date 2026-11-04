import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  RotateCcw,
  Users,
  ClipboardList
} from 'lucide-react';

export function useAdminViewController() {
  const { setCurrentView, logoutUser, products, orders } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');

  const refundOrdersCount = orders.filter(
    (o) => o.status === 'REFUND_REQUESTED' || o.status === 'REFUNDED'
  ).length;

  const customerEmails = new Set(
    orders.map((o) => (o.customerEmail || '').toLowerCase().trim()).filter(Boolean)
  );

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Product & Inventory', icon: Package, count: products.length },
    { id: 'orders', label: 'Orders', icon: FileText, count: orders.length },
    { id: 'shipments', label: 'Delivery Status', icon: Truck, count: orders.length },
    { id: 'refunds', label: 'Returns & Refunds', icon: RotateCcw, count: refundOrdersCount },
    { id: 'users', label: 'Manage Users', icon: Users, count: customerEmails.size },
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
