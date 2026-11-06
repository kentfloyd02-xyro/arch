import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function formatMoney(value) {
  return `PHP ${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function useCustomerRewardsPageController() {
  const { currentUser, orders, products, addToCart } = useApp();
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    api.getVouchers()
      .then((data) => {
        if (Array.isArray(data)) {
          setCoupons(data.map((v) => {
            let detail = 'Special discount voucher';
            if (v.discountType === 'PERCENTAGE' || v.discount_type === 'PERCENTAGE') {
              detail = `${v.discountValue || v.discount_value}% off eligible orders`;
            } else if (v.discountType === 'FIXED' || v.discount_type === 'FIXED' || v.discountType === 'FIXED_AMOUNT') {
              detail = `PHP ${v.discountValue || v.discount_value} off`;
            } else if (v.discountType === 'FREE_SHIPPING' || v.code === 'FREESHIP') {
              detail = 'Free shipping freight waiver';
            }
            return {
              code: v.code,
              detail,
              minSpend: v.minSpend || v.min_spend
            };
          }));
        }
      })
      .catch(() => {});
  }, []);

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
