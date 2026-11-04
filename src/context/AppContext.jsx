import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, checkApiHealth } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {

  const [currentView, setCurrentView] = useState('store');

  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState({});

  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const refreshAllData = useCallback(async () => {
    setIsApiLoading(true);
    setApiError(null);
    try {
      // Products, Reviews, and Projects are public store catalog data.
      // Orders require an authenticated user token (protect route).
      const token = localStorage.getItem('archon_token');

      // Check health first or fetch alongside
      const healthPromise = checkApiHealth().catch(() => false);

      const [isHealthy, liveProducts, liveOrders] = await Promise.all([
        healthPromise,
        api.getProducts().catch(() => null),
        token ? api.getOrders().catch(() => null) : Promise.resolve(null)
      ]);

      let formattedProducts = [];
      if (Array.isArray(liveProducts) && liveProducts.length > 0) {
        formattedProducts = liveProducts.map(p => ({
          ...p,
          dbId: p.id, // Preserve raw PostgreSQL UUID for reviews query
          id: p.customId || p.custom_id || p._id || p.id,
          image: (Array.isArray(p.images) && p.images[0]) || p.image || '/assets/images/leveling_mortar_1785519746126.png',
          category: p.categorySlug || p.category_slug || p.category || 'all',
          shippingWeightKg: p.shippingWeightKg || p.shipping_weight_kg || 20,
          sold: p.sold || p.sold_count || 0,
          badge: p.badge || (p.is_featured ? 'STORE PREFERRED' : ''),
          specs: Array.isArray(p.specs) ? p.specs : (p.specs && typeof p.specs === 'object' ? Object.values(p.specs) : []),
          rating: Number(p.average_rating || p.rating || 5.0),
          originalPrice: p.originalPrice || p.original_price || Number(p.price),
          discount: p.discount || ''
        }));
        setProducts(formattedProducts);
      } else {
        setProducts([]);
      }

      if (Array.isArray(liveOrders) && liveOrders.length > 0) {
        setOrders(liveOrders.map(o => {
          const rawTotal = Number(o.totalAmount ?? o.total_amount ?? o.total ?? 0);
          const rawSubtotal = Number(o.subtotal ?? 0);
          const rawShipping = Number(o.shippingFee ?? o.shipping_fee ?? 0);
          const rawDiscount = Number(o.discountAmount ?? o.discount_amount ?? o.discount ?? 0);
          const rawStatus = (o.status || o.delivery_status || 'DELIVERED').toUpperCase();

          return {
            ...o,
            id: o.orderNumber || o.order_number || o._id || o.id,
            orderNumber: o.orderNumber || o.order_number || o.id,
            customerName: o.customerName || o.customer_name || 'Customer',
            customerEmail: o.customerEmail || o.customer_email || '',
            customerPhone: o.customerPhone || o.customer_phone || '',
            deliveryAddress: o.deliveryAddress || o.delivery_address || '',
            deliveryNotes: o.deliveryNotes || o.delivery_notes || '',
            paymentMethod: o.paymentMethod || o.payment_method || 'GCash',
            gcashRefNumber: o.gcashRefNumber || o.gcash_ref_number || '',
            status: rawStatus,
            deliveryStatus: rawStatus,
            totalAmount: rawTotal,
            subtotal: rawSubtotal,
            shippingFee: rawShipping,
            discountAmount: rawDiscount,
            discountType: o.discountType || o.discount_type || '',
            items: Array.isArray(o.items) ? o.items : (Array.isArray(o.order_items) ? o.order_items : []),
            trackingTimeline: o.trackingTimeline || o.tracking_steps || [],
            date: o.date || (o.createdAt ? new Date(o.createdAt).toISOString() : (o.created_at ? new Date(o.created_at).toISOString() : new Date().toISOString()))
          };
        }));
      } else {
        setOrders([]);
      }

      // Query reviews per product using raw database UUID (GET /shop/reviews/:productId)
      const targetProducts = formattedProducts;
      const reviewResults = await Promise.all(
        targetProducts.map(p => {
          const queryId = p.dbId || p.id;
          const customKey = p.customId || p.custom_id || p.id;
          return api.getReviews(queryId)
            .then(revs => (Array.isArray(revs) ? revs.map(r => ({
              ...r,
              productCustomId: customKey,
              productId: customKey
            })) : []))
            .catch(() => []);
        })
      );

      const allProductReviews = reviewResults.flat();
      if (allProductReviews.length > 0) {
        const grouped = {};
        allProductReviews.forEach(r => {
          const key = r.productCustomId || r.productId || 'prod-1';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            id: r._id || r.id || `rev-${Date.now()}-${Math.random()}`,
            userName: r.userName || r.customer_name || 'Customer',
            rating: Number(r.rating || 5),
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : (r.date || new Date().toISOString().slice(0, 10)),
            comment: r.comment || '',
            verified: Boolean(r.is_verified_purchase ?? r.verified)
          });
        });
        setReviews(grouped);
      } else {
        setReviews({});
      }

      // Load engineering projects showcase
      const liveProjects = await api.getProjects().catch(() => []);
      setProjects(Array.isArray(liveProjects) ? liveProjects : []);

      const connected = Boolean(isHealthy || (liveProducts && liveProducts.length >= 0));
      setIsApiConnected(connected);
      if (connected) {
        setApiError(null);
      }
    } catch (err) {
      console.warn('[Backend API Offline]', err.message);
      setIsApiConnected(false);
      setApiError(err.message || 'Unable to connect to backend API server and database');
      setProducts([]);
      setProjects([]);
      setReviews({});
      setOrders([]);
    } finally {
      setIsApiLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('archon_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('archon_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('archon_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('archon_token');
    if (token) {
      api.getMe().then(user => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('archon_user', JSON.stringify(user));
        }
      }).catch(err => {
        console.warn('Session expired or invalid:', err.message);
        localStorage.removeItem('archon_token');
        localStorage.removeItem('archon_user');
        setCurrentUser(null);
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('archon_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('archon_user');
    }
  }, [currentUser]);

  const loginWithAuth = (user, token) => {
    if (token) localStorage.setItem('archon_token', token);
    if (user) localStorage.setItem('archon_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthOpen(false);

    // Refresh orders now that token is present
    refreshAllData();

    if (user.role === 'admin') {
      setCurrentView('admin-dashboard');
      showToast(`Welcome Administrator, ${user.name}!`, 'success');
    } else {
      setCurrentView('customer-dashboard');
      showToast(`Welcome back, ${user.name}!`, 'success');
    }
  };

  const loginUser = (role = 'customer') => {
    setIsAuthOpen(true);
  };

  const logoutUser = () => {
    localStorage.removeItem('archon_token');
    localStorage.removeItem('archon_user');
    setCurrentUser(null);
    setOrders([]);
    setCurrentView('store');
    showToast('Signed out successfully.', 'info');
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const res = await api.updateProfile(updatedData);
      const updated = res.user || { ...currentUser, ...updatedData };
      setCurrentUser(updated);
      localStorage.setItem('archon_user', JSON.stringify(updated));
      showToast('Profile and settings updated successfully.', 'success');
    } catch (err) {

      setCurrentUser(prev => prev ? ({ ...prev, ...updatedData }) : null);
      showToast('Profile updated locally.', 'success');
    }
  };

  const [otpState, setOtpState] = useState({
    email: '',
    generatedCode: '',
    isVerified: false,
    isOpen: false,
    expiresAt: null,
    onSuccessCallback: null
  });

  const triggerOtp = async (email, onSuccess) => {
    try {
      showToast(`Dispatching 6-digit OTP code to ${email}...`, 'info');
      const res = await api.sendOtp(email);
      const expiresAt = Date.now() + 5 * 60 * 1000;

      setOtpState({
        email,
        generatedCode: res.code || '',
        isVerified: false,
        isOpen: true,
        expiresAt,
        onSuccessCallback: onSuccess
      });

      showToast(res.message || `Verification code sent to ${email} via Brevo SMTP`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send OTP code. Please try again.', 'error');
    }
  };

  const verifyOtpCode = async (enteredCode) => {
    if (Date.now() > otpState.expiresAt) {
      showToast('OTP code has expired. Please click Resend.', 'error');
      return false;
    }

    try {
      await api.verifyOtp(otpState.email, enteredCode);
      setOtpState(prev => ({ ...prev, isVerified: true, isOpen: false }));
      showToast('Email verified successfully.', 'success');
      if (otpState.onSuccessCallback) {
        otpState.onSuccessCallback();
      }
      return true;
    } catch (err) {

      if (otpState.generatedCode && enteredCode.trim() === otpState.generatedCode.trim()) {
        setOtpState(prev => ({ ...prev, isVerified: true, isOpen: false }));
        showToast('Email verified successfully.', 'success');
        if (otpState.onSuccessCallback) {
          otpState.onSuccessCallback();
        }
        return true;
      }
      showToast(err.message || 'Invalid or expired OTP code.', 'error');
      return false;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isCsOpen, setIsCsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState(null);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  const openRateModal = (order) => {
    setSelectedOrderForRating(order);
    setIsRateModalOpen(true);
  };

  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addToCart = (product, quantity = 1) => {
    if (currentUser?.role === 'admin') {
      showToast('Admin accounts cannot add items to cart or place orders. Please use a customer account.', 'warning');
      return false;
    }
    const prodId = product.id || product.customId;
    const currentProduct = products.find(p => (p.id === prodId || p.customId === prodId));
    if (!currentProduct || currentProduct.stock <= 0) {
      showToast('This product is currently out of stock.', 'error');
      return false;
    }

    const existingIndex = cart.findIndex(item => (item.product.id === prodId || item.product.customId === prodId));
    const currentInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const requestedTotal = currentInCart + quantity;

    if (requestedTotal > currentProduct.stock) {
      showToast(`Cannot add items. Only ${currentProduct.stock} unit(s) available in stock.`, 'warning');
      return false;
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex] = { ...updated[existingIndex], quantity: requestedTotal };
      setCart(updated);
    } else {
      setCart([...cart, { product: currentProduct, quantity }]);
    }

    showToast(`Added to Cart: ${product.title} (x${quantity})`, 'success');
    return true;
  };

  const updateCartQuantity = (productId, newQty) => {
    const currentProduct = products.find(p => p.id === productId || p.customId === productId);
    if (!currentProduct) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > currentProduct.stock) {
      showToast(`Only ${currentProduct.stock} unit(s) available in stock.`, 'warning');
      return;
    }

    setCart(cart.map(item =>
      (item.product.id === productId || item.product.customId === productId)
        ? { ...item, quantity: newQty }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId && item.product.customId !== productId));
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const isBulkyOrder = totalItemCount >= 5 || cartSubtotal >= 15000;
  const bulkyDiscountAmount = isBulkyOrder ? Math.round(cartSubtotal * 0.10) : 0;

  let voucherDiscountAmount = 0;
  let voucherLabel = '';

  if (appliedVoucher === 'ARCHON20') {
    voucherDiscountAmount = Math.round(cartSubtotal * 0.20);
    voucherLabel = '20% OFF Special Voucher';
  } else if (appliedVoucher === 'ARCHON500') {
    voucherDiscountAmount = 500;
    voucherLabel = 'PHP 500 Industrial Promo Voucher';
  } else if (appliedVoucher === 'FREESHIP') {
    voucherLabel = 'Free Shipping Voucher';
  }

  const effectiveDiscount = Math.max(voucherDiscountAmount, bulkyDiscountAmount);
  const discountType = voucherDiscountAmount >= bulkyDiscountAmount && appliedVoucher
    ? voucherLabel
    : (isBulkyOrder ? 'Bulky Contractor Discount (10% OFF)' : '');

  const cartWeightKg = cart.reduce((weight, item) => {
    const currentProduct = products.find(p => p.id === item.product.id || p.customId === item.product.id);
    return weight + (currentProduct?.shippingWeightKg ?? item.product.shippingWeightKg ?? 0) * item.quantity;
  }, 0);
  const shippingTierCount = cart.length ? Math.max(1, Math.ceil(cartWeightKg / 1000)) : 0;
  const shippingFee = appliedVoucher === 'FREESHIP' || cart.length === 0
    ? 0
    : shippingTierCount * 500;

  const finalTotal = Math.max(0, cartSubtotal - effectiveDiscount + shippingFee);

  const applyVoucher = (code) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ARCHON20') {
      setAppliedVoucher('ARCHON20');
      showToast('20% OFF Discount applied successfully.', 'success');
      return true;
    } else if (clean === 'ARCHON500') {
      setAppliedVoucher('ARCHON500');
      showToast('PHP 500 discount voucher applied successfully.', 'success');
      return true;
    } else if (clean === 'FREESHIP') {
      setAppliedVoucher('FREESHIP');
      showToast('Free Shipping voucher applied successfully.', 'success');
      return true;
    } else {
      showToast('Invalid voucher code. Please try ARCHON20, ARCHON500, or FREESHIP.', 'error');
      return false;
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    showToast('Voucher removed.', 'info');
  };

  const createOrder = async (orderData) => {
    if (currentUser?.role === 'admin') {
      showToast('Admin accounts cannot place orders. Only customer accounts are permitted to purchase items.', 'error');
      return false;
    }

    for (const item of orderData.items) {
      const prodId = item.id || item.customId;
      const prod = products.find(p => p.id === prodId || p.customId === prodId);
      if (!prod || prod.stock < item.quantity) {
        showToast(`Insufficient stock for: ${item.title}. Available: ${prod ? prod.stock : 0}`, 'error');
        return false;
      }
    }

    try {

      const payload = {
        ...orderData,
        userId: currentUser?._id || currentUser?.id || null,
        items: orderData.items.map(i => ({
          customId: i.id || i.customId,
          productId: i.productId,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity
        }))
      };

      const backendOrder = await api.createOrder(payload);
      const raw = backendOrder.order || backendOrder;
      const savedOrder = {
        ...raw,
        id: raw.orderNumber || raw.order_number || raw.id || payload.orderNumber,
        orderNumber: raw.orderNumber || raw.order_number || raw.id,
        date: raw.date || raw.createdAt || raw.created_at || new Date().toISOString(),
        createdAt: raw.createdAt || raw.created_at || raw.date || new Date().toISOString(),
        customerName: raw.customerName || raw.customer_name || orderData.customerName,
        customerEmail: raw.customerEmail || raw.customer_email || orderData.customerEmail,
        customerPhone: raw.customerPhone || raw.customer_phone || orderData.customerPhone,
        deliveryAddress: raw.deliveryAddress || raw.delivery_address || orderData.deliveryAddress,
        deliveryNotes: raw.deliveryNotes || raw.delivery_notes || orderData.deliveryNotes || '',
        paymentMethod: raw.paymentMethod || raw.payment_method || orderData.paymentMethod || 'GCash',
        gcashRefNumber: raw.gcashRefNumber || raw.gcash_ref_number || orderData.gcashRefNumber || '',
        status: (raw.status || raw.delivery_status || 'CONFIRMED').toUpperCase(),
        deliveryStatus: (raw.status || raw.delivery_status || 'CONFIRMED').toUpperCase(),
        totalAmount: Number(raw.totalAmount ?? raw.total_amount ?? raw.total ?? orderData.totalAmount ?? 0),
        subtotal: Number(raw.subtotal ?? orderData.subtotal ?? 0),
        shippingFee: Number(raw.shippingFee ?? raw.shipping_fee ?? orderData.shippingFee ?? 0),
        discountAmount: Number(raw.discountAmount ?? raw.discount_amount ?? raw.discount ?? orderData.discountAmount ?? 0),
        items: Array.isArray(raw.items) && raw.items.length > 0 ? raw.items : orderData.items,
        trackingTimeline: raw.trackingTimeline || raw.tracking_steps || [
          { step: 'Order Placed', time: new Date().toLocaleString(), done: true },
          { step: 'Payment Review', time: orderData.paymentMethod === 'COD' ? 'Approved (COD)' : 'Payment Verified', done: true },
          { step: 'Factory Packed', time: 'Estimated 2-4 hours', done: false },
          { step: 'Out for Delivery', time: 'In dispatch queue', done: false },
          { step: 'Delivered', time: 'Pending transit', done: false }
        ]
      };

      const updatedProducts = products.map(prod => {
        const prodId = prod.id || prod.customId;
        const purchased = orderData.items.find(i => (i.id === prodId || i.customId === prodId));
        if (purchased) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - purchased.quantity),
            sold: prod.sold + purchased.quantity
          };
        }
        return prod;
      });

      setProducts(updatedProducts);
      setOrders([savedOrder, ...orders]);
      clearCart();
      setAppliedVoucher(null);
      showToast(`Order created successfully: ${savedOrder.orderNumber}`, 'success');
      return savedOrder;
    } catch (err) {
      console.warn('Backend order creation failed, falling back to local creation:', err.message);

      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const orderNumber = `AN-ORD-${new Date().getFullYear()}-${randomSuffix}`;

      const newOrder = {
        orderNumber,
        date: new Date().toISOString(),
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        deliveryAddress: orderData.deliveryAddress,
        deliveryNotes: orderData.deliveryNotes || '',
        paymentMethod: orderData.paymentMethod,
        gcashRefNumber: orderData.gcashRefNumber || '',
        proofImage: orderData.proofImage || null,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shippingFee: orderData.shippingFee,
        discountAmount: orderData.discountAmount,
        discountType: orderData.discountType,
        totalAmount: orderData.totalAmount,
        status: 'CONFIRMED',
        trackingTimeline: [
          { step: 'Order Placed', time: new Date().toLocaleString(), done: true },
          { step: 'Payment Review', time: orderData.paymentMethod === 'COD' ? 'Approved (COD)' : 'Payment Verified', done: true },
          { step: 'Factory Packed', time: 'Estimated 2-4 hours', done: false },
          { step: 'Out for Delivery', time: 'In dispatch queue', done: false },
          { step: 'Delivered', time: 'Pending transit', done: false }
        ]
      };

      const updatedProducts = products.map(prod => {
        const prodId = prod.id || prod.customId;
        const purchased = orderData.items.find(i => (i.id === prodId || i.customId === prodId));
        if (purchased) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - purchased.quantity),
            sold: prod.sold + purchased.quantity
          };
        }
        return prod;
      });

      setProducts(updatedProducts);
      setOrders([newOrder, ...orders]);
      clearCart();
      setAppliedVoucher(null);
      showToast(`Order recorded: ${orderNumber}`, 'success');
      return newOrder;
    }
  };

  const cancelOrder = async (orderNumber, reason = 'Customer request') => {
    const targetOrder = orders.find(o => o.orderNumber === orderNumber);
    if (!targetOrder) {
      showToast('Order not found.', 'error');
      return false;
    }

    if (targetOrder.status === 'CANCELLED') {
      showToast('This order has already been cancelled.', 'warning');
      return false;
    }

    if (['DELIVERED', 'REFUND_REQUESTED', 'REFUNDED'].includes(targetOrder.status)) {
      showToast('This order cannot be cancelled. Please review its current status.', 'error');
      return false;
    }

    try {
      const actor = currentUser ? { email: currentUser.email, name: currentUser.name, role: currentUser.role, id: currentUser._id || currentUser.id } : null;
      await api.cancelOrder(orderNumber, reason, actor);
    } catch (err) {
      console.warn('API cancelOrder warning:', err.message);
    }

    const updatedProducts = products.map(prod => {
      const prodId = prod.id || prod.customId;
      const orderItem = targetOrder.items.find(i => (i.id === prodId || i.customId === prodId));
      if (orderItem) {
        return {
          ...prod,
          stock: prod.stock + orderItem.quantity,
          sold: Math.max(0, prod.sold - orderItem.quantity)
        };
      }
      return prod;
    });

    const updatedOrders = orders.map(o => {
      if (o.orderNumber === orderNumber) {
        return {
          ...o,
          status: 'CANCELLED',
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
          trackingTimeline: [
            ...(o.trackingTimeline || []),
            { step: `Cancelled: ${reason}`, time: new Date().toLocaleString(), done: true, isCancelled: true }
          ]
        };
      }
      return o;
    });

    setProducts(updatedProducts);
    setOrders(updatedOrders);
    showToast(`Order #${orderNumber} cancelled. Items restored to inventory.`, 'success');
    return true;
  };

  const requestRefund = async (orderNumber, { reason, damagePhoto, details }) => {
    const targetOrder = orders.find(o => o.orderNumber === orderNumber);
    if (!targetOrder || targetOrder.status !== 'DELIVERED') {
      showToast('Refund requests can only be filed for delivered orders.', 'warning');
      return false;
    }

    try {
      await api.requestRefund(orderNumber, { reason, damagePhoto, details });
    } catch (err) {
      console.warn('API requestRefund warning:', err.message);
    }

    const updatedOrders = orders.map(o => {
      if (o.orderNumber === orderNumber) {
        return {
          ...o,
          status: 'REFUND_REQUESTED',
          refundDetails: {
            reason,
            damagePhoto,
            details,
            requestedAt: new Date().toISOString(),
            refundStatus: 'PENDING_REVIEW'
          }
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    showToast(`Refund request submitted for #${orderNumber}. Under review by Archon Nell Engineering QA.`, 'info');
    return true;
  };

  const approveRefund = async (orderNumber, restoreStock = true) => {
    const targetOrder = orders.find(o => o.orderNumber === orderNumber);
    if (!targetOrder || targetOrder.status !== 'REFUND_REQUESTED') {
      showToast('Only pending refund requests can be approved.', 'warning');
      return false;
    }

    try {
      const actor = currentUser ? { email: currentUser.email, name: currentUser.name, role: currentUser.role, id: currentUser._id || currentUser.id } : null;
      await api.approveRefund(orderNumber, restoreStock, actor);
    } catch (err) {
      console.warn('API approveRefund warning:', err.message);
    }

    if (restoreStock) {
      const updatedProducts = products.map(prod => {
        const prodId = prod.id || prod.customId;
        const orderItem = targetOrder.items.find(i => (i.id === prodId || i.customId === prodId));
        if (orderItem) {
          return { ...prod, stock: prod.stock + orderItem.quantity, sold: Math.max(0, prod.sold - orderItem.quantity) };
        }
        return prod;
      });
      setProducts(updatedProducts);
    }

    const updatedOrders = orders.map(o => {
      if (o.orderNumber === orderNumber) {
        return {
          ...o,
          status: 'REFUNDED',
          refundDetails: {
            ...o.refundDetails,
            refundStatus: 'APPROVED',
            approvedAt: new Date().toISOString()
          }
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    showToast(`Refund approved for #${orderNumber}.`, 'success');
  };

  
  const rateDeliveredOrder = async (orderNumber, { rating, notes }) => {
    const targetOrder = orders.find(o => o.orderNumber === orderNumber);
    if (!targetOrder) {
      showToast('Order not found.', 'error');
      return false;
    }
    if (targetOrder.status !== 'DELIVERED') {
      showToast('Only delivered orders can be rated.', 'warning');
      return false;
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      showToast('Please select a rating between 1 and 5 stars.', 'warning');
      return false;
    }

    const trimmedNotes = String(notes || '').trim();
    if (trimmedNotes.length < 15) {
      showToast(`Notes must be at least 15 characters (currently ${trimmedNotes.length}).`, 'warning');
      return false;
    }
    if (trimmedNotes.length > 60) {
      showToast('Notes cannot exceed 60 characters.', 'warning');
      return false;
    }

    try {
      await api.rateOrder(orderNumber, { rating: numRating, notes: trimmedNotes });
    } catch (err) {
      console.warn('API rateOrder warning:', err.message);
    }

    const ratedAt = new Date().toISOString();
    const updatedOrders = orders.map(o => {
      if (o.orderNumber === orderNumber) {
        return {
          ...o,
          rating: numRating,
          notes: trimmedNotes,
          ratedAt
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('archon_nell_orders', JSON.stringify(updatedOrders));

    if (targetOrder.items && targetOrder.items.length) {
      targetOrder.items.forEach(item => {
        const prodId = item.customId || item.productId || item.id;
        if (prodId) {
          addReview(prodId, {
            userName: targetOrder.customerName || currentUser?.name || 'Verified Customer',
            rating: numRating,
            comment: trimmedNotes,
            verified: true
          });
        }
      });
    }

    showToast(`Order #${orderNumber} rated successfully (${numRating}★)!`, 'success');
    return true;
  };

  const updateOrderStatus = async (orderNumber, newStatus) => {
    const target = orders.find(o => o.orderNumber === orderNumber);
    if (!target) return false;

    const statusMap = {
      'pending': 'CONFIRMED',
      'confirmed': 'CONFIRMED',
      'preparing': 'PREPARING',
      'shipped': 'IN_TRANSIT',
      'in_transit': 'IN_TRANSIT',
      'delivered': 'DELIVERED'
    };

    const targetStatus = statusMap[newStatus.toLowerCase()] || newStatus.toUpperCase();

    if (target.status === 'DELIVERED') {
      showToast('Order is already delivered. Status cannot be modified.', 'warning');
      return false;
    }
    if (target.status === 'CANCELLED') {
      showToast('Order is cancelled. Status cannot be modified.', 'warning');
      return false;
    }
    if (['REFUNDED', 'REFUND_REQUESTED'].includes(target.status)) {
      showToast('Order is under return/refund review.', 'warning');
      return false;
    }

    const allowedTransitions = {
      'CONFIRMED': 'PREPARING',
      'PENDING': 'PREPARING',
      'PREPARING': 'IN_TRANSIT',
      'IN_TRANSIT': 'DELIVERED'
    };

    const expectedNext = allowedTransitions[target.status];
    if (targetStatus !== expectedNext) {
      showToast(`Cannot change status backwards. Next stage is ${expectedNext || 'Delivered'}.`, 'warning');
      return false;
    }

    try {
      const actor = currentUser ? { email: currentUser.email, name: currentUser.name, role: currentUser.role, id: currentUser._id || currentUser.id } : null;
      await api.updateOrderStatus(orderNumber, targetStatus, actor);
    } catch (err) {
      console.warn('API updateOrderStatus warning:', err.message);
    }

    const nowStr = new Date().toLocaleString();
    setOrders(prev => prev.map(o => {
      if (o.orderNumber !== orderNumber) return o;
      const timeline = (o.trackingTimeline || []).map(t => ({ ...t }));
      if (targetStatus === 'PREPARING' && timeline[2]) {
        timeline[2] = { ...timeline[2], done: true, time: nowStr };
      } else if (targetStatus === 'IN_TRANSIT') {
        if (timeline[2]) timeline[2].done = true;
        if (timeline[3]) { timeline[3].done = true; timeline[3].time = nowStr; }
      } else if (targetStatus === 'DELIVERED') {
        if (timeline[2]) timeline[2].done = true;
        if (timeline[3]) timeline[3].done = true;
        if (timeline[4]) { timeline[4].done = true; timeline[4].time = nowStr; }
      }
      return { ...o, status: targetStatus, trackingTimeline: timeline };
    }));
    showToast(`Order #${orderNumber} delivery status updated to ${newStatus.toUpperCase()}.`, 'success');
    return true;
  };

  const analyzeReviewsWithAI = (productId) => {
    const prodReviews = reviews[productId] || [];
    if (!prodReviews.length) {
      return {
        sentiment: 'No reviews yet', positivePercentage: 0,
        summary: 'There are no reviews for this product yet.', highlights: []
      };
    }
    const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = (totalRating / prodReviews.length).toFixed(1);
    const positiveCount = prodReviews.filter(r => r.rating >= 4).length;
    const positivePercentage = Math.round(positiveCount / prodReviews.length * 100);
    const comments = prodReviews.map(r => String(r.comment || '').toLowerCase()).join(' ');
    const highlights = [];
    if (/curing|fast|quick/.test(comments)) highlights.push('Fast curing time');
    if (/strength|psi|durab/.test(comments)) highlights.push('Ultra-high compressive strength');
    if (/slump|flow|viscosity/.test(comments)) highlights.push('Superior workability and slump');
    if (!highlights.length) highlights.push('High engineering satisfaction');
    return {
      averageRating: avg, reviewCount: prodReviews.length, positivePercentage,
      sentiment: positivePercentage >= 70 ? 'Mostly positive ratings' : positivePercentage >= 50 ? 'Mixed ratings' : 'Needs attention',
      summary: `Engineering summary of ${prodReviews.length} verified review(s): average rating ${avg}/5, with ${positivePercentage}% giving top ratings.`,
      highlights
    };
  };

  const addReview = async (productId, { userName, rating, comment, verified = false }) => {
    const newRev = {
      id: `rev-${Date.now()}`,
      userName: userName?.trim() || currentUser?.name || 'Verified Customer',
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      date: new Date().toISOString().slice(0, 10),
      comment: comment.trim(),
      verified: Boolean(verified)
    };

    try {
      await api.addReview({
        productId,
        name: newRev.userName,
        rating: newRev.rating,
        comment: newRev.comment
      });
    } catch (err) {
      console.warn('API addReview warning:', err.message);
    }

    const updatedList = [newRev, ...(reviews[productId] || [])];
    setReviews(prev => ({ ...prev, [productId]: updatedList }));
    const avg = updatedList.reduce((s, r) => s + r.rating, 0) / updatedList.length;
    setProducts(prev => prev.map(p => (p.id === productId || p.customId === productId) ? { ...p, rating: Number(avg.toFixed(1)) } : p));
    showToast('Review submitted and catalog rating updated.', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentView, setCurrentView,
        products, setProducts,
        projects,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        totalItemCount,
        isBulkyOrder,
        bulkyDiscountAmount,
        voucherCode, setVoucherCode,
        appliedVoucher,
        voucherDiscountAmount,
        effectiveDiscount,
        discountType,
        shippingFee,
        cartWeightKg,
        shippingTierCount,
        finalTotal,
        applyVoucher,
        removeVoucher,
        orders,
        createOrder,
        cancelOrder,
        requestRefund,
        approveRefund,
        updateOrderStatus,
        reviews,
        addReview,
        analyzeReviewsWithAI,
        isCartOpen, setIsCartOpen,
        isCheckoutOpen, setIsCheckoutOpen,
        isTrackingOpen, setIsTrackingOpen,
        isReviewsOpen, setIsReviewsOpen,
        isRefundOpen, setIsRefundOpen,
        isRateModalOpen, setIsRateModalOpen,
        selectedOrderForRating, setSelectedOrderForRating,
        openRateModal,
        rateDeliveredOrder,
        isCsOpen, setIsCsOpen,
        isAuthOpen, setIsAuthOpen,
        isSettingsOpen, setIsSettingsOpen,
        updateUserProfile,
        selectedProductForReview, setSelectedProductForReview,
        selectedOrderForTracking, setSelectedOrderForTracking,
        selectedOrderForRefund, setSelectedOrderForRefund,
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        currentUser, setCurrentUser,
        loginUser, logoutUser, loginWithAuth,
        otpState, setOtpState,
        triggerOtp, verifyOtpCode,
        toastMessage, showToast,
        isApiConnected, isApiLoading, apiError, refreshAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
