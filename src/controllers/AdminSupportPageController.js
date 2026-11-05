import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function useAdminSupportPageController() {
  const { showToast } = useApp();
  const [supportInquiries, setSupportInquiries] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportReplies, setSupportReplies] = useState({});
  const [selectedSupportInquiry, setSelectedSupportInquiry] = useState(null);
  const [supportStatusFilter, setSupportStatusFilter] = useState('open');
  const [supportDetailLoading, setSupportDetailLoading] = useState(false);

  const fetchSupportInquiries = useCallback(() => {
    setSupportLoading(true);
    Promise.all([
      api.getSupportInquiries({ status: 'open' }),
      api.getSupportInquiries({ status: 'closed' })
    ])
      .then(([open, closed]) => {
        const combined = [
          ...(Array.isArray(open) ? open : []),
          ...(Array.isArray(closed) ? closed : [])
        ];
        combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setSupportInquiries(combined);
      })
      .catch((err) => console.warn('[Support inquiries fetch]:', err.message))
      .finally(() => setSupportLoading(false));
  }, []);

  const openSupportConversation = async (inquiry) => {
    const id = inquiry._id || inquiry.id;
    setSelectedSupportInquiry(inquiry);
    setSupportDetailLoading(true);
    try {
      const detail = await api.getSupportInquiry(id);
      setSelectedSupportInquiry(detail);
    } catch (error) {
      if (showToast) showToast(error.message || 'Could not load conversation details.', 'error');
    } finally {
      setSupportDetailLoading(false);
    }
  };

  const submitSupportReply = async (inquiry) => {
    const id = inquiry._id || inquiry.id;
    const reply = (supportReplies[id] || '').trim();
    if (!reply) return;

    try {
      await api.replyToSupportInquiry(id, reply);
      setSupportReplies((prev) => ({ ...prev, [id]: '' }));
      if (showToast) showToast('Reply sent to the customer.', 'success');
      await openSupportConversation(inquiry);
      fetchSupportInquiries();
    } catch (error) {
      if (showToast) showToast(error.message || 'Could not send support reply.', 'error');
    }
  };

  const closeSupportTicket = async (inquiry) => {
    const id = inquiry._id || inquiry.id;
    try {
      const updated = await api.closeSupportInquiry(id);
      setSelectedSupportInquiry(updated);
      if (showToast) showToast('Support ticket closed.', 'success');
      fetchSupportInquiries();
    } catch (error) {
      if (showToast) showToast(error.message || 'Could not close support ticket.', 'error');
    }
  };

  useEffect(() => {
    fetchSupportInquiries();
  }, [fetchSupportInquiries]);

  return {
    supportInquiries,
    supportLoading,
    supportReplies,
    setSupportReplies,
    selectedSupportInquiry,
    setSelectedSupportInquiry,
    supportStatusFilter,
    setSupportStatusFilter,
    supportDetailLoading,
    fetchSupportInquiries,
    openSupportConversation,
    submitSupportReply,
    closeSupportTicket
  };
}

export default useAdminSupportPageController;
