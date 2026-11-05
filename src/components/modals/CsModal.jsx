import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  X, 
  Headphones, 
  Send, 
  Bot, 
  User, 
  Package, 
  Tag, 
  Truck, 
  RotateCcw, 
  FileText, 
  CreditCard,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const QUICK_TOPICS = [
  {
    id: 'stock',
    label: 'Stock Availability',
    icon: Package,
    prompt: 'How is warehouse stock tracked and what is currently available?',
    reply: 'Here is the current catalog availability:'
  },
  {
    id: 'discount',
    label: 'Promos & Bulk Discounts',
    icon: Tag,
    prompt: 'What discount codes and bulk contractor promos are available?',
    reply: 'Current voucher codes and catalog promotions are:'
  },
  {
    id: 'delivery',
    label: 'Freight Delivery Rates',
    icon: Truck,
    prompt: 'How much is delivery and what are the freight shipping rates?',
    reply: 'Delivery fees are calculated from the current delivery settings at checkout. Available freight vouchers:'
  },
  {
    id: 'return',
    label: 'Returns & Cancellations',
    icon: RotateCcw,
    prompt: 'What is the policy for order cancellations and return requests?',
    reply: 'For a specific order, please contact support so the team can review its current status and applicable return options.'
  },
  {
    id: 'specs',
    label: 'Specs & Mix Design',
    icon: FileText,
    prompt: 'What specifications and mix standards do your products meet?',
    reply: 'Current product specifications are shown in each product listing. Tell us which product you need help with if you need a technical document.'
  },
  {
    id: 'payment',
    label: 'Payment Methods & Invoices',
    icon: CreditCard,
    prompt: 'What payment options and invoice terms are supported?',
    reply: 'Current payment methods and invoice options are shown during checkout. Contact support for account-specific payment questions.'
  }
];

