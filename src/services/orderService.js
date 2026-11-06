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
      body: JSON.stringify({ 
        status: newStatus, 
        deliveryStatus: newStatus,
        notes: performedBy ? `Updated by ${typeof performedBy === 'object' ? performedBy.name : performedBy}` : undefined,
        performedBy 
      })
    }),

  cancelOrder: (orderNumber, reason, actor = null) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status: 'CANCELLED',
        deliveryStatus: 'CANCELLED',
        cancelReason: reason,
        notes: reason,
        performedBy: actor
      })
    }),

  requestRefund: (orderNumber, { reason, damagePhoto, details }) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'REFUND_REQUESTED',
        deliveryStatus: 'REFUND_REQUESTED',
        refundDetails: {
          reason,
          damagePhoto,
          details,
          requestedAt: new Date().toISOString(),
          refundStatus: 'PENDING_REVIEW'
        }
      })
    }),

  approveRefund: (orderNumber, restoreStock = true, actor = null) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'REFUNDED',
        deliveryStatus: 'REFUNDED',
        restoreStock,
        refundDetails: {
          refundStatus: 'APPROVED',
          approvedAt: new Date().toISOString()
        },
        performedBy: actor
      })
    }),

  rejectRefund: (orderNumber, rejectReason = 'Inspection criteria not met', actor = null) =>
    request(`/shop/orders/${orderNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'REFUND_REJECTED',
        deliveryStatus: 'REFUND_REJECTED',
        notes: rejectReason,
        refundDetails: {
          refundStatus: 'REJECTED',
          rejectedReason: rejectReason,
          rejectedAt: new Date().toISOString(),
          trialUsed: true
        },
        performedBy: actor
      })
    })
};

export default orderService;
