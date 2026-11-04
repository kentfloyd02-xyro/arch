import { useApp } from '../context/AppContext';

export function useProductsSectionController() {
  const {
    products,
    addToCart,
    setIsCheckoutOpen,
    setSelectedProductForReview,
    setIsReviewsOpen,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    currentUser,
    setIsAuthOpen,
    showToast,
    isApiConnected,
    isApiLoading,
    refreshAllData
  } = useApp();

  // Dynamically derive categories from online products
  const onlineCategorySlugs = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const categories = [
    { id: 'all', label: 'All Products' },
    ...onlineCategorySlugs.map((slug) => ({
      id: slug,
      label: slug.charAt(0).toUpperCase() + slug.slice(1)
    }))
  ];

  // Filter products based on active category and user search query
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const query = (searchQuery || '').toLowerCase().trim();
    const matchesSearch =
      !query ||
      product.title.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (Array.isArray(product.specs) &&
        product.specs.some((spec) => spec.toLowerCase().includes(query)));

    return matchesCategory && matchesSearch;
  });

  const handleBuyNow = (product) => {
    if (!currentUser) {
      showToast(
        'Please sign in to your account first before using Buy Now.',
        'warning'
      );
      setIsAuthOpen(true);
      return;
    }
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setIsCheckoutOpen(true);
  };

  const handleOpenReviews = (product) => {
    setSelectedProductForReview(product);
    setIsReviewsOpen(true);
  };

  return {
    categories,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    currentUser,
    handleBuyNow,
    handleOpenReviews,
    addToCart,
    isApiConnected,
    isApiLoading,
    refreshAllData
  };
}

export default useProductsSectionController;