export default function CsModal() {
  const { isCsOpen, setIsCsOpen, currentUser, products = [], orders = [] } = useApp();
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoaded, setVouchersLoaded] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Good day! Choose a prepared topic for an instant answer, or type a question to create a support ticket for the admin team.',
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeInquiryId, setActiveInquiryId] = useState(null);
  const [ticketClosed, setTicketClosed] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAccessToken, setGuestAccessToken] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isCsOpen) return;
    setVouchersLoaded(false);
    setErrorMsg('');
    api.getVouchers()
      .then(data => { 
        setVouchers(Array.isArray(data) ? data : []); 
        setVouchersLoaded(true); 
      })
      .catch(() => { 
        setVouchers([]); 
        setVouchersLoaded(false); 
      });
  }, [isCsOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isCsOpen) {
      scrollToBottom();
    }
  }, [messages, isCsOpen, isTyping]);

  useEffect(() => {
    if (!isCsOpen || !activeInquiryId) return undefined;
    const poll = async () => {
      try {
        const inquiry = await api.getSupportInquiry(activeInquiryId, guestAccessToken);
        setTicketClosed(inquiry?.status === 'closed');
        const storedMessages = Array.isArray(inquiry?.messages) ? inquiry.messages : [];
        setMessages(previous => {
          const next = [...previous];
          storedMessages.forEach(stored => {
            const id = stored._id ? String(stored._id) : null;
            if (id && next.some(message => message.supportMessageId === id)) return;
            const sender = stored.sender === 'admin' ? 'admin' : stored.sender === 'user' ? 'user' : 'bot';
            const pendingIndex = next.findIndex(message => !message.supportMessageId && message.sender === sender && message.text === stored.text);
            if (pendingIndex >= 0) {
              next[pendingIndex] = { ...next[pendingIndex], supportMessageId: id, createdAt: stored.createdAt || next[pendingIndex].createdAt };
              return;
            }
            next.push({
              sender,
              supportMessageId: id,
              text: stored.text,
              time: stored.createdAt ? new Date(stored.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              createdAt: stored.createdAt
            });
          });
          if (!storedMessages.length && inquiry?.reply && !next.some(message => message.sender === 'admin' && message.text === inquiry.reply)) {
            next.push({ 
              sender: 'admin', 
              text: inquiry.reply, 
              time: inquiry.repliedAt ? new Date(inquiry.repliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now', 
              createdAt: inquiry.repliedAt 
            });
          }
          return next;
        });
      } catch (error) {
        console.warn('Support reply check:', error.message);
      }
    };
    const timer = setInterval(poll, 6000);
    poll();
    return () => clearInterval(timer);
  }, [isCsOpen, activeInquiryId, guestAccessToken]);

  if (!isCsOpen) return null;

  const postReply = (replyText, sender = 'bot') => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 400);
  };

  const getTopicDetails = (topic) => {
    const money = value => `PHP ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (topic.id === 'stock') {
      const available = products.filter(product => product.isActive !== false && Number(product.stock ?? product.inventory ?? 0) > 0);
      return available.length ? `Current inventory:\n${available.map(product => `• ${product.title || product.name}: ${Number(product.stock ?? product.inventory)} in stock`).join('\n')}` : 'No in-stock products were returned by the current catalog.';
    }
    if (topic.id === 'discount') {
      if (!vouchersLoaded && vouchers.length === 0) {
        return 'I could not load the current voucher records. Please check promotions at checkout or contact support.';
      }
      const active = vouchers.filter(voucher => voucher.isActive !== false && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date()));
      if (!active.length) return 'No active vouchers are currently listed in the database.';
      return `Active database vouchers:\n${active.map(voucher => {
        const value = voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}% off` : voucher.discountType === 'FIXED_AMOUNT' ? `${money(voucher.discountValue)} off` : voucher.discountType === 'FREE_SHIPPING' ? 'Free freight delivery' : `${voucher.discountValue ?? ''}`;
        const minimum = Number(voucher.minSpend) > 0 ? ` (minimum spend ${money(voucher.minSpend)})` : '';
        return `• ${voucher.code}: ${value}${minimum}`;
      }).join('\n')}`;
    }
    if (topic.id === 'delivery') {
      const freeShipping = vouchers.some(voucher => voucher.code === 'FREESHIP' && voucher.isActive !== false && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date()));
      return `The store checkout currently estimates freight at PHP 500 per 1,000 kg tier, or part of a tier. ${freeShipping ? 'The active FREESHIP voucher waives this checkout fee when applied!' : 'Check checkout for the current fee for your cart and address.'} This is the store checkout estimate; ask support to confirm a project-specific freight quote.`;
    }
    if (topic.id === 'return') {
      const ownOrders = !currentUser?.email || currentUser.role === 'admin' 
        ? [] 
        : orders.filter(order => (order.customerEmail || '').toLowerCase() === currentUser.email.toLowerCase());
      const recent = ownOrders.slice(0, 5);
      const statusLine = recent.length ? `Your recent orders:\n${recent.map(order => `• ${order.orderNumber || order.id}: ${order.status || 'status unavailable'}`).join('\n')}\n` : 'No recent orders found for this account. ';
      return `${statusLine}Contact admin support to confirm your specific return eligibility and next steps.`;
    }
    if (topic.id === 'specs') {
      const listed = products.filter(product => product.isActive !== false);
      if (!listed.length) return 'No active product specifications were returned by the catalog.';
      return `Catalog details:\n${listed.slice(0, 8).map(product => {
        const specs = Array.isArray(product.specs) ? product.specs.filter(Boolean).join('; ') : '';
        const description = product.description || '';
        return `• ${product.title || product.name}: ${specs || description || 'No specification details recorded.'}`;
      }).join('\n')}`;
    }
    return 'Checkout currently displays GCash, Maya, Bank Transfer, Company Purchase Orders (PO), and Cash on Delivery (COD). Confirm which methods are available for your order and request invoice terms from admin support.';
  };

  const handleSelectTopic = (topic) => {
    if (isTyping || ticketClosed) return;
    setErrorMsg('');
    const userMsg = {
      sender: 'user',
      text: topic.prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    if (activeInquiryId && !ticketClosed) {
      setIsTyping(true);
      api.addSupportMessage(activeInquiryId, topic.prompt, guestAccessToken)
        .then(result => {
          const id = result.message?._id ? String(result.message._id) : null;
          if (id) setMessages(prev => prev.map(message => message.createdAt === userMsg.createdAt ? { ...message, supportMessageId: id } : message));
          postReply('Your message was added to this conversation for admin support.');
        })
        .catch(error => postReply(`I couldn't send that message: ${error.message}. Please try again.`))
        .finally(() => setIsTyping(false));
      return;
    }
    setIsTyping(true);
    api.answerPreparedSupportQuestion(topic.id)
      .then(result => {
        const answer = result.answer || 'I could not find a current answer for this topic.';
        const details = getTopicDetails(topic);
        postReply(`${answer}\n\n${details}`);
      })
      .catch(error => postReply(`Here is the information available from the store catalog:\n\n${getTopicDetails(topic)}`))
      .finally(() => setIsTyping(false));
  };

  const handleSend = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (isTyping || !inputText.trim()) return;

    if (!currentUser?.email && !guestEmail.trim()) {
      setErrorMsg('Please enter your email address so our support team can reach you with an answer.');
      return;
    }

    const question = inputText.trim();
    const userMsg = {
      sender: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    if (activeInquiryId) {
      api.addSupportMessage(activeInquiryId, question, guestAccessToken)
        .then(result => {
          const id = result.message?._id ? String(result.message._id) : null;
          if (id) setMessages(prev => prev.map(message => message.createdAt === userMsg.createdAt ? { ...message, supportMessageId: id } : message));
          postReply('Your message was added to this conversation for admin support.');
        })
        .catch(error => postReply(`I couldn't send your message: ${error.message}. Please try again.`))
        .finally(() => setIsTyping(false));
      return;
    }
    const conversation = [...messages.slice(1), userMsg].map(message => ({
      sender: message.sender === 'user' ? 'user' : 'bot',
      text: message.text,
      createdAt: message.createdAt || new Date().toISOString()
    }));

    const resolvedName = currentUser?.name || currentUser?.full_name || 'Customer';
    const resolvedEmail = currentUser?.email || guestEmail.trim();

    api.createSupportInquiry({ 
      question, 
      customerName: resolvedName, 
      customerEmail: resolvedEmail, 
      customerId: currentUser?._id || currentUser?.id || null, 
      messages: conversation 
    })
      .then(inquiry => {
        setActiveInquiryId(inquiry._id || inquiry.id);
        setTicketClosed(false);
        if (inquiry.guestAccessToken) setGuestAccessToken(inquiry.guestAccessToken);
        if (Array.isArray(inquiry.messages)) {
          setMessages(prev => {
            let transcriptIndex = 0;
            return prev.map((message, index) => {
              if (index === 0 || message.supportMessageId) return message;
              const stored = inquiry.messages[transcriptIndex++];
              return stored ? { ...message, supportMessageId: stored._id ? String(stored._id) : null, createdAt: stored.createdAt || message.createdAt } : message;
            });
          });
        }
        setMessages(prev => [...prev, {
          sender: 'bot', 
          text: `This question needs a support specialist. Your inquiry has been routed to the admin team${inquiry.ticketNumber ? ` (Ticket ${inquiry.ticketNumber})` : ''}. We will display their reply right here in this chat window.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      })
      .catch(error => setMessages(prev => [...prev, {
        sender: 'bot', 
        text: `I could not send your inquiry right now: ${error.message}. Please try again later.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]))
      .finally(() => setIsTyping(false));
  };

  const startNewSupportTicket = () => {
    setActiveInquiryId(null);
    setGuestAccessToken('');
    setTicketClosed(false);
    setInputText('');
    setErrorMsg('');
    setMessages([{
      sender: 'bot',
      text: 'Your previous ticket is closed. Type your new question below to create another ticket for admin support.',
      time: 'Just now'
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[620px] max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#0b1b3d] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Archon Nell Technical Support Desk</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Engineering &amp; Logistics Knowledge Base</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCsOpen(false)}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender !== 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 shadow-xs">
                  {m.sender === 'admin' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : m.sender === 'admin' ? 'bg-emerald-50 text-slate-800 border border-emerald-200 shadow-xs rounded-tl-none' : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
                }`}
              >
                {m.sender === 'admin' && <strong className="mb-1 block text-[10px] text-emerald-700">Admin Support Specialist</strong>}
                <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                <span className={`text-[9px] mt-1.5 block ${m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 justify-start items-center text-slate-400 text-xs py-1">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {ticketClosed ? (
          <div className="flex flex-col items-center gap-2 border-t border-slate-200 bg-slate-100 p-4 text-center">
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase text-slate-600">Ticket closed</span>
            <p className="text-[11px] text-slate-600">This conversation is closed. Start a new ticket if you need more assistance.</p>
            <button type="button" onClick={startNewSupportTicket} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors">Create a new support ticket</button>
          </div>
        ) : (
          <>
            {/* Quick Selection Topics Container (with scrollable overflow on small screens) */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{activeInquiryId ? 'Choose a topic to message admin in this ticket:' : 'Click a topic for instant answers:'}</span>
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{activeInquiryId ? 'Open ticket · same conversation' : 'Instant Answer'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[135px] overflow-y-auto pr-1">
                {QUICK_TOPICS.map(topic => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic)}
                      disabled={isTyping}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-400 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:text-blue-700 text-left transition-all shadow-xs active:scale-95"
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{topic.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="px-3 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Message Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 flex-shrink-0">
              {!currentUser?.email && (
                <input 
                  type="email" 
                  required 
                  value={guestEmail} 
                  onChange={event => {
                    setGuestEmail(event.target.value);
                    if (errorMsg) setErrorMsg('');
                  }} 
                  placeholder="Enter your email address so our team can reply..." 
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800" 
                />
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  disabled={isTyping}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={activeInquiryId ? 'Send a follow-up in this open ticket…' : 'Type a question to create an admin support ticket…'}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={isTyping}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{activeInquiryId ? 'Send' : 'Create ticket'}</span>
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
