import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function useAdminSupportPageController() {
  const { showToast } = useApp();
  const [supportInquiries, setSupportInquiries] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportReplies, setSupportReplies] = useState({});
  const [selectedSupportInquiry, setSelectedSupportInquiry] = useState(null);
  const [supportStatusFilter, setSupportStatusFilter] = useState('all');
  const [supportDetailLoading, setSupportDetailLoading] = useState(false);
  const selectedInquiryRef = useRef(null);

  useEffect(() => {
    selectedInquiryRef.current = selectedSupportInquiry;
  }, [selectedSupportInquiry]);

  const mergeLocalAndRemoteTickets = (serverTickets) => {
    let localTickets = [];
    try {
      const raw = localStorage.getItem('archon_support_tickets_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localTickets = parsed;
      }
    } catch {}

    const map = new Map();
    // Load local tickets first
    localTickets.forEach((t) => {
      const key = t.ticketNumber || t._id || t.id;
      if (key) map.set(key, t);
    });

    // Merge server tickets with local tickets
    (Array.isArray(serverTickets) ? serverTickets : []).forEach((st) => {
      const key = st.ticketNumber || st._id || st.id;
      if (key) {
        const existing = map.get(key);
        if (existing) {
          const existingMsgs = Array.isArray(existing.messages) ? existing.messages : [];
          const serverMsgs = Array.isArray(st.messages) ? st.messages : [];
          const msgMap = new Map();
          existingMsgs.forEach((m) => {
            const mKey = m._id || m.id || `${m.sender}-${m.text}-${m.createdAt}`;
            msgMap.set(mKey, m);
          });
          serverMsgs.forEach((m) => {
            const mKey = m._id || m.id || `${m.sender}-${m.text}-${m.createdAt}`;
            msgMap.set(mKey, m);
          });
          const mergedMessages = Array.from(msgMap.values());
          mergedMessages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

          map.set(key, {
            ...existing,
            ...st,
            messages: mergedMessages
          });
        } else {
          map.set(key, st);
        }
      }
    });

    const combined = Array.from(map.values());
    combined.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return combined;
  };

  const fetchSupportInquiries = useCallback((isBackground = false) => {
    if (!isBackground) setSupportLoading(true);
    Promise.all([
      api.getSupportInquiries({ status: 'open' }),
      api.getSupportInquiries({ status: 'closed' })
    ])
      .then(([open, closed]) => {
        const serverCombined = [
          ...(Array.isArray(open) ? open : []),
          ...(Array.isArray(closed) ? closed : [])
        ];
        const combined = mergeLocalAndRemoteTickets(serverCombined);
        setSupportInquiries(combined);

        // Keep selected ticket updated if open
        const cur = selectedInquiryRef.current;
        if (cur) {
          const curId = cur._id || cur.id || cur.ticketNumber;
          const updated = combined.find((t) => (t._id || t.id) === curId || t.ticketNumber === curId);
          if (updated && updated.updatedAt !== cur.updatedAt) {
            setSelectedSupportInquiry(updated);
          }
        }
      })
      .catch((err) => {
        console.warn('[Support inquiries fetch]:', err.message);
        const combined = mergeLocalAndRemoteTickets([]);
        if (combined.length > 0) {
          setSupportInquiries(combined);
        }
      })
      .finally(() => {
        if (!isBackground) setSupportLoading(false);
      });
  }, []);

  const openSupportConversation = async (inquiry) => {
    const id = inquiry._id || inquiry.id;
    setSelectedSupportInquiry(inquiry);
    setSupportDetailLoading(true);
    try {
      const detail = await api.getSupportInquiry(id);
      setSelectedSupportInquiry(detail);
    } catch (error) {
      console.warn('[Support conversation open error]:', error.message);
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

      // Update local storage backup if ticket exists locally
      try {
        const raw = localStorage.getItem('archon_support_tickets_v1');
        if (raw) {
          const tickets = JSON.parse(raw);
          const idx = tickets.findIndex((t) => (t._id || t.id) === id || t.ticketNumber === id);
          if (idx !== -1) {
            if (!tickets[idx].messages) tickets[idx].messages = [];
            tickets[idx].messages.push({
              _id: 'msg_' + Date.now(),
              sender: 'admin',
              text: reply,
              createdAt: new Date().toISOString()
            });
            tickets[idx].reply = reply;
            tickets[idx].repliedAt = new Date().toISOString();
            tickets[idx].updatedAt = new Date().toISOString();
            localStorage.setItem('archon_support_tickets_v1', JSON.stringify(tickets));
          }
        }
      } catch {}

      api.logActivity(
        'support',
        'SUPPORT_TICKET_REPLIED',
        `Replied to ticket ${inquiry.ticketNumber || id}: "${reply.slice(0, 50)}${reply.length > 50 ? '...' : ''}"`,
        inquiry.ticketNumber || id
      );
      if (showToast) showToast('Reply sent to the customer.', 'success');
      await openSupportConversation(inquiry);
      fetchSupportInquiries(true);
    } catch (error) {
      if (showToast) showToast(error.message || 'Could not send support reply.', 'error');
    }
  };

  const closeSupportTicket = async (inquiry) => {
    const id = inquiry._id || inquiry.id;
    try {
      const updated = await api.closeSupportInquiry(id);
      setSelectedSupportInquiry(updated);

      try {
        const raw = localStorage.getItem('archon_support_tickets_v1');
        if (raw) {
          const tickets = JSON.parse(raw);
          const idx = tickets.findIndex((t) => (t._id || t.id) === id || t.ticketNumber === id);
          if (idx !== -1) {
            tickets[idx].status = 'closed';
            tickets[idx].updatedAt = new Date().toISOString();
            localStorage.setItem('archon_support_tickets_v1', JSON.stringify(tickets));
          }
        }
      } catch {}

      api.logActivity(
        'support',
        'SUPPORT_TICKET_CLOSED',
        `Closed support inquiry ${inquiry.ticketNumber || id} for ${inquiry.customerName || inquiry.customerEmail || 'Customer'}`,
        inquiry.ticketNumber || id
      );
      if (showToast) showToast('Support ticket closed.', 'success');
      fetchSupportInquiries(true);
    } catch (error) {
      if (showToast) showToast(error.message || 'Could not close support ticket.', 'error');
    }
  };

  useEffect(() => {
    fetchSupportInquiries();
    // Real-time polling every 5 seconds so admin sees incoming inquiries automatically
    const interval = setInterval(() => {
      fetchSupportInquiries(true);
    }, 5000);
    return () => clearInterval(interval);
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
