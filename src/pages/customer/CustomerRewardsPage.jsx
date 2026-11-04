import React from 'react';
import { useCustomerRewardsPageController } from '../../controllers/CustomerRewardsPageController';
import { Star, Wallet, Heart } from 'lucide-react';

const panelClass = 'rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6';

export default function CustomerRewardsPage() {
  const {
    rewardTier,
    rewardPointsFormatted,
    coupons,
    wishlistProducts,
    suggestedProducts,
    addToCart,
    removeFromWishlist,
    addToWishlist
  } = useCustomerRewardsPageController();

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Loyalty Member Card */}
      <section className={`${panelClass} bg-gradient-to-br from-[#0b1b3d] to-[#172b52]`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">
              Demo loyalty
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">{rewardTier} member</h2>
            <p className="mt-1 text-xs text-slate-300">
              Points estimate from completed spend
            </p>
          </div>
          <Star size={25} className="text-amber-300" />
        </div>
        <div className="mt-6 text-4xl font-black text-amber-300">
          {rewardPointsFormatted} <span className="text-sm font-bold">pts</span>
        </div>
        <p className="mt-2 text-[10px] text-slate-400">
          Demo estimate: 1 point per PHP 100 spent. No points are redeemable.
        </p>
      </section>

      {/* Coupon Wallet */}
      <section className={panelClass}>
        <div className="flex items-center gap-2">
          <Wallet size={17} className="text-emerald-300" />
          <h2 className="text-sm font-extrabold text-white">Coupon wallet</h2>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">
          Available discount codes · no gift balance or expiry tracking
        </p>
        <div className="mt-4 space-y-2">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="flex items-center justify-between rounded-xl border border-[#142958] bg-[#07132c] p-3"
            >
              <div>
                <strong className="font-mono text-xs text-blue-200">
                  {coupon.code}
                </strong>
                <p className="mt-1 text-[10px] text-slate-400">{coupon.detail}</p>
              </div>
              <span className="text-[9px] text-emerald-300">Available</span>
            </div>
          ))}
        </div>
      </section>

      {/* Wishlist Section */}
      <section className={`${panelClass} xl:col-span-2`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Heart size={16} className="text-rose-300" />
              Wishlist
            </h2>
            <p className="mt-1 text-[10px] text-slate-400">
              Saved on this browser; price-drop alerts are not connected.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {wishlistProducts.map((product) => (
            <article
              key={product.id}
              className="flex gap-3 rounded-xl border border-[#142958] bg-[#07132c] p-3"
            >
              <img
                src={product.image}
                alt={product.title}
                className="h-16 w-16 rounded-lg bg-white object-contain p-1"
              />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[10px] font-bold text-white">
                  {product.title}
                </h3>
                <p className="mt-1 text-xs font-bold text-emerald-300">
                  {product.formattedPrice}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    className="text-[9px] font-bold text-blue-300 hover:text-blue-200"
                  >
                    Add to cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="text-[9px] text-rose-300 hover:text-rose-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!wishlistProducts.length && (
            <p className="rounded-xl border border-dashed border-[#142958] p-6 text-center text-[10px] text-slate-500 sm:col-span-2 xl:col-span-3">
              Your wishlist is empty. Save products here to keep them handy.
            </p>
          )}
        </div>

        {/* Suggestion list */}
        <div className="mt-5 border-t border-[#142958] pt-4">
          <h3 className="text-xs font-bold text-slate-200">
            Add products to wishlist
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {suggestedProducts.map((product) => (
              <div
                key={product.id}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-[#142958] bg-[#07132c] p-2.5"
              >
                <span className="truncate text-[10px] text-slate-300">
                  {product.title}
                </span>
                <button
                  aria-label={`Save ${product.title} to wishlist`}
                  onClick={() => addToWishlist(product.id)}
                  className="shrink-0 rounded-md border border-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-500/10"
                >
                  <Heart size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
