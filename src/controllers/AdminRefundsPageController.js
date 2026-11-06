import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useAdminRefundsPageController() {
  const { orders, approveRefund, rejectRefund, showToast } = useApp();
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('Damage evidence does not show manufacturing defect');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refundOrders = orders
    .filter((o) => {
      const s = String(o.status || o.deliveryStatus || '').toUpperCase();
      const rStatus = String(o.refundDetails?.refundStatus || '').toUpperCase();
      return (
        s === 'REFUND_REQUESTED' ||
        s === 'REFUNDED' ||
        s === 'REFUND_REJECTED' ||
        rStatus === 'REJECTED' ||
        rStatus === 'PENDING_REVIEW' ||
        rStatus === 'APPROVED'
      );
    })
    .map((order) => {
      const s = String(order.status || order.deliveryStatus || '').toUpperCase();
      const details = order.refundDetails || {};
      const rStatus = String(details.refundStatus || '').toUpperCase();

      const isApproved = s === 'REFUNDED' || rStatus === 'APPROVED';
      const isRejected = s === 'REFUND_REJECTED' || rStatus === 'REJECTED';
      const isPending = !isApproved && !isRejected;

      let statusBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      let statusLabel = 'Review Pending';

      if (isApproved) {
        statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        statusLabel = 'Refund Approved';
      } else if (isRejected) {
        statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        statusLabel = 'Claim Rejected';
      }

      return {
        ...order,
        isApproved,
        isRejected,
        isPending,
        statusBadgeClass,
        statusLabel,
        reason: details.reason || 'Damaged packaging',
        detailsText: details.details || '',
        damagePhoto: details.damagePhoto || null,
        rejectedReason: details.rejectedReason || 'Claim does not meet return policy criteria',
        rejectedAt: details.rejectedAt || null,
        formattedTotal: `PHP ${Number(order.totalAmount || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      };
    });

  const handleApproveRefund = (orderNumber) => {
    approveRefund(orderNumber, true);
  };

  const openRejectModal = (order) => {
    setRejectModalOrder(order);
    setRejectReason('Damage evidence does not show manufacturing defect');
    setCustomReason('');
  };

  const closeRejectModal = () => {
    setRejectModalOrder(null);
    setCustomReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalOrder) return;
    const finalReason =
      rejectReason === 'Other (Please specify)'
        ? customReason.trim() || 'Claim did not satisfy validation standards.'
        : rejectReason;

    setIsSubmitting(true);
    try {
      await rejectRefund(rejectModalOrder.orderNumber, finalReason);
      closeRejectModal();
    } catch (err) {
      showToast('Failed to reject claim. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    refundOrders,
    handleApproveRefund,
    rejectModalOrder,
    rejectReason,
    setRejectReason,
    customReason,
    setCustomReason,
    openRejectModal,
    closeRejectModal,
    handleConfirmReject,
    isSubmitting
  };
}

export default useAdminRefundsPageController;
