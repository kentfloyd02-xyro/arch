import React from 'react';
import { useAdminInventoryPageController } from '../../controllers/AdminInventoryPageController';
import { Package, Search, X, Plus, Minus } from 'lucide-react';

export default function AdminInventoryPage() {
  const {
    productSearch,
    setProductSearch,
    isProductFormOpen,
    editingProductId,
    productDraft,
    setProductDraft,
    handleProductSubmit,
    startProductEdit,
    openNewProductForm,
    closeProductForm,
    handleImageUpload,
    handleStockAdjust,
    filteredProducts
  } = useAdminInventoryPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#142958]">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Product Catalog &amp; Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time warehouse inventory, adjust safety buffer stock, and update catalog specifications.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-8 pr-8 py-1.5 bg-[#07132c] text-xs text-white placeholder-slate-400 rounded-xl border border-[#142958] focus:outline-none focus:border-blue-500"
          />
          {productSearch && (
            <button
              onClick={() => setProductSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add Product Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openNewProductForm}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
        >
          <Plus size={14} /> Add product
        </button>
      </div>

      {/* Product Form Modal / Section */}
      {isProductFormOpen && (
        <form
          onSubmit={handleProductSubmit}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-[#142958] bg-[#07132c] p-4 sm:grid-cols-2"
        >
          <h3 className="text-sm font-bold text-white sm:col-span-2">
            {editingProductId ? 'Edit product' : 'New catalog item'}
          </h3>
          {[
            ['title', 'Product name'],
            ['sku', 'SKU'],
            ['category', 'Category'],
            ['price', 'Price (PHP)'],
            ['stock', 'Stock count'],
            ['shippingWeightKg', 'Shipping weight per unit (kg)']
          ].map(([field, label]) => (
            <label key={field} className="text-[10px] font-semibold text-slate-400">
              {label}
              <input
                required={field !== 'sku'}
                type={
                  ['price', 'stock', 'shippingWeightKg'].includes(field)
                    ? 'number'
                    : 'text'
                }
                min={
                  ['price', 'stock', 'shippingWeightKg'].includes(field)
                    ? 0
                    : undefined
                }
                step={
                  field === 'price' || field === 'shippingWeightKg' ? '0.1' : '1'
                }
                value={productDraft[field]}
                onChange={(event) =>
                  setProductDraft((draft) => ({
                    ...draft,
                    [field]: event.target.value
                  }))
                }
                className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </label>
          ))}
          <label className="text-[10px] font-semibold text-slate-400 sm:col-span-2">
            Description
            <textarea
              rows="2"
              value={productDraft.description}
              onChange={(event) =>
                setProductDraft((draft) => ({
                  ...draft,
                  description: event.target.value
                }))
              }
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-[10px] font-semibold text-slate-400 sm:col-span-2">
            Product image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#142958] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              Save product
            </button>
            <button
              type="button"
              onClick={closeProductForm}
              className="rounded-lg border border-[#142958] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-[#142958] transition-colors"
            >
              Close
            </button>
          </div>
        </form>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="p-3 sm:p-4 rounded-2xl bg-[#07132c] border border-[#142958] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 hover:border-blue-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={product.image}
                alt={product.title}
                className="w-12 h-12 rounded-xl object-contain bg-white p-1 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {product.title}
                  </h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${product.stockBadgeClass}`}
                  >
                    {product.stockBadgeLabel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  SKU: {product.sku || product.id} · Cat: {product.category}
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1">
                  {product.formattedPrice}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-[#142958] pt-2 sm:pt-0">
              <div className="flex items-center gap-1.5 bg-[#0b1b3d] px-2.5 py-1 rounded-xl border border-[#142958]">
                <button
                  type="button"
                  onClick={() => handleStockAdjust(product.id, -1)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#07132c] text-slate-300 hover:text-white"
                >
                  <Minus size={11} />
                </button>
                <span className="font-mono font-bold text-xs text-white px-2">
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => handleStockAdjust(product.id, 1)}
                  className="w-5 h-5 rounded flex items-center justify-center bg-[#07132c] text-slate-300 hover:text-white"
                >
                  <Plus size={11} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => startProductEdit(product)}
                className="px-2.5 py-1.5 rounded-xl border border-[#142958] text-[10px] font-bold text-slate-300 hover:bg-[#142958] hover:text-white transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
