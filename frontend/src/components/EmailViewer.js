import React, { useState, useEffect, useRef } from 'react';
import { Reply, Forward, Trash2, Star, AlertCircle, Archive, Share2, MoreVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';

const SHARE_OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366' },
  { id: 'telegram', label: 'Telegram', emoji: '✈️', color: '#0088cc' },
  { id: 'sms', label: 'SMS / iMessage', emoji: '📱', color: '#34c759' },
  { id: 'twitter', label: 'X (Twitter)', emoji: '🐦', color: '#1da1f2' },
  { id: 'copy', label: 'Copy to clipboard', emoji: '📋', color: '#6c7086' },
  { id: 'print', label: 'Print email', emoji: '🖨️', color: '#a6e3a1' },
];

export default function EmailViewer({ email, onReply, onForward, onDelete, onUpdate }) {
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShowShare(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!email) {
    return (
      <div className="email-view-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state">
          <div className="empty-state-icon"><Share2 size={64} /></div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Select an email to read</p>
          <p>Choose from your inbox or search for something</p>
        </div>
      </div>
    );
  }

  const shareEmail = (platform) => {
    const subject = email.subject;
    const body = `From: ${email.from_name || email.from_address}\nSubject: ${subject}\n\n${email.body_plain || email.body?.replace(/<[^>]+>/g, '') || ''}`;
    const encoded = encodeURIComponent(body);
    const subjectEncoded = encodeURIComponent(subject);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        toast.success('Opening WhatsApp...');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
        toast.success('Opening Telegram...');
        break;
      case 'sms':
        window.open(`sms:?body=${encoded}`, '_blank');
        toast.success('Opening SMS...');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(subject)}&via=mailwave`, '_blank');
        toast.success('Opening X (Twitter)...');
        break;
      case 'copy':
        navigator.clipboard.writeText(body);
        toast.success('Copied to clipboard!');
        break;
      case 'print':
        const win = window.open('', '_blank');
        win.document.write(`<html><body><h2>${subject}</h2><p><b>From:</b> ${email.from_address}</p><p><b>To:</b> ${email.to_address}</p><hr>${email.body || body}</body></html>`);
        win.print();
        break;
      default: break;
    }
    setShowShare(false);
  };

  const toggleStar = async () => {
    try {
      await api.patch(`/emails/${email.id}`, { is_starred: !email.is_starred });
      onUpdate({ ...email, is_starred: !email.is_starred });
      toast.success(email.is_starred ? 'Unstarred' : 'Starred ⭐');
    } catch { toast.error('Failed to update'); }
  };

  const toggleImportant = async () => {
    try {
      await api.patch(`/emails/${email.id}`, { is_important: !email.is_important });
      onUpdate({ ...email, is_important: !email.is_important });
      toast.success(email.is_important ? 'Marked normal' : 'Marked important');
    } catch { toast.error('Failed to update'); }
  };

  const moveToTrash = async () => {
    try {
      await api.patch(`/emails/${email.id}`, { folder: 'trash' });
      onDelete(email.id);
      toast.success('Moved to trash');
    } catch { toast.error('Failed to delete'); }
  };

  const sentTime = email.sent_at || email.created_at;
  const formattedDate = sentTime ? format(new Date(sentTime), 'MMM d, yyyy, h:mm a') : '';

  return (
    <div className="email-view-panel">
      <div className="email-view-header">
        <button className="icon-btn" onClick={() => onUpdate(null)} title="Back"><X size={16} /></button>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          {email.folder?.toUpperCase()}
        </span>
        <div className="btn-group">
          <button className="icon-btn" title="Reply" onClick={() => onReply(email)}><Reply size={16} /></button>
          <button className="icon-btn" title="Forward" onClick={() => onForward(email)}><Forward size={16} /></button>
          <button className={`icon-btn ${email.is_starred ? 'active-star' : ''}`} title="Star" onClick={toggleStar}>
            <Star size={16} fill={email.is_starred ? 'currentColor' : 'none'} />
          </button>
          <button className={`icon-btn ${email.is_important ? 'active-important' : ''}`} title="Mark important" onClick={toggleImportant}>
            <AlertCircle size={16} fill={email.is_important ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-btn" title="Archive" onClick={async () => {
            await api.patch(`/emails/${email.id}`, { folder: 'archive' });
            onDelete(email.id);
            toast.success('Archived');
          }}><Archive size={16} /></button>
          <button className="icon-btn" title="Delete" onClick={moveToTrash}><Trash2 size={16} /></button>

          {/* Share Button */}
          <div className="share-dropdown-wrap" ref={shareRef}>
            <button className="icon-btn" title="Share" onClick={() => setShowShare(!showShare)}>
              <Share2 size={16} />
            </button>
            {showShare && (
              <div className="share-dropdown">
                <div style={{ padding: '8px 14px 6px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                  SHARE EMAIL VIA
                </div>
                {SHARE_OPTIONS.map(opt => (
                  <div key={opt.id} className="share-item" onClick={() => shareEmail(opt.id)}>
                    <div className="share-item-icon" style={{ background: opt.color + '22' }}>{opt.emoji}</div>
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn" title="More"><MoreVertical size={16} /></button>
        </div>
      </div>

      <div className="email-view-content">
        <div className="email-view-subject">{email.subject}</div>
        <div className="email-meta-bar">
          <div className="avatar lg">
            {(email.from_name || email.from_address || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="email-meta-info">
            <div className="email-meta-from">
              {email.from_name || email.from_address}
              {email.from_name && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>&lt;{email.from_address}&gt;</span>}
            </div>
            <div className="email-meta-to">
              To: {email.to_address}
              {email.cc && `, Cc: ${email.cc}`}
              <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="email-body">
          {email.body && email.body.startsWith('<') ? (
            <div dangerouslySetInnerHTML={{ __html: email.body }} />
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{email.body}</pre>
          )}
        </div>

        {/* Quick share footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--bg-surface0)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick share:</span>
          {SHARE_OPTIONS.slice(0, 4).map(opt => (
            <button key={opt.id} className="share-chip" onClick={() => shareEmail(opt.id)}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
