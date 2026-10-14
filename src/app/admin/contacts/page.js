'use client';

import { useState } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Mail, Check, Eye, Trash2, Archive, MessageSquare } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export default function AdminContactsPage() {
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data, mutate, loading } = useSWRFetch(`/api/admin?type=contacts&page=${page}&archived=${archived}`);

  const handleToggleRead = async (contactId, isRead) => {
    await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateContact', contactId, data: { isRead: !isRead } }),
    });
    mutate();
    if (selectedMessage?._id === contactId) {
      setSelectedMessage(prev => prev ? { ...prev, isRead: !isRead } : null);
    }
  };

  const handleToggleArchive = async (contactId, isArchived) => {
    await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateContact', contactId, data: { isArchived: !isArchived } }),
    });
    mutate();
    if (selectedMessage?._id === contactId) {
      setSelectedMessage(null);
    }
  };

  const handleDeleteClick = (contactId) => {
    setDeleteConfirmId(contactId);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    const contactId = deleteConfirmId;
    setDeleteConfirmId(null);
    await fetch('/api/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteContact', contactId }),
    });
    mutate();
    if (selectedMessage?._id === contactId) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Administrative Contacts</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>Monitor incoming inbox messages and personal user inquiries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setArchived(false); setPage(1); setSelectedMessage(null); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: !archived ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)',
              color: !archived ? 'var(--color-brand)' : 'var(--color-text-tertiary)'
            }}>
            Active Inbox
          </button>
          <button onClick={() => { setArchived(true); setPage(1); setSelectedMessage(null); }}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: archived ? 'var(--color-brand-glow)' : 'var(--color-bg-tertiary)',
              color: archived ? 'var(--color-brand)' : 'var(--color-text-tertiary)'
            }}>
            Archived Messages
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Mail size={16} /> Messages ({data?.total || 0})
              </h2>
            </div>
            
            {loading && page === 1 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
            ) : data?.messages?.length === 0 ? (
              <div className="p-12 text-center text-sm space-y-2" style={{ color: 'var(--color-text-muted)' }}>
                <Mail size={32} className="mx-auto opacity-30 mb-2" />
                <p>No messages in this folder.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border-primary)' }}>
                {data?.messages?.map(msg => {
                  const isSelected = selectedMessage?._id === msg._id;
                  return (
                    <div key={msg._id} onClick={() => setSelectedMessage(msg)}
                      className={`p-4 flex flex-col gap-2 transition-all cursor-pointer hover:bg-[var(--color-bg-hover)] ${isSelected ? 'bg-[var(--color-bg-hover)]' : ''}`}
                      style={{ borderLeft: !msg.isRead ? '3px solid var(--color-brand)' : '3px solid transparent' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{msg.senderName}</span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(msg.createdAt)}</span>
                      </div>
                      <div className="text-xs font-bold truncate" style={{ color: msg.isRead ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                        {msg.subject || '(No Subject)'}
                      </div>
                      <div className="text-[11px] line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>
                        {msg.message}
                      </div>
                      <div className="text-[10px] flex items-center gap-1 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Sent to: <span className="font-semibold text-[var(--color-text-tertiary)]">@{msg.recipient?.username}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: page === i + 1 ? 'var(--color-brand)' : 'var(--color-bg-card)',
                    color: page === i + 1 ? 'white' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-primary)'
                  }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Details Sidebar Panel */}
        <div>
          {selectedMessage ? (
            <div className="rounded-xl p-5 space-y-4 shadow-lg sticky top-6 animate-fade-in"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
              <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border-primary)', paddingBottom: '12px' }}>
                <span className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--color-brand)' }}>Inquiry Details</span>
                <div className="flex gap-1">
                  <button onClick={() => handleToggleRead(selectedMessage._id, selectedMessage.isRead)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors" title={selectedMessage.isRead ? 'Mark Unread' : 'Mark Read'}>
                    <Check size={14} style={{ color: selectedMessage.isRead ? '#22c55e' : 'var(--color-text-muted)' }} />
                  </button>
                  <button onClick={() => handleToggleArchive(selectedMessage._id, selectedMessage.isArchived)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors" title={selectedMessage.isArchived ? 'Restore' : 'Archive'}>
                    <Archive size={14} style={{ color: selectedMessage.isArchived ? '#3b82f6' : 'var(--color-text-muted)' }} />
                  </button>
                  <button onClick={() => handleDeleteClick(selectedMessage._id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors" title="Delete Permanent">
                    <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>From: </span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedMessage.senderName}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Email: </span>
                  <a href={`mailto:${selectedMessage.senderEmail}`} className="hover:underline" style={{ color: 'var(--color-brand)' }}>{selectedMessage.senderEmail}</a>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Recipient User: </span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{selectedMessage.recipient?.name} (@{selectedMessage.recipient?.username})</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Date: </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Subject: {selectedMessage.subject || '(No Subject)'}
                </div>
                <div className="p-4 rounded-lg text-xs leading-relaxed overflow-y-auto max-h-60"
                  style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)' }}>
                  {selectedMessage.message}
                </div>
              </div>

              <a href={`mailto:${selectedMessage.senderEmail}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Inquiry')}`}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all text-white gradient-brand">
                <MessageSquare size={12} /> Reply via Mail
              </a>
            </div>
          ) : (
            <div className="rounded-xl p-8 text-center text-xs space-y-2"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-muted)' }}>
              <Eye size={24} className="mx-auto opacity-30 mb-1" />
              <p>Select a message from the inbox to display detailed inquiry information.</p>
            </div>
          )}
        </div>
      </div>
      {/* Custom Dialog Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
            <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
              Delete Message
            </h3>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete this message permanently? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
