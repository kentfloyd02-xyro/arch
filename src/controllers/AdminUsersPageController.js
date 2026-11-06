import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function maskEmail(email) {
  if (!email) return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function maskPhone(phone) {
  if (!phone) return '—';
  const clean = phone.trim();
  if (clean.length < 7) return '***-****';
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
}

export function maskAddress(address) {
  if (!address) return '—';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `[Protected Site Street], ${parts.slice(-2).join(', ').trim()}`;
  }
  return '[Site Address Protected under RA 10173]';
}

export function useAdminUsersPageController() {
  const { orders } = useApp();

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userConsentFilter, setUserConsentFilter] = useState('all');

  const fetchRegisteredUsers = (isBackground = false) => {
    if (!isBackground) setUsersLoading(true);
    api.getCustomers()
      .then((data) => {
        if (Array.isArray(data)) setRegisteredUsers(data);
      })
      .catch((err) => console.warn('Registered customers fetch:', err.message))
      .finally(() => {
        if (!isBackground) setUsersLoading(false);
      });
  };

  useEffect(() => {
    fetchRegisteredUsers();
    const interval = setInterval(() => {
      fetchRegisteredUsers(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Aggregation of registered users and order guest customers
  const allCustomersMap = new Map();

  registeredUsers.forEach((u) => {
    const email = u.email ? u.email.toLowerCase().trim() : '';
    if (email) {
      allCustomersMap.set(email, {
        customerName: u.name || u.fullName || 'Customer',
        customerEmail: u.email,
        customerPhone: u.phone || u.phoneNumber || '',
        company: u.company || '',
        registeredDate: u.createdAt,
        isRegistered: true,
        defaultAddress: u.defaultAddress || u.address || '',
        privacyConsent: u.privacyConsent || {
          granted: true,
          consentedAt: u.createdAt,
          policyVersion: 'RA10173-2026.1'
        }
      });
    }
  });

  // Supplement with local registered customers cache
  try {
    const rawCache = localStorage.getItem('archon_registered_customers_cache');
    if (rawCache) {
      const cache = JSON.parse(rawCache);
      if (Array.isArray(cache)) {
        cache.forEach((u) => {
          const email = (u.email || '').toLowerCase().trim();
          if (email) {
            const existing = allCustomersMap.get(email);
            if (!existing) {
              allCustomersMap.set(email, {
                customerName: u.name || u.fullName || 'Customer',
                customerEmail: u.email,
                customerPhone: u.phone || u.phoneNumber || '',
                company: u.company || '',
                registeredDate: u.createdAt,
                isRegistered: true,
                defaultAddress: u.defaultAddress || u.address || '',
                privacyConsent: u.privacyConsent || { granted: true, policyVersion: 'RA10173-2026.1' }
              });
            } else {
              if (u.privacyConsent) existing.privacyConsent = u.privacyConsent;
              if (u.defaultAddress || u.address) existing.defaultAddress = u.defaultAddress || u.address;
              if (u.phone || u.phoneNumber) existing.customerPhone = u.phone || u.phoneNumber;
            }
          }
        });
      }
    }
  } catch {}

  // Supplement with current user in localStorage if present
  try {
    const rawUser = localStorage.getItem('archon_user');
    if (rawUser) {
      const cur = JSON.parse(rawUser);
      const email = (cur.email || '').toLowerCase().trim();
      if (email) {
        const existing = allCustomersMap.get(email);
        if (existing) {
          if (cur.privacyConsent) existing.privacyConsent = cur.privacyConsent;
          if (cur.address || cur.defaultAddress) existing.defaultAddress = cur.address || cur.defaultAddress;
          if (cur.phone || cur.phoneNumber) existing.customerPhone = cur.phone || cur.phoneNumber;
        } else if (cur.role !== 'admin' && cur.global_role !== 'superadmin' && cur.global_role !== 'admin') {
          allCustomersMap.set(email, {
            customerName: cur.name || cur.full_name || 'Customer',
            customerEmail: cur.email,
            customerPhone: cur.phone || cur.phoneNumber || '',
            company: cur.company || '',
            registeredDate: cur.created_at || new Date().toISOString(),
            isRegistered: true,
            defaultAddress: cur.address || cur.defaultAddress || '',
            privacyConsent: cur.privacyConsent || { granted: true, policyVersion: 'RA10173-2026.1' }
          });
        }
      }
    }
  } catch {}

  orders.forEach((o) => {
    const email = o.customerEmail
      ? o.customerEmail.toLowerCase().trim()
      : o.customerPhone || '';
    if (email) {
      const existing = allCustomersMap.get(email);
      if (existing) {
        if (!existing.customerPhone && o.customerPhone && existing.privacyConsent?.granted !== false) {
          existing.customerPhone = o.customerPhone;
        }
        if (!existing.defaultAddress && o.deliveryAddress && existing.privacyConsent?.granted !== false) {
          existing.defaultAddress = o.deliveryAddress;
        }
      } else {
        allCustomersMap.set(email, {
          customerName: o.customerName || 'Customer',
          customerEmail: o.customerEmail,
          customerPhone: o.customerPhone,
          company: '',
          registeredDate: o.createdAt,
          isRegistered: false,
          defaultAddress: o.deliveryAddress,
          privacyConsent: {
            granted: true,
            consentedAt: o.createdAt,
            policyVersion: 'RA10173-2026.1'
          }
        });
      }
    }
  });

  const customersList = [...allCustomersMap.values()];

  const consentedUsersCount = customersList.filter(
    (c) => c.privacyConsent?.granted !== false
  ).length;
  const withheldUsersCount = customersList.filter(
    (c) => c.privacyConsent?.granted === false
  ).length;

  const q = userSearch.toLowerCase().trim();

  const filteredCustomers = customersList
    .filter((c) => {
      const matchesSearch =
        !q ||
        c.customerName.toLowerCase().includes(q) ||
        (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.customerPhone && c.customerPhone.includes(q)) ||
        (c.defaultAddress && c.defaultAddress.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const isGranted = c.privacyConsent?.granted !== false;
      if (userConsentFilter === 'consented' && !isGranted) return false;
      if (userConsentFilter === 'withheld' && isGranted) return false;
      return true;
    })
    .map((customer) => {
      const cEmail = (customer.customerEmail || '').toLowerCase();
      const cPhone = customer.customerPhone || '';
      const customerOrders = orders.filter(
        (o) =>
          (o.customerEmail && o.customerEmail.toLowerCase() === cEmail) ||
          (o.customerPhone && o.customerPhone === cPhone)
      );

      const lastOrder = customerOrders.reduce((latest, o) => {
        const d = new Date(o.date || o.createdAt || 0);
        return !latest || d > new Date(latest.date || latest.createdAt || 0)
          ? o
          : latest;
      }, null);

      const lifetimeSpend = customerOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );
      const isConsented = customer.privacyConsent?.granted !== false;

      return {
        ...customer,
        isConsented,
        displayEmail: isConsented
          ? customer.customerEmail || '—'
          : maskEmail(customer.customerEmail),
        displayPhone: isConsented
          ? customer.customerPhone || '—'
          : maskPhone(customer.customerPhone),
        displayAddress: isConsented
          ? customer.defaultAddress || '—'
          : maskAddress(customer.defaultAddress),
        orderCount: customerOrders.length,
        lifetimeSpendFormatted: `PHP ${lifetimeSpend.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`,
        lastOrderDateFormatted: lastOrder
          ? new Date(lastOrder.date || lastOrder.createdAt).toLocaleDateString()
          : 'No orders'
      };
    });

  return {
    userSearch,
    setUserSearch,
    userConsentFilter,
    setUserConsentFilter,
    consentedUsersCount,
    withheldUsersCount,
    usersLoading,
    fetchRegisteredUsers,
    filteredCustomers
  };
}

export default useAdminUsersPageController;
