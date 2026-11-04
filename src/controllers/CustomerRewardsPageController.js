import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function formatMoney(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function useCustomerRewardsPageController() {
  const { currentUser, orders, products, addToCart } = useApp();

  const storagePrefix = `archon-customer-${currentUser?.id || 'guest'}`;

  const readLocal = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(`${storagePrefix}-${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const [wishlist, setWishlist] = useState(() => readLocal('wishlist', []));

  const saveWishlist = (next) => {
    setWishlist(next);
    localStorage.setItem(`${storagePrefix}-wishlist`, JSON.stringify(next));
  };

  const removeFromWishlist = (productId) => {
    saveWishlist(wishlist.filter((id) => id !== productId));
  };

  const addToWishlist = (productId) => {
    if (!wishlist.includes(productId)) {
      saveWishlist([...wishlist, productId]);
    }
  };

  const knownEmails = [currentUser?.email, ...(currentUser?.previousEmails || [])]
    .filter(Boolean)
    .map((e) => e.toLowerCase());

  const customerOrders = orders.filter(
    (order) =>
      !knownEmails.length ||
      knownEmails.includes((order.customerEmail || '').toLowerCase())
  );

  const purchasedTotal = customerOrders
    .filter((order) => !['CANCELLED', 'REFUNDED'].includes(order.status))
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const rewardPoints = Math.floor(purchasedTotal / 100);
  const rewardTier =
    rewardPoints >= 10000
      ? 'Platinum'
      : rewardPoints >= 3000
      ? 'Gold'
      : rewardPoints >= 500
      ? 'Silver'
      : 'Member';

  const coupons = [
    { code: 'ARCHON20', detail: '20% off eligible orders' },
    { code: 'ARCHON500', detail: 'PHP 500 off' },
    { code: 'FREESHIP', detail: 'Free shipping' }
  ];

  const wishlistProducts = products
    .filter((product) => wishlist.includes(product.id))
    .map((product) => ({
      ...product,
      formattedPrice: formatMoney(product.price)
    }));

  const suggestedProducts = products
    .filter((product) => !wishlist.includes(product.id))
    .slice(0, 6);

  return {
    rewardTier,
    rewardPointsFormatted: rewardPoints.toLocaleString(),
    coupons,
    wishlistProducts,
    suggestedProducts,
    addToCart,
    removeFromWishlist,
    addToWishlist
  };
}

export default useCustomerRewardsPageController;
