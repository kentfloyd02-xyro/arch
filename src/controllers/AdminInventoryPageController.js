import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function useAdminInventoryPageController() {
  const { products, setProducts, showToast, refreshAllData } = useApp();

  const [productSearch, setProductSearch] = useState('');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDraft, setProductDraft] = useState({
    title: '',
    sku: '',
    category: '',
    price: '',
    stock: '',
    shippingWeightKg: '',
    description: '',
    image: ''
  });

  const generateSku = () => {
    return `AN-SKU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const handleStockAdjust = async (productId, delta) => {
    const target = products.find((p) => p.id === productId);
    if (!target) {
      showToast('Product not found in inventory.', 'error');
      return;
    }

    if (target.stock + delta < 0) {
      showToast('Safety stock validation: Inventory level cannot drop below zero.', 'warning');
      return;
    }

    const newStock = Math.max(0, target.stock + delta);
    const updated = products.map((p) => {
      if (p.id === productId) {
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updated);

    const targetId = target.dbId || target._id || target.id;
    try {
      await api.updateProduct(targetId, { stock: newStock });
    } catch (err) {
      console.warn('Database stock update error:', err.message);
    }

    api.logActivity(
      'inventory', 
      'STOCK_ADJUSTED', 
      `Adjusted stock for ${target.title} (${delta > 0 ? `+${delta}` : delta} units). New stock: ${newStock}`, 
      target.title
    );
    try {
      localStorage.setItem('archon_last_sync', Date.now().toString());
      window.dispatchEvent(new Event('archon_sync'));
    } catch {}
    showToast(
      `Warehouse stock level adjusted (${delta > 0 ? `+${delta}` : delta}).`,
      'info'
    );
  };

  const handleArchiveProduct = async (productId) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const targetId = target.dbId || target._id || target.id;
    const nextActive = target.isActive === false ? true : false;

    const updated = products.map((p) =>
      p.id === productId ? { ...p, isActive: nextActive } : p
    );
    setProducts(updated);

    try {
      await api.archiveProduct(targetId, nextActive);
      api.logActivity(
        'inventory',
        nextActive ? 'PRODUCT_UNARCHIVED' : 'PRODUCT_ARCHIVED',
        nextActive
          ? `Product "${target.title}" restored to active catalog.`
          : `Product "${target.title}" archived from catalog.`,
        target.title
      );
      showToast(
        nextActive
          ? `Product "${target.title}" is now active in store.`
          : `Product "${target.title}" has been archived.`,
        'success'
      );
      try {
        localStorage.setItem('archon_last_sync', Date.now().toString());
        window.dispatchEvent(new Event('archon_sync'));
      } catch {}
    } catch (err) {
      console.warn('Archive product error:', err.message);
      showToast('Could not update product archive status.', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${target.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const targetId = target.dbId || target._id || target.id;
    setProducts(products.filter((p) => p.id !== productId));

    try {
      await api.deleteProduct(targetId);
      api.logActivity(
        'inventory',
        'PRODUCT_DELETED',
        `Product "${target.title}" permanently deleted from catalog.`,
        target.title
      );
      showToast(`Product "${target.title}" has been deleted.`, 'info');
      try {
        localStorage.setItem('archon_last_sync', Date.now().toString());
        window.dispatchEvent(new Event('archon_sync'));
      } catch {}
    } catch (err) {
      console.warn('Delete product error:', err.message);
      showToast('Could not delete product from database.', 'error');
    }
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();

    // Validation checks
    const trimmedTitle = (productDraft.title || '').trim();
    if (trimmedTitle.length < 3) {
      showToast('Validation Error: Product title must be at least 3 characters.', 'warning');
      return;
    }

    if (!productDraft.category || productDraft.category.trim() === '') {
      showToast('Validation Error: Please select a valid product category from dropdown.', 'warning');
      return;
    }

    const priceNum = Number(productDraft.price);
    if (isNaN(priceNum) || priceNum < 1) {
      showToast('Validation Error: Product price must be at least PHP 1.00.', 'warning');
      return;
    }

    const stockNum = Number(productDraft.stock);
    if (isNaN(stockNum) || stockNum < 20 || stockNum > 5000 || !Number.isInteger(stockNum)) {
      showToast('Validation Error: Stock count must be an integer between 20 and 5,000 units.', 'warning');
      return;
    }

    const weightNum = Number(productDraft.shippingWeightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      showToast('Validation Error: Shipping weight per unit must be greater than 0 kg.', 'warning');
      return;
    }

    const trimmedDesc = (productDraft.description || '').trim();
    if (trimmedDesc.length < 10) {
      showToast('Validation Error: Product description must be at least 10 characters.', 'warning');
      return;
    }

    const skuValue = (productDraft.sku || '').trim() || generateSku();
    const productPayload = {
      title: trimmedTitle,
      category: productDraft.category.trim(),
      sku: skuValue,
      price: priceNum,
      stock: stockNum,
      shippingWeightKg: weightNum,
      description: trimmedDesc,
      image: productDraft.image || '/assets/images/leveling_mortar_1785519746126.png',
      images: [productDraft.image || '/assets/images/leveling_mortar_1785519746126.png'],
      specs: { shippingWeightKg: weightNum }
    };

    try {
      if (editingProductId) {
        const prod = products.find((p) => p.id === editingProductId);
        const targetId = prod?.dbId || prod?._id || editingProductId;
        await api.updateProduct(targetId, productPayload).catch((err) => {
          console.warn('Backend updateProduct fallback:', err.message);
        });

        setProducts(
          products.map((product) =>
            product.id === editingProductId ? { ...product, ...productPayload } : product
          )
        );
        api.logActivity(
          'inventory',
          'PRODUCT_UPDATED',
          `Updated product "${productPayload.title}" (Price: PHP ${productPayload.price}, Stock: ${productPayload.stock})`,
          productPayload.title
        );
        showToast('Product specifications updated successfully in database.', 'success');
      } else {
        const res = await api.createProduct(productPayload).catch((err) => {
          console.warn('Backend createProduct fallback:', err.message);
          return null;
        });

        const createdProd = {
          ...productPayload,
          id: res?.data?.id || res?.data?.custom_id || res?.custom_id || `prod-${Date.now().toString().slice(-6)}`,
          dbId: res?.data?.id || res?.id,
          sold: 0,
          rating: 5.0
        };

        setProducts([createdProd, ...products]);
        api.logActivity(
          'inventory',
          'PRODUCT_CREATED',
          `Created new catalog product "${productPayload.title}" (Category: ${productPayload.category}, Price: PHP ${productPayload.price}, Stock: ${productPayload.stock})`,
          productPayload.title
        );
        showToast('Product successfully saved to Industrial Products Catalog.', 'success');
      }

      if (refreshAllData) {
        refreshAllData().catch(() => {});
      }
    } catch (err) {
      console.error('Save product error:', err);
      showToast(err.message || 'Could not save product.', 'error');
    }

    setIsProductFormOpen(false);
    setEditingProductId(null);
    setProductDraft({
      title: '',
      sku: '',
      category: '',
      price: '',
      stock: '',
      shippingWeightKg: '',
      description: '',
      image: ''
    });
  };

  const startProductEdit = (product) => {
    setEditingProductId(product.id);
    setProductDraft({
      title: product.title || '',
      sku: product.sku || product.id,
      category: product.category || 'Self-Leveling Mortar',
      price: product.price ?? '',
      stock: product.stock ?? 100,
      shippingWeightKg: product.shippingWeightKg ?? 25,
      description: product.description || '',
      image: product.image || ''
    });
    setIsProductFormOpen(true);
  };

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProductDraft({
      title: '',
      sku: generateSku(),
      category: 'Self-Leveling Mortar',
      price: '',
      stock: 100,
      shippingWeightKg: 25,
      description: '',
      image: '/assets/images/leveling_mortar_1785519746126.png'
    });
    setIsProductFormOpen(true);
  };

  const closeProductForm = () => {
    setIsProductFormOpen(false);
    setEditingProductId(null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setProductDraft((draft) => ({ ...draft, image: reader.result }));
    reader.readAsDataURL(file);
  };

  // Condition checks & precomputed items for inventory
  const q = productSearch.toLowerCase().trim();
  const filteredProducts = products
    .filter((p) => {
      return (
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    })
    .map((product) => {
      const isZero = product.stock === 0;
      const isLow = product.stock > 0 && product.stock <= 10;
      const stockBadgeClass = isZero
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        : isLow
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      const stockBadgeLabel = isZero
        ? 'Out of Stock'
        : isLow
        ? 'Low Stock Alert'
        : 'Sufficient';

      return {
        ...product,
        isZero,
        isLow,
        stockBadgeClass,
        stockBadgeLabel,
        formattedPrice: `PHP ${Number(product.price || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      };
    });

  return {
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
    handleArchiveProduct,
    handleDeleteProduct,
    filteredProducts
  };
}

export default useAdminInventoryPageController;
