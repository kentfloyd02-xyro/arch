import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  Check, 
  Truck,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    cart,
    products,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    totalItemCount,
    isBulkyOrder,
    bulkyDiscountAmount,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    effectiveDiscount,
    discountType,
    shippingFee,
    cartWeightKg,
    shippingTierCount,
    finalTotal,
    currentUser,
    setIsAuthOpen,
    setCurrentView,
    refreshAllData,
    showToast
  } = useApp();

  const [inputCode, setInputCode] = useState('');

  // Automatically refresh catalog stock whenever cart is opened
  React.useEffect(() => {
    if (isCartOpen) {
      refreshAllData().catch(() => {});
    }
  }, [isCartOpen, refreshAllData]);

  const findLiveProduct = (product) => {
    if (!product) return null;
    const prodId = product.id || product.customId || product.dbId;
    return products.find(p => (
      (p.id && (p.id === prodId || p.id === product.id || p.id === product.customId || p.id === product.dbId)) ||
      (p.customId && (p.customId === prodId || p.customId === product.id || p.customId === product.customId)) ||
      (p.dbId && (p.dbId === prodId || p.dbId === product.id || p.dbId === product.dbId)) ||
      (p.title && product.title && p.title.trim().toLowerCase() === product.title.trim().toLowerCase())
    ));
  };

  const hasOutOfStockItems = cart.some(item => {
    const live = findLiveProduct(item.product);
    const stock = live !== undefined ? Number(live.stock ?? 0) : Number(item.product.stock ?? 0);
    return stock <= 0;
  });

  const handleBrowseProducts = () => {
    setIsCartOpen(false);
    setCurrentView('store');
    setTimeout(() => {
      const el = document.getElementById('products') || document.querySelector('#products');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.global_role === 'admin' || currentUser?.global_role === 'superadmin';
  if (!isCartOpen || isAdmin) return null;

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!inputCode) return;
    applyVoucher(inputCode);
    setInputCode('');
  };

  const handleProceedToCheckout = async () => {
    if (cart.length === 0) return;

    // Fresh stock verification right before checkout
    await refreshAllData().catch(() => {});

    const outOfStockItem = cart.find(item => {
      const live = findLiveProduct(item.product);
      const stock = live !== undefined ? Number(live.stock ?? 0) : Number(item.product.stock ?? 0);
      return stock <= 0;
    });

    if (outOfStockItem) {
      showToast(`Cannot proceed: "${outOfStockItem.product.title}" is currently out of stock. Please remove it from your cart.`, 'error');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in to your account first before checking out.', 'warning');
      setIsCartOpen(false);
      setIsAuthOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 bg-[#0b1b3d] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Your Shopping Cart</h3>
                <p className="text-xs text-slate-300">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bulky Discount Banner */}
          {isBulkyOrder && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800">
              <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Bulky Contractor Discount Active:</strong> Automatic 10% volume discount applied (-PHP {bulkyDiscountAmount.toLocaleString()}).
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Your Cart is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Explore our industrial catalog and select construction materials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBrowseProducts}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cart.map(item => {
                const live = findLiveProduct(item.product);
                const maxStock = live !== undefined ? Number(live.stock ?? 0) : Number(item.product.stock ?? 0);
                const isOutOfStock = maxStock <= 0;
                const isMax = item.quantity >= maxStock;

                return (
                  <div
                    key={item.product.id}
                    className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                      isOutOfStock
                        ? 'border-rose-300 bg-rose-50/50 shadow-sm'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className={`w-16 h-16 object-contain bg-white rounded-lg p-1 border flex-shrink-0 ${
                          isOutOfStock ? 'border-rose-300 opacity-70' : 'border-slate-200'
                        }`}
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.product.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-blue-600">
                            PHP {item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-300">
                              Out of Stock
                            </span>
                          ) : item.quantity > maxStock ? (
                            <span className="text-[10px] font-bold text-amber-600">
                              (Only {maxStock} left in stock)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              (Stock: {maxStock})
                            </span>
                          )}
                        </div>

                        {/* Quantity Selector / Out of Stock action */}
                        <div className="flex items-center gap-2 pt-1">
                          {isOutOfStock ? (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove out-of-stock item</span>
                            </button>
                          ) : (
                            <>
                              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="p-1 hover:bg-slate-100 text-slate-600"
                                >
                                  <Minus className="w-3.5 h-3.5" />
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
                                  className="w-14 text-center text-xs font-bold text-slate-800 border-x border-slate-200 py-1 px-1 focus:outline-none focus:bg-blue-50/50 [appearance:textfield] font-mono"
                                  title="Type exact order quantity"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, Math.min(maxStock, item.quantity + 1))}
                                  disabled={isMax}
                                  className={`p-1 text-slate-600 ${isMax ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100'}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Out of Stock Notice Banner */}
                    {isOutOfStock && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-100/80 border border-rose-300 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>This product is currently out of stock. Please remove it from your cart to proceed with checkout.</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Computations & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              
              {/* Voucher Code Input */}
              <div>
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="ARCHON20 / FREESHIP"
                      className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </form>

                {/* Applied voucher pill */}
                {appliedVoucher && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
                    <span className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Voucher Applied: {appliedVoucher} ({discountType})
                    </span>
                    <button
                      onClick={removeVoucher}
                      className="text-emerald-700 hover:text-rose-600 font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalItemCount} items)</span>
                  <span className="font-semibold text-slate-900">
                    PHP {cartSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discountType || 'Promo'})</span>
                    <span className="font-bold">
                      -PHP {effectiveDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    Direct Cainta Logistics / Delivery Fee
                  </span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `PHP ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <p className="-mt-1 text-[10px] leading-relaxed text-slate-500">Estimated order weight: {cartWeightKg.toLocaleString()} kg ({shippingTierCount} × 1,000 kg tier). Delivery is PHP 500 per 1,000 kg or part thereof; each additional 1,000 kg adds PHP 500. Package weights are estimates.</p>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-blue-600 text-lg">
                    PHP {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Out of stock warning banner before checkout */}
              {hasOutOfStockItems && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-semibold">
                    Your cart contains out-of-stock items. Please remove them before proceeding to checkout.
                  </span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={hasOutOfStockItems}
                className={`w-full py-3.5 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  hasOutOfStockItems
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95 cursor-pointer'
                }`}
              >
                <span>
                  {hasOutOfStockItems ? 'Cannot Checkout (Out of Stock Items in Cart)' : 'Proceed to Industrial Checkout'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>GCash, Maya, Bank Transfer & COD Supported</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
