import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailViewer from '../components/EmailViewer';
import ComposeModal from '../components/ComposeModal';
import api from '../utils/api';

export default function MailboxPage() {
  const { folder = 'inbox', emailId } = useParams();
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardOf, setForwardOf] = useState(null);
  const [counts, setCounts] = useState({});
  const [listKey, setListKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get('/emails/counts');
      setCounts(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchCounts(); }, [folder]);

  useEffect(() => {
    // Keyboard shortcuts
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'c' || e.key === 'C') { setShowCompose(true); setReplyTo(null); setForwardOf(null); }
      if (e.key === 'Escape') { setShowCompose(false); setSelectedEmail(null); }
      if (e.key === 'r' && selectedEmail) { handleReply(selectedEmail); }
      if (e.key === 'f' && selectedEmail) { handleForward(selectedEmail); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedEmail]);

  const handleSelect = async (email) => {
    setSelectedEmail(email);
    setIsSidebarOpen(false);
    if (!email.is_read) {
      try {
        await api.patch(`/emails/${email.id}`, { is_read: true });
        setSelectedEmail(prev => prev ? { ...prev, is_read: true } : null);
        fetchCounts();
      } catch {}
    }
  };

  const handleCompose = () => {
    setReplyTo(null);
    setForwardOf(null);
    setShowCompose(true);
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  const handleReply = (email) => {
    setReplyTo(email);
    setForwardOf(null);
    setShowCompose(true);
  };

  const handleForward = (email) => {
    setForwardOf(email);
    setReplyTo(null);
    setShowCompose(true);
  };

  const handleDelete = (id) => {
    if (selectedEmail?.id === id) setSelectedEmail(null);
    setListKey(k => k + 1);
    fetchCounts();
  };

  const handleUpdate = (updated) => {
    setSelectedEmail(updated);
    setListKey(k => k + 1);
  };

  return (
    <div className="mailbox-layout">
      <Sidebar counts={counts} onCompose={handleCompose} isOpen={isSidebarOpen} onClose={closeSidebar} />

      <EmailList
        key={`${folder}-${listKey}`}
        folder={folder}
        selectedId={selectedEmail?.id}
        onSelect={handleSelect}
        onCountsChange={setCounts}
        onOpenSidebar={openSidebar}
      />

      <EmailViewer
        email={selectedEmail}
        onReply={handleReply}
        onForward={handleForward}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />

      {showCompose && (
        <ComposeModal
          onClose={() => { setShowCompose(false); setReplyTo(null); setForwardOf(null); setListKey(k => k + 1); fetchCounts(); }}
          replyTo={replyTo}
          forwardOf={forwardOf}
        />
      )}

      {/* Keyboard shortcut hint */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16,
        background: 'var(--bg-mantle)', border: '1px solid var(--bg-surface0)',
        borderRadius: 8, padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)',
        display: 'flex', gap: 12, zIndex: 50
      }}>
        <span><kbd style={{ fontFamily: 'monospace', background: 'var(--bg-surface0)', padding: '1px 5px', borderRadius: 3 }}>C</kbd> Compose</span>
        <span><kbd style={{ fontFamily: 'monospace', background: 'var(--bg-surface0)', padding: '1px 5px', borderRadius: 3 }}>R</kbd> Reply</span>
        <span><kbd style={{ fontFamily: 'monospace', background: 'var(--bg-surface0)', padding: '1px 5px', borderRadius: 3 }}>Esc</kbd> Close</span>
      </div>
    </div>
  );
}
