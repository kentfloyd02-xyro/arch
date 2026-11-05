import React from 'react';
import { useAdminSupportPageController } from '../../controllers/AdminSupportPageController';
import { MessageCircle, RefreshCw, X, Send } from 'lucide-react';

export default function AdminSupportPage() {
  const {
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
  } = useAdminSupportPageController();

  const visibleInquiries =
    supportStatusFilter === 'all'
      ? supportInquiries
      : supportInquiries.filter((inquiry) =>
          supportStatusFilter === 'open' ? inquiry.status !== 'closed' : inquiry.status === 'closed'
        );

  return (
    <section className="space-y-4 rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 shadow-lg sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#142958] pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <MessageCircle size={17} className="text-blue-300" />
            <span>Customer Help Desk &amp; Inquiries</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Open customer conversations to review chat history and respond in real-time.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSupportInquiries}
          className="inline-flex items-center gap-2 rounded-xl border border-[#142958] bg-[#07132c] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-[#10234a] transition-all"
        >
          <RefreshCw size={13} className={supportLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          ['open', 'Open tickets'],
          ['closed', 'Closed tickets'],
          ['all', 'All tickets']
        ].map(([filter, label]) => {
          const count =
            filter === 'all'
              ? supportInquiries.length
              : supportInquiries.filter((inquiry) =>
                  filter === 'open' ? inquiry.status !== 'closed' : inquiry.status === 'closed'
                ).length;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setSupportStatusFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all ${
                supportStatusFilter === filter
                  ? 'border-blue-400 bg-blue-600 text-white'
                  : 'border-[#142958] bg-[#07132c] text-slate-300 hover:border-slate-600'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Inquiries Cards Grid */}
      {visibleInquiries.length === 0 ? (
        <div className="rounded-xl border border-[#142958] bg-[#07132c] p-8 text-center text-xs text-slate-400">
          {supportLoading
            ? 'Loading tickets…'
            : supportStatusFilter === 'open'
            ? 'No open support tickets.'
            : 'No closed tickets.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleInquiries.map((inquiry) => {
            const inquiryId = inquiry._id || inquiry.id;
            const lastMessage =
              inquiry.messages?.length > 0
                ? inquiry.messages[inquiry.messages.length - 1].text
                : inquiry.question;
            const isClosed = inquiry.status === 'closed';

            return (
              <article
                key={inquiryId}
                className="rounded-xl border border-[#142958] bg-[#07132c] p-4 flex flex-col justify-between hover:border-blue-500/30 transition-all shadow-sm"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong className="text-sm text-white">
                        {inquiry.customerName || 'Customer'}
                      </strong>
                      <span className="ml-2 text-[10px] text-blue-300">
                        {inquiry.customerEmail || 'Guest inquiry'}
                      </span>
                      {inquiry.ticketNumber && (
                        <span className="ml-2 font-mono text-[9px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {inquiry.ticketNumber}
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        isClosed
                          ? 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {isClosed ? 'CLOSED TICKET' : 'OPEN TICKET'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-slate-300">
                    {lastMessage || inquiry.question}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#142958] pt-3">
                  <span className="text-[10px] text-slate-500">
                    {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => openSupportConversation(inquiry)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                  >
                    <MessageCircle size={13} />
                    <span>Open conversation</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Selected Conversation Modal */}
      {selectedSupportInquiry && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Customer support conversation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedSupportInquiry(null);
          }}
        >
          <section className="flex h-[94vh] max-h-[760px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#29416c] bg-[#0b1b3d] shadow-2xl">
            {/* Modal Header */}
            <header className="flex items-center justify-between gap-3 border-b border-[#142958] bg-[#07132c] p-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-white">
                  {selectedSupportInquiry.customerName || 'Customer conversation'}
                </h3>
                <p className="mt-1 truncate text-[10px] text-blue-300">
                  {selectedSupportInquiry.customerEmail || 'Guest inquiry'} ·{' '}
                  {selectedSupportInquiry.status === 'closed'
                    ? 'Closed ticket'
                    : 'Open ticket · active customer chat'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedSupportInquiry.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => closeSupportTicket(selectedSupportInquiry)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold text-rose-200 hover:bg-rose-500/20 transition-colors"
                  >
                    Close ticket
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSupportInquiry(null)}
                  className="rounded-lg border border-[#29416c] p-1.5 text-slate-300 hover:bg-white/5 transition-colors"
                  aria-label="Close conversation modal"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            {/* Messages Stream */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#08152f] p-4">
              {supportDetailLoading && (
                <p className="text-center text-xs text-slate-500">Loading conversation…</p>
              )}
              {(selectedSupportInquiry.messages?.length
                ? selectedSupportInquiry.messages
                : [
                    {
                      sender: 'user',
                      text: selectedSupportInquiry.question,
                      createdAt: selectedSupportInquiry.createdAt
                    },
                    ...(selectedSupportInquiry.reply
                      ? [
                          {
                            sender: 'admin',
                            text: selectedSupportInquiry.reply,
                            createdAt: selectedSupportInquiry.repliedAt
                          }
                        ]
                      : [])
                  ]
              ).map((message, index) => {
                const fromCustomer = message.sender === 'user';
                return (
                  <div
                    key={`${message.createdAt || 'msg'}-${index}`}
                    className={`flex ${fromCustomer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-3 ${
                        fromCustomer
                          ? 'rounded-tl-sm border border-[#29416c] bg-[#10234a] text-slate-100'
                          : message.sender === 'admin'
                          ? 'rounded-tr-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-50'
                          : 'rounded-tr-sm border border-blue-500/20 bg-blue-600/15 text-blue-50'
                      }`}
                    >
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        {fromCustomer
                          ? selectedSupportInquiry.customerName || 'Customer'
                          : message.sender === 'admin'
                          ? 'Admin support'
                          : 'AI support'}
                      </span>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">{message.text}</p>
                      <span className="mt-1.5 block text-right text-[9px] text-slate-500">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            {selectedSupportInquiry.status === 'closed' ? (
              <p className="border-t border-[#142958] bg-[#07132c] p-3 text-center text-[10px] text-slate-500">
                This ticket is closed. The customer must create a new ticket to continue.
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSupportReply(selectedSupportInquiry);
                }}
                className="flex flex-col gap-2 border-t border-[#142958] bg-[#07132c] p-3 sm:flex-row sm:p-4"
              >
                <textarea
                  value={
                    supportReplies[selectedSupportInquiry._id || selectedSupportInquiry.id] || ''
                  }
                  onChange={(event) =>
                    setSupportReplies((prev) => ({
                      ...prev,
                      [selectedSupportInquiry._id || selectedSupportInquiry.id]: event.target.value
                    }))
                  }
                  required
                  rows={2}
                  placeholder="Reply to this open ticket as Admin…"
                  className="min-w-0 flex-1 resize-y rounded-xl border border-[#142958] bg-[#0b1b3d] px-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 self-end rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  <Send size={13} />
                  <span>Send reply</span>
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
