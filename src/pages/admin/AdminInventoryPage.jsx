import React from 'react';
import { useAdminInventoryPageController } from '../../controllers/AdminInventoryPageController';
import {
  Package,
  Search,
  X,
  Plus,
  Minus,
  Archive,
  ArchiveRestore,
  Trash2,
  Undo2,
  AlertCircle,
  FolderArchive,
  Layers
} from 'lucide-react';

export default function AdminInventoryPage() {
  const {
    productSearch,
    setProductSearch,
    inventoryTab,
    setInventoryTab,
    activeCount,
    archivedCount,
    trashCount,
    allCount,
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
    handleArchiveProduct,
    handleDeleteProduct,
    handleRestoreProduct,
    handlePermanentDeleteProduct,
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

      {/* Inventory Status Navigation & Add Product */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#07132c] rounded-2xl border border-[#142958] w-fit">
          <button
            type="button"
            onClick={() => setInventoryTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryTab === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#142958]/50'
            }`}
          >
            <Layers size={13} />
            <span>Active Products</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              inventoryTab === 'active' ? 'bg-blue-700 text-white' : 'bg-[#142958] text-slate-300'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryTab('archived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryTab === 'archived'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#142958]/50'
            }`}
          >
            <Archive size={13} />
            <span>Archived</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              inventoryTab === 'archived' ? 'bg-purple-700 text-white' : 'bg-[#142958] text-slate-300'
            }`}>
              {archivedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryTab('trash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryTab === 'trash'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#142958]/50'
            }`}
          >
            <Trash2 size={13} />
            <span>Trash / Deleted</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              inventoryTab === 'trash' ? 'bg-rose-700 text-white' : 'bg-[#142958] text-slate-300'
            }`}>
              {trashCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              inventoryTab === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#142958]/50'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              inventoryTab === 'all' ? 'bg-slate-800 text-white' : 'bg-[#142958] text-slate-300'
            }`}>
              {allCount}
            </span>
          </button>
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={openNewProductForm}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Informative Notice Banners for Archived & Trash Tabs */}
      {inventoryTab === 'archived' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs text-purple-200">
          <FolderArchive className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Archived Products:</strong> These products are preserved in inventory but hidden from customers on the landing page storefront. Click <strong>Unarchive</strong> on any item to restore it to the store catalog.
          </span>
        </div>
      )}

      {inventoryTab === 'trash' && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-200">
          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Trash &amp; Deleted Products:</strong> These items were removed from the catalog. You can click <strong>Restore</strong> to bring them back to active inventory, or <strong>Delete Forever</strong> to permanently remove them.
          </span>
        </div>
      )}

      {/* Product Form Modal / Section */}
      {isProductFormOpen && (
        <form
          onSubmit={handleProductSubmit}
          className="grid grid-cols-1 gap-3.5 rounded-2xl border border-[#142958] bg-[#07132c] p-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 flex items-center justify-between pb-2 border-b border-[#142958]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package size={16} className="text-blue-400" />
              <span>{editingProductId ? 'Edit Product Specifications' : 'Add New Industrial Product to Catalog'}</span>
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              * All fields are strictly required
            </span>
          </div>

          {/* Product Name */}
          <label className="text-[10px] font-semibold text-slate-400">
            Product name *
            <input
              required
              minLength={3}
              type="text"
              placeholder="e.g. High-Strength Self-Leveling Mortar 25kg"
              value={productDraft.title}
              onChange={(e) => setProductDraft(draft => ({ ...draft, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
            />
          </label>

          {/* SKU - Auto-Generated & Read-Only */}
          <label className="text-[10px] font-semibold text-slate-400">
            SKU (Auto-Generated) *
            <input
              required
              readOnly
              type="text"
              value={productDraft.sku}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#091530] px-3 py-2 text-xs text-slate-300 font-mono outline-none cursor-not-allowed select-all"
              title="SKU is automatically generated by Archon Nell inventory system"
            />
          </label>

          {/* Category - Select Dropdown */}
          <label className="text-[10px] font-semibold text-slate-400">
            Category *
            <select
              required
              value={productDraft.category}
              onChange={(e) => setProductDraft(draft => ({ ...draft, category: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>-- Select Industrial Category --</option>
              <option value="Self-Leveling Mortar">Self-Leveling Mortar</option>
              <option value="Structural Epoxy">Structural Epoxy</option>
              <option value="Admixtures & Plasticizers">Admixtures &amp; Plasticizers</option>
              <option value="Waterproofing Membranes">Waterproofing Membranes</option>
              <option value="Surface Treatments & Sealants">Surface Treatments &amp; Sealants</option>
              <option value="Concrete Repair & Grouts">Concrete Repair &amp; Grouts</option>
            </select>
          </label>

          {/* Price (PHP) */}
          <label className="text-[10px] font-semibold text-slate-400">
            Price (PHP) *
            <input
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 1850.00"
              value={productDraft.price}
              onChange={(e) => setProductDraft(draft => ({ ...draft, price: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
            />
          </label>

          {/* Stock Count - Min 20, Max 5000 */}
          <label className="text-[10px] font-semibold text-slate-400">
            Stock count * (Min: 20, Max: 5,000)
            <input
              required
              type="number"
              min="20"
              max="5000"
              step="1"
              placeholder="e.g. 100"
              value={productDraft.stock}
              onChange={(e) => setProductDraft(draft => ({ ...draft, stock: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
            />
          </label>

          {/* Shipping Weight */}
          <label className="text-[10px] font-semibold text-slate-400">
            Shipping weight per unit (kg) *
            <input
              required
              type="number"
              min="0.5"
              max="2000"
              step="0.1"
              placeholder="e.g. 25.0"
              value={productDraft.shippingWeightKg}
              onChange={(e) => setProductDraft(draft => ({ ...draft, shippingWeightKg: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
            />
          </label>

          {/* Description */}
          <label className="text-[10px] font-semibold text-slate-400 sm:col-span-2">
            Description * (Min 10 characters)
            <textarea
              required
              minLength={10}
              rows="3"
              placeholder="Comprehensive material formulation, technical application, mixing guidelines, and compressive performance ratings..."
              value={productDraft.description}
              onChange={(e) => setProductDraft(draft => ({ ...draft, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[#142958] bg-[#0b1b3d] px-3 py-2 text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
            />
          </label>

          {/* Product Image */}
          <label className="text-[10px] font-semibold text-slate-400 sm:col-span-2">
            Product image
            <input
              required
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#142958] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white cursor-pointer"
            />
          </label>

          {/* Actions */}
          <div className="flex gap-2 sm:col-span-2 pt-2 border-t border-[#142958]">
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
            >
              Save Product
            </button>
            <button
              type="button"
              onClick={closeProductForm}
              className="rounded-lg border border-[#142958] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#142958] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </form>
      )}

      {/* Products Grid / List */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
          <Package className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          {inventoryTab === 'archived'
            ? 'No archived products. When you click "Archive" on an active product, it will appear here.'
            : inventoryTab === 'trash'
            ? 'Trash is empty. Deleted items will be preserved here so you can restore or permanently erase them.'
            : 'No products match your search or filter criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`p-3 sm:p-4 rounded-2xl bg-[#07132c] border space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 transition-all shadow-sm ${
                product.isDeleted
                  ? 'border-rose-500/30 bg-rose-950/10'
                  : product.isActive === false
                  ? 'border-purple-500/30 bg-purple-950/10'
                  : 'border-[#142958] hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {product.title}
                    </h4>
                    {!product.isDeleted && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${product.stockBadgeClass}`}
                      >
                        {product.stockBadgeLabel}
                      </span>
                    )}
                    {product.isActive === false && !product.isDeleted && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-purple-500/20 text-purple-300 border-purple-500/30">
                        Archived
                      </span>
                    )}
                    {product.isDeleted && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-rose-500/20 text-rose-300 border-rose-500/30">
                        In Trash
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    SKU: {product.sku || product.id} · Cat: {product.category}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-emerald-400">
                      {product.formattedPrice}
                    </span>
                    {product.isDeleted && product.deletedAt && (
                      <span className="text-[10px] text-rose-300/80 font-mono">
                        · Deleted: {new Date(product.deletedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-[#142958] pt-2 sm:pt-0">
                {product.isDeleted ? (
                  /* Deleted / Trash Actions */
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestoreProduct(product.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Restore product back to active catalog"
                    >
                      <Undo2 size={12} />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDeleteProduct(product.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-600 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Permanently remove from database"
                    >
                      <Trash2 size={12} />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                ) : (
                  /* Active / Archived Actions */
                  <>
                    <div className="flex items-center gap-1.5 bg-[#0b1b3d] px-2 py-1 rounded-xl border border-[#142958]">
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(product.id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-[#07132c] text-slate-300 hover:text-white cursor-pointer"
                        title="Decrease stock by 1"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono font-bold text-xs text-white px-1.5">
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(product.id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center bg-[#07132c] text-slate-300 hover:text-white cursor-pointer"
                        title="Increase stock by 1"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => startProductEdit(product)}
                      className="px-2.5 py-1 rounded-xl border border-[#142958] text-[10px] font-bold text-slate-300 hover:bg-[#142958] hover:text-white transition-colors cursor-pointer"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchiveProduct(product.id)}
                      className={`px-2 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                        product.isActive === false
                          ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                          : 'border-[#142958] text-slate-300 hover:bg-[#142958] hover:text-white'
                      }`}
                      title={product.isActive === false ? 'Unarchive and restore to store' : 'Archive from customer view'}
                    >
                      {product.isActive === false ? <ArchiveRestore size={11} /> : <Archive size={11} />}
                      <span>{product.isActive === false ? 'Unarchive' : 'Archive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-2 py-1 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Move product to trash"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
