import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Star, AlertCircle, Trash2, CheckSquare, Menu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function EmailList({ folder, selectedId, onSelect, onCountsChange, onOpenSidebar }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmails = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folder, limit: 50 });
      if (q) params.set('search', q);
      const res = await api.get(`/emails?${params}`);
      setEmails(res.data.emails);
      setTotal(res.data.total);
    } catch (err) {
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [folder]);

  useEffect(() => {
    fetchEmails('');
    setSearch('');
  }, [folder]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    const t = setTimeout(() => fetchEmails(q), 400);
    return () => clearTimeout(t);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmails(search);
    // Refresh counts
    try {
      const res = await api.get('/emails/counts');
      onCountsChange && onCountsChange(res.data);
    } catch {}
  };

  const updateEmail = (id, changes) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
  };

  const quickStar = async (e, email) => {
    e.stopPropagation();
    await api.patch(`/emails/${email.id}`, { is_starred: !email.is_starred });
    updateEmail(email.id, { is_starred: !email.is_starred });
  };

  const quickTrash = async (e, email) => {
    e.stopPropagation();
    await api.patch(`/emails/${email.id}`, { folder: 'trash' });
    setEmails(prev => prev.filter(em => em.id !== email.id));
    toast.success('Moved to trash');
  };

  const FOLDER_TITLES = {
    inbox: 'Inbox', sent: 'Sent', starred: 'Starred', important: 'Important',
    drafts: 'Drafts', trash: 'Trash', spam: 'Spam', archive: 'Archive'
  };

  return (
    <div className="email-list-panel">
      <div className="panel-header">
        {onOpenSidebar && (
          <button className="mobile-menu-btn" onClick={onOpenSidebar} title="Menu">
            <Menu size={16} />
          </button>
        )}
        <span className="panel-title">{FOLDER_TITLES[folder] || folder}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total}</span>
        <button className="icon-btn" onClick={handleRefresh} title="Refresh" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={14} className={refreshing ? 'spinning' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="search-bar">
        <Search size={14} color="var(--text-muted)" />
        <input type="text" placeholder="Search emails..." value={search} onChange={handleSearch} />
        {search && <button className="icon-btn" onClick={() => { setSearch(''); fetchEmails(''); }} style={{ padding: 2 }}>✕</button>}
      </div>

      <div className="email-list">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-surface0)' }}>
              <div className="skeleton" style={{ height: 13, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 11, width: '40%' }} />
            </div>
          ))
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={48} className="empty-state-icon" />
            <p style={{ fontWeight: 500 }}>{search ? 'No results found' : 'No emails here'}</p>
            <p>{search ? 'Try different search terms' : 'This folder is empty'}</p>
          </div>
        ) : (
          emails.map(email => (
            <div key={email.id}
              className={`email-item ${!email.is_read ? 'unread' : ''} ${email.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelect(email)}
            >
              {!email.is_read && <div className="unread-dot" />}
              <div className="email-item-header">
                <div className="avatar" style={{ width: 26, height: 26, fontSize: 11, flexShrink: 0 }}>
                  {(email.from_name || email.from_address || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="email-from">{email.from_name || email.from_address}</span>
                <span className="email-time">
                  {email.sent_at || email.created_at
                    ? formatDistanceToNow(new Date(email.sent_at || email.created_at), { addSuffix: false })
                      .replace('about ', '').replace(' hours', 'h').replace(' hour', 'h')
                      .replace(' minutes', 'm').replace(' minute', 'm').replace(' days', 'd').replace(' day', 'd')
                    : ''}
                </span>
                <div className="email-item-actions" onClick={e => e.stopPropagation()}>
                  <button className={`icon-btn ${email.is_starred ? 'active-star' : ''}`} onClick={(e) => quickStar(e, email)} title="Star">
                    <Star size={13} fill={email.is_starred ? 'currentColor' : 'none'} />
                  </button>
                  <button className="icon-btn" onClick={(e) => quickTrash(e, email)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="email-subject">{email.subject}</div>
              <div className="email-preview">
                {email.body_plain || email.body?.replace(/<[^>]+>/g, '') || '(no preview)'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
