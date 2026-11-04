import { request } from './client';

export const productService = {
  getCategories: () =>
    request('/shop/categories').catch(() => []),

  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shop/products${query ? `?${query}` : ''}`);
  },

  getProduct: (id) =>
    request(`/shop/products/${id}`),

  updateStock: (id, delta) =>
    request(`/shop/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ stockDelta: delta })
    }),

  createProduct: (data) =>
    request('/shop/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (id, data) =>
    request(`/shop/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteProduct: (id) =>
    request(`/shop/products/${id}`, {
      method: 'DELETE'
    })
};

export default productService;
