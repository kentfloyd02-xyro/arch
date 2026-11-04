import { request } from './client';

export const orderService = {
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shop/orders${query ? `?${query}` : ''}`);
  },

  getOrder: (orderNumber) =>
    request(`/shop/orders/${orderNumber}`),

  trackOrder: (identifier) =>
    request(`/shop/orders/track/${identifier}`),

  createOrder: (orderData) =>
    request('/shop/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),

  updateOrderStatus: (orderNumber, newStatus, performedBy = null) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, notes: performedBy ? `Updated by ${performedBy}` : undefined })
    }),

  cancelOrder: (orderNumber, reason) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled', notes: reason })
    })
};

export default orderService;
