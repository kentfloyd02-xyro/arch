import { request } from './client';

const STORAGE_KEY = 'archon_support_tickets_v1';

function getLocalTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTickets(tickets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('[Support Storage Error]:', err);
  }
}

// Default prepared AI knowledge base topics
const PREPARED_ANSWERS = {
  stock: 'Our catalog reflects real-time warehouse inventory directly from Cainta Central Plant. For bulk contractor allocations (>500 bags or 5,000 kg), logistics dispatch is scheduled directly with our operations team.',
  discount: 'You can use voucher code ARCHON20 for 20% OFF on eligible orders! In addition, an automatic 10% Contractor Volume Discount applies automatically to carts with 5 or more units.',
  delivery: 'Industrial freight is calculated at PHP 500 per 1,000 kg tier across Metro Manila and Rizal dispatch corridors. Apply voucher code FREESHIP at checkout to waive standard delivery fees!',
  return: 'Pending orders can be cancelled immediately from your Customer Portal with automatic stock restoration. Delivered materials can be returned within 7 days by submitting photos via the Request Return action.',
  specs: 'Archon Nell high-early strength mortars, non-shrink grouts, and admixtures comply with ASTM C150 & PNS standards. Technical Data Sheets (TDS) and Mill Test Certificates are available upon request.',
  payment: 'We support GCash with instant reference verification, Maya, Bank Transfer, Company Purchase Orders (PO) for corporate accounts, and Cash on Delivery (COD) for confirmed job sites.'
};

export const supportService = {
  answerPreparedSupportQuestion: async (topicId) => {
    try {
      return await request('/support/answer', {
        method: 'POST',
        body: JSON.stringify({ topicId })
      });
    } catch {
      return {
        success: true,
        answer: PREPARED_ANSWERS[topicId] || 'Here is the current information for this topic.'
      };
    }
  },

  createSupportInquiry: async (data) => {
    try {
      return await request('/support/inquiries', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      // Local persistent fallback
      const tickets = getLocalTickets();
      const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const ticketNumber = 'TK-' + Math.floor(10000 + Math.random() * 90000);
      const guestAccessToken = 'guest_token_' + Math.random().toString(36).slice(2);

      const newTicket = {
        _id: ticketId,
        id: ticketId,
        ticketNumber,
        status: 'open',
        customerName: data.customerName || 'Customer',
        customerEmail: data.customerEmail || 'guest@archonnell.com',
        customerId: data.customerId || null,
        question: data.question || '',
        messages: Array.isArray(data.messages) ? data.messages : [
          { sender: 'user', text: data.question, createdAt: new Date().toISOString() }
        ],
        guestAccessToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tickets.unshift(newTicket);
      saveLocalTickets(tickets);
      return newTicket;
    }
  },

  getSupportInquiries: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request(`/support/inquiries${query ? `?${query}` : ''}`);
    } catch {
      const tickets = getLocalTickets();
      if (!params.status || params.status === 'all') {
        return tickets;
      }
      return tickets.filter((t) => (params.status === 'closed' ? t.status === 'closed' : t.status !== 'closed'));
    }
  },

  getSupportInquiry: async (id, guestAccessToken) => {
    try {
      return await request(`/support/inquiries/${encodeURIComponent(id)}`, {
        headers: guestAccessToken ? { 'X-Support-Access-Token': guestAccessToken } : {}
      });
    } catch {
      const tickets = getLocalTickets();
      const found = tickets.find((t) => (t._id || t.id) === id);
      if (!found) throw new Error('Ticket not found.');
      return found;
    }
  },

  addSupportMessage: async (id, text, guestAccessToken) => {
    try {
      return await request(`/support/inquiries/${encodeURIComponent(id)}/messages`, {
        method: 'POST',
        headers: guestAccessToken ? { 'X-Support-Access-Token': guestAccessToken } : {},
        body: JSON.stringify({ text })
      });
    } catch {
      const tickets = getLocalTickets();
      const ticketIndex = tickets.findIndex((t) => (t._id || t.id) === id);
      if (ticketIndex === -1) throw new Error('Ticket not found.');

      const newMsg = {
        _id: 'msg_' + Date.now(),
        sender: 'user',
        text,
        createdAt: new Date().toISOString()
      };

      if (!tickets[ticketIndex].messages) tickets[ticketIndex].messages = [];
      tickets[ticketIndex].messages.push(newMsg);
      tickets[ticketIndex].updatedAt = new Date().toISOString();
      saveLocalTickets(tickets);

      return { success: true, message: newMsg };
    }
  },

  replyToSupportInquiry: async (id, reply) => {
    try {
      return await request(`/support/inquiries/${encodeURIComponent(id)}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply })
      });
    } catch {
      const tickets = getLocalTickets();
      const ticketIndex = tickets.findIndex((t) => (t._id || t.id) === id);
      if (ticketIndex === -1) throw new Error('Ticket not found.');

      const newMsg = {
        _id: 'msg_' + Date.now(),
        sender: 'admin',
        text: reply,
        createdAt: new Date().toISOString()
      };

      if (!tickets[ticketIndex].messages) tickets[ticketIndex].messages = [];
      tickets[ticketIndex].messages.push(newMsg);
      tickets[ticketIndex].reply = reply;
      tickets[ticketIndex].repliedAt = new Date().toISOString();
      tickets[ticketIndex].updatedAt = new Date().toISOString();
      saveLocalTickets(tickets);

      return { success: true, ticket: tickets[ticketIndex] };
    }
  },

  closeSupportInquiry: async (id) => {
    try {
      return await request(`/support/inquiries/${encodeURIComponent(id)}/close`, {
        method: 'POST'
      });
    } catch {
      const tickets = getLocalTickets();
      const ticketIndex = tickets.findIndex((t) => (t._id || t.id) === id);
      if (ticketIndex === -1) throw new Error('Ticket not found.');

      tickets[ticketIndex].status = 'closed';
      tickets[ticketIndex].updatedAt = new Date().toISOString();
      saveLocalTickets(tickets);

      return tickets[ticketIndex];
    }
  }
};
