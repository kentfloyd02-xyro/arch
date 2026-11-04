import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useAdminInventoryPageController() {
  const { products, setProducts, showToast } = useApp();

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

  const handleStockAdjust = (productId, delta) => {
    const target = products.find((p) => p.id === productId);
    if (!target) {
      showToast('Product not found in inventory.', 'error');
      return;
    }

    if (target.stock + delta < 0) {
      showToast('Safety stock validation: Inventory level cannot drop below zero.', 'warning');
      return;
    }

    const updated = products.map((p) => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });
    setProducts(updated);
    showToast(
      `Warehouse stock level adjusted (${delta > 0 ? `+${delta}` : delta}).`,
      'info'
    );
  };

  const handleProductSubmit = (event) => {
    event.preventDefault();

    // Validation checks
    const trimmedTitle = (productDraft.title || '').trim();
    if (trimmedTitle.length < 3) {
      showToast('Validation Error: Product title must be at least 3 characters.', 'warning');
      return;
    }

    if (!productDraft.category || productDraft.category.trim() === '') {
      showToast('Validation Error: Please select a valid product category.', 'warning');
      return;
    }

    const priceNum = Number(productDraft.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('Validation Error: Product price must be a valid positive number.', 'warning');
      return;
    }

    const stockNum = Number(productDraft.stock);
    if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      showToast('Validation Error: Stock quantity must be a non-negative whole number.', 'warning');
      return;
    }

    const productData = {
      ...productDraft,
      title: trimmedTitle,
      price: priceNum,
      stock: stockNum,
      shippingWeightKg: Number(productDraft.shippingWeightKg) || 0,
      sold: products.find((product) => product.id === editingProductId)?.sold || 0
    };
    if (editingProductId) {
      setProducts(
        products.map((product) =>
          product.id === editingProductId ? { ...product, ...productData } : product
        )
      );
      showToast('Product details updated in the catalog.', 'success');
    } else {
      setProducts([
        {
          ...productData,
          id: `prod-${Date.now()}`,
          image:
            productData.image ||
            '/assets/images/leveling_mortar_1785519746126.png'
        },
        ...products
      ]);
      showToast('Product added to the catalog.', 'success');
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
      category: product.category || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      shippingWeightKg: product.shippingWeightKg ?? '',
      description: product.description || '',
      image: product.image || ''
    });
    setIsProductFormOpen(true);
  };

  const openNewProductForm = () => {
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
    setIsProductFormOpen((prev) => !prev);
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
    filteredProducts
  };
}

export default useAdminInventoryPageController;
