import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  CreditCard, 
  Lock, 
  Mail, 
  Building,
  MapPin,
  Truck,
  ExternalLink
} from 'lucide-react';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    setIsTrackingOpen,
    setSelectedOrderForTracking,
    cart,
    cartSubtotal,
    effectiveDiscount,
    discountType,
    shippingFee,
    cartWeightKg,
    shippingTierCount,
    finalTotal,
    createOrder,
    updateCartQuantity,
    currentUser,
    updateUserProfile,
    triggerOtp,
    setOtpState,
    showToast,
    setIsAuthOpen
  } = useApp();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState((currentUser?.phone || '').replace(/\D/g, '').slice(0, 11));
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [refError, setRefError] = useState('');

  // Email verification status
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const storagePrefix = `archon-customer-${currentUser?.id || currentUser?.email || 'guest'}`;

  const getSavedAddressBook = () => {
    const list = [];
    const userAddr = currentUser?.address || currentUser?.defaultAddress || currentUser?.default_address;
    if (userAddr && userAddr.trim()) {
      list.push({ id: 'primary', label: 'Default Account Address', address: userAddr.trim() });
    }
    try {
      const raw = localStorage.getItem(`${storagePrefix}-addresses`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item, idx) => {
            const addr = typeof item === 'string' ? item : item?.address;
            const label = typeof item === 'string' ? `Saved Site #${idx + 1}` : item?.label || 'Saved Site';
            if (addr && addr.trim() && !list.some(l => l.address.toLowerCase() === addr.trim().toLowerCase())) {
              list.push({ id: item?.id || `book-${idx}`, label, address: addr.trim() });
            }
          });
        }
      }
    } catch {}
    return list;
  };

  useEffect(() => {
    if (!isCheckoutOpen) return;
    setCustomerName(currentUser?.name || currentUser?.fullName || '');
    setCustomerEmail(currentUser?.email || '');
    setCustomerPhone((currentUser?.phone || currentUser?.phoneNumber || '').replace(/\D/g, '').slice(0, 11));
    const book = getSavedAddressBook();
    const initialAddress = book.length > 0 ? book[0].address : (currentUser?.address || currentUser?.defaultAddress || '');
    setDeliveryAddress(initialAddress || '');
    setDeliveryNotes('');
    setPaymentMethod('COD');
    setGcashRefNumber('');
    setProofImage(null);
    setProofImagePreview(null);
    setVerifiedEmail('');
    setRefError('');
    setIsSubmitting(false);
    setPlacedOrder(null);
    setOtpState(prev => ({ ...prev, isVerified: false, isOpen: false, email: '' }));
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen || currentUser?.role === 'admin') return null;

  if (!currentUser) {
    return null;
  }

  // Handle GCash Ref Number change with strict 13-digit requirement
  const handleGcashRefChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 13) {
      setGcashRefNumber(val);
      if (val.length > 0 && val.length !== 13) {
        setRefError('The GCash Reference Number must be exactly 13 digits.');
      } else {
        setRefError('');
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
        showToast('Please upload an image smaller than 2 MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
        setProofImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOtp = () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    triggerOtp(customerEmail, () => {
      setVerifiedEmail(customerEmail.trim().toLowerCase());
    });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!cart.length) { 
      showToast('Your cart is empty.', 'warning'); 
      return; 
    }
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      showToast('Please complete all required delivery details.', 'warning');
      return;
    }

    if (customerPhone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 11-digit mobile contact number.', 'warning');
      return;
    }

    // Require Email OTP verification
    if (verifiedEmail !== customerEmail.trim().toLowerCase()) {
      showToast('Please complete the email OTP verification step before placing your order.', 'warning');
      handleSendOtp();
      return;
    }

    if (paymentMethod === 'GCash') {
      if (gcashRefNumber.length !== 13) {
        setRefError('GCash Reference Number must be exactly 13 digits (e.g. 1234567890123).');
        showToast('Invalid GCash Reference Number format (13 digits required).', 'error');
        return;
      }
    }

    if (paymentMethod === 'Maya' && !gcashRefNumber.trim()) {
      showToast('Please enter your Maya transaction reference number.', 'warning');
      return;
    }

    if (paymentMethod === 'Bank' && !gcashRefNumber.trim()) {
      showToast('Please enter your bank transfer / deposit reference number.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      deliveryNotes: deliveryNotes.trim(),
      paymentMethod,
      gcashRefNumber: gcashRefNumber.trim(),
      proofImage,
      items: cart.map(item => ({
        id: item.product.id,
        productId: item.product.dbId || item.product._id || item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity
      })),
      subtotal: cartSubtotal,
      shippingFee,
      discountAmount: effectiveDiscount,
      discountType,
      totalAmount: finalTotal
    };

    try {
      const newOrder = await createOrder(orderData);
      if (newOrder) {
        const trimmedAddress = deliveryAddress.trim();
        if (trimmedAddress) {
          try {
            const raw = localStorage.getItem(`${storagePrefix}-addresses`);
            let list = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(list)) list = [];
            const exists = list.some(item => (typeof item === 'string' ? item : item?.address || '').toLowerCase() === trimmedAddress.toLowerCase());
            if (!exists) {
              list.unshift({
                id: `addr-${Date.now()}`,
                label: 'Job Site Delivery Address',
                address: trimmedAddress
              });
              localStorage.setItem(`${storagePrefix}-addresses`, JSON.stringify(list));
            }
          } catch (err) {
            console.warn('Address book sync error:', err);
          }
        }
        setOtpState(prev => ({ ...prev, isVerified: false, isOpen: false }));
        setPlacedOrder(newOrder);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      showToast(err.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-[#0b1b3d] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Archon Nell Industrial Order Checkout</h3>
              <p className="text-xs text-slate-300">Verified construction materials procurement &amp; dispatch allocation</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setPlacedOrder(null);
            }}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS SCREEN */}
        {placedOrder ? (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              Order Confirmed &amp; Logged
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
              Thank you for purchasing with Archon Nell Incorporated. Your order has been registered in the centralized database and queued for warehouse dispatch.
            </p>

            <div className="w-full max-w-lg mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Reference</span>
                  <p className="text-base font-extrabold text-[#0B1B3D] font-mono">{placedOrder.orderNumber || placedOrder.order_number}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Status</span>
                  <p className="text-xs font-bold text-emerald-600">
                    {placedOrder.paymentMethod === 'COD' ? 'Cash on Delivery (Pending)' : 'Payment Verified'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Deliver To</span>
                  <span className="font-bold text-slate-800">{placedOrder.customerName}</span>
                  <p className="text-[11px] text-slate-500 font-mono">{placedOrder.customerPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Payment Method</span>
                  <span className="font-bold text-slate-800">{placedOrder.paymentMethod}</span>
                  <p className="text-[11px] text-slate-500 font-mono">PHP {Number(placedOrder.totalAmount || placedOrder.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-semibold text-slate-400 block">Job Site Depot / Destination</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{placedOrder.deliveryAddress}</p>
              </div>
            </div>

            <div className="w-full max-w-lg mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForTracking(placedOrder);
                  setIsCheckoutOpen(false);
                  setIsTrackingOpen(true);
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track Order Dispatch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setPlacedOrder(null);
                }}
                className="w-full sm:w-auto py-3 px-6 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* FORM BODY */
          <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. Customer & Delivery Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                1. Customer &amp; Job Site Delivery Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name / Contractor In-Charge *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Contact Phone Number *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {customerPhone.length}/11
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={customerPhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setCustomerPhone(clean);
                    }}
                    placeholder="09171234567"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Email with OTP Verification Badge */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      setVerifiedEmail('');
                    }}
                    placeholder="engineer@contractor.com"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                      verifiedEmail === customerEmail.trim().toLowerCase() && customerEmail
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {verifiedEmail === customerEmail.trim().toLowerCase() && customerEmail ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Verify Email</span>
                      </>
                    )}
                  </button>
                </div>
                {verifiedEmail !== customerEmail.trim().toLowerCase() ? (
                  <p className="text-[10px] text-slate-400 mt-1">
                    A 6-digit verification code will be dispatched to your email via Brevo SMTP.
                  </p>
                ) : (
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Email verified for this session.
                  </p>
                )}
              </div>

              {/* Delivery Address & Saved Sites Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Delivery Address / Job Site Depot *
                  </label>
                </div>

                {getSavedAddressBook().length > 0 && (
                  <div className="mb-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>Saved Job Sites / Depot Addresses</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {getSavedAddressBook().map((item, idx) => {
                        const isSelected = deliveryAddress.trim().toLowerCase() === item.address.trim().toLowerCase();
                        return (
                          <button
                            key={item.id || idx}
                            type="button"
                            onClick={() => setDeliveryAddress(item.address)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all text-left truncate max-w-full flex items-center gap-1.5 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white hover:bg-blue-100/70 text-slate-700 border-blue-200 hover:border-blue-300'}`}
                            title={item.address}
                          >
                            <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                            <span className="font-bold shrink-0">{item.label}:</span>
                            <span className="truncate">{item.address}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="National Highway km 42, Cainta / San Simon Project Depot, Gate 2..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This address will automatically be saved to your Account Settings and Address Book upon placing your order.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Delivery Notes / Unloading Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Heavy pallet crane unloading required, Call before delivery"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 2. Payment Method Selection */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                2. Payment Method
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'GCash', label: 'GCash', sub: 'Instant Transfer' },
                  { id: 'Maya', label: 'Maya', sub: 'Instant Transfer' },
                  { id: 'Bank', label: 'Bank Transfer', sub: 'BDO / BPI' },
                  { id: 'COD', label: 'Cash on Delivery', sub: 'Pay on Arrival' }
                ].map(method => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === method.id
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{method.label}</div>
                    <div className="text-[10px] text-slate-500">{method.sub}</div>
                  </button>
                ))}
              </div>

              {/* GCash Payment Details Section */}
              {paymentMethod === 'GCash' && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">GCASH MERCHANT ACCOUNT</span>
                      <span className="text-[10px] text-slate-400 font-medium">Direct Transfer</span>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm">Archon Nell Incorporated</h5>
                      <p className="text-blue-700 font-mono text-xs font-bold mt-0.5">0917-889-2724</p>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Please send payment to the official Archon Nell GCash account above and provide the 13-digit transaction reference number below.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        GCash Reference Number * (Exact 13 digits)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {gcashRefNumber.length}/13
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      value={gcashRefNumber}
                      onChange={handleGcashRefChange}
                      placeholder="e.g. 1002938475829"
                      className={`w-full px-3.5 py-2.5 text-xs font-mono tracking-wider bg-white border rounded-xl focus:outline-none ${
                        refError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-slate-300'
                      }`}
                    />
                    {refError && (
                      <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {refError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Upload Deposit Receipt / Screenshot (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2.5 bg-white border border-dashed border-blue-400 hover:border-blue-600 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Select Screenshot File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {proofImagePreview && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Receipt attached</span>
                        </div>
                      )}
                    </div>

                    {proofImagePreview && (
                      <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 inline-block">
                        <img
                          src={proofImagePreview}
                          alt="Proof Preview"
                          className="h-28 w-auto rounded object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Maya Payment Section */}
              {paymentMethod === 'Maya' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">MAYA BUSINESS ACCOUNT</span>
                      <span className="text-[10px] text-slate-400 font-medium">Direct Transfer</span>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm">Archon Nell Incorporated</h5>
                      <p className="text-emerald-700 font-mono text-xs font-bold mt-0.5">0917-889-2724</p>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Please transfer payment to the official Archon Nell Maya account and enter the reference number below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Maya Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={gcashRefNumber}
                      onChange={(e) => setGcashRefNumber(e.target.value)}
                      placeholder="Enter Maya Reference Number"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Upload Payment Confirmation Screenshot (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2.5 bg-white border border-dashed border-emerald-400 hover:border-emerald-600 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Select Screenshot File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {proofImagePreview && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Receipt attached</span>
                        </div>
                      )}
                    </div>

                    {proofImagePreview && (
                      <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 inline-block">
                        <img
                          src={proofImagePreview}
                          alt="Proof Preview"
                          className="h-28 w-auto rounded object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Transfer Section */}
              {paymentMethod === 'Bank' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Corporate Bank Accounts</h5>
                    <p className="text-slate-500 text-[11px]">Deposit or transfer via online banking / OTC to any of our official company accounts:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1 shadow-xs">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800">BDO UNIBANK</span>
                      <p className="font-bold text-slate-800 text-xs">Cainta Central Branch</p>
                      <p className="text-slate-600 text-[11px]">Account Name: <strong className="text-slate-900">Archon Nell Incorporated</strong></p>
                      <p className="text-blue-700 font-mono font-bold text-xs">0048-2910-8472</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1 shadow-xs">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800">BPI</span>
                      <p className="font-bold text-slate-800 text-xs">Ortigas East Branch</p>
                      <p className="text-slate-600 text-[11px]">Account Name: <strong className="text-slate-900">Archon Nell Incorporated</strong></p>
                      <p className="text-rose-700 font-mono font-bold text-xs">3182-9401-55</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Bank Transaction / Deposit Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={gcashRefNumber}
                      onChange={(e) => setGcashRefNumber(e.target.value)}
                      placeholder="e.g. BDO-9823471029 or BPI-001928"
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Upload Deposit Slip / Bank Transfer Receipt (Proof of Payment)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2.5 bg-white border border-dashed border-blue-400 hover:border-blue-600 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Select Deposit Slip / Receipt File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {proofImagePreview && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Deposit slip attached</span>
                        </div>
                      )}
                    </div>

                    {proofImagePreview && (
                      <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 inline-block">
                        <img
                          src={proofImagePreview}
                          alt="Deposit Slip Preview"
                          className="h-28 w-auto rounded object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COD Section */}
              {paymentMethod === 'COD' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold">Cash On Delivery (Cainta / Rizal / Metro Manila Sites)</div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Standard Cash on Delivery terms apply. Materials will be inspected and payment collected upon delivery handover at your job site depot.
                  </p>
                </div>
              )}
            </div>

            {/* 3. Order Items & Price Computation Breakdown */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Order Items &amp; Price Computation
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  {cart.length} {cart.length === 1 ? 'Product' : 'Products'} in Order
                </span>
              </div>

              {/* Directly typable item quantities at checkout */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const maxStock = item.product.stock || 5000;
                  const isMax = item.quantity >= maxStock;
                  return (
                    <div key={item.product.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-10 h-10 object-contain rounded-lg border border-slate-100 p-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.product.title}</p>
                          <p className="text-[11px] text-blue-600 font-extrabold">
                            PHP {item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Decrease quantity"
                          >
                            <span className="text-xs font-bold">-</span>
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxStock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (isNaN(val) || val <= 0) return;
                              const safeVal = Math.min(maxStock, val);
                              updateCartQuantity(item.product.id, safeVal);
                            }}
                            className="w-16 text-center text-xs font-black text-slate-800 border-x border-slate-200 py-1 px-1 focus:outline-none focus:bg-blue-50/50 [appearance:textfield] font-mono"
                            title="Type exact quantity (e.g. 1000)"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, Math.min(maxStock, item.quantity + 1))}
                            disabled={isMax}
                            className={`px-2 py-1 text-slate-600 ${isMax ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 transition-colors'}`}
                            title="Increase quantity"
                          >
                            <span className="text-xs font-bold">+</span>
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-black text-slate-900 block">
                            PHP {(item.product.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Items Subtotal ({cart.length} unique products)</span>
                  <span className="font-semibold text-slate-800">
                    PHP {cartSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Applied Discount ({discountType || 'Volume Discount'})</span>
                    <span className="font-bold">
                      -PHP {effectiveDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Plant Logistics / Shipping Fee</span>
                  <span className="font-semibold text-slate-800">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE SHIPPING</span>
                    ) : (
                      `PHP ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500">
                  Estimated delivery weight: {cartWeightKg.toLocaleString()} kg ({shippingTierCount} × 1,000 kg tier). Fee is PHP 500 per 1,000 kg or part thereof.
                </p>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-blue-600 text-lg">
                    PHP {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex-shrink-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Confirm &amp; Place Order</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Your order is recorded and synchronized directly with Archon Nell logistics &amp; warehouse dispatch.
              </p>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
