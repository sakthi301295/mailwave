import React, { useState, useRef, useEffect } from 'react';
import {
  X, Send, Bold, Italic, Link2, List, Paperclip,
  MessageCircle, Share2, CheckCircle, AlertTriangle,
  Settings, Wifi, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { id: 'telegram', label: 'Telegram', emoji: '✈️' },
  { id: 'sms',      label: 'SMS',      emoji: '📱' },
  { id: 'copy',     label: 'Copy',     emoji: '📋' },
];

export default function ComposeModal({ onClose, replyTo = null, forwardOf = null }) {
  const [fields, setFields] = useState({
    to:      replyTo?.from_address || '',
    cc:      '',
    bcc:     '',
    subject: replyTo    ? `Re: ${replyTo.subject}`
             : forwardOf ? `Fwd: ${forwardOf.subject}` : '',
    body:    forwardOf
      ? `\n\n─────────── Forwarded Message ───────────\nFrom: ${forwardOf.from_address}\nSubject: ${forwardOf.subject}\n\n${forwardOf.body_plain || ''}`
      : '',
  });

  const [showCc,     setShowCc]     = useState(false);
  const [showBcc,    setShowBcc]    = useState(false);
  const [sending,    setSending]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [smtpStatus, setSmtpStatus] = useState(null); // null | 'ok' | 'fail' | 'unconfigured'
  const [showSmtp,   setShowSmtp]   = useState(false);
  const [smtpForm,   setSmtpForm]   = useState({ host: '', port: '587', user: '', pass: '', name: '' });
  const [testingSmtp,setTestingSmtp]= useState(false);

  const textRef = useRef(null);

  // Check SMTP status on mount
  useEffect(() => {
    api.post('/emails/test-smtp', {})
      .then(() => setSmtpStatus('ok'))
      .catch(err => {
        const msg = err.response?.data?.error || '';
        setSmtpStatus(msg.includes('not configured') ? 'unconfigured' : 'fail');
      });
  }, []);

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }));

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!fields.to.trim())      { toast.error('Recipient email is required'); return; }
    if (!fields.subject.trim()) { toast.error('Subject is required');          return; }
    if (!fields.body.trim())    { toast.error('Message body is empty');        return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fields.to.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/emails/send', {
        to:       fields.to.trim(),
        cc:       fields.cc  || undefined,
        bcc:      fields.bcc || undefined,
        subject:  fields.subject.trim(),
        body:     fields.body,
        bodyPlain: fields.body.replace(/<[^>]+>/g, ''),
      });
      setResult(res.data);
      if (res.data.smtpSent) {
        toast.success(`📤 Email delivered to ${fields.to}!`);
      } else {
        toast.success('Email saved in Sent folder');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  // ── Share via external apps ───────────────────────────────────────────────
  const shareVia = (platform) => {
    const text    = `Subject: ${fields.subject}\nTo: ${fields.to}\n\n${fields.body}`;
    const encoded = encodeURIComponent(text);
    if (platform === 'whatsapp') { window.open(`https://wa.me/?text=${encoded}`, '_blank'); toast.success('Opening WhatsApp...'); }
    else if (platform === 'telegram') { window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank'); toast.success('Opening Telegram...'); }
    else if (platform === 'sms')  { window.open(`sms:?body=${encoded}`, '_blank'); }
    else if (platform === 'copy') { navigator.clipboard.writeText(text); toast.success('Copied!'); }
  };

  // ── Format toolbar ────────────────────────────────────────────────────────
  const applyFormat = (tag) => {
    const ta    = textRef.current;
    if (!ta) return;
    const s     = ta.selectionStart;
    const e2    = ta.selectionEnd;
    const sel   = fields.body.substring(s, e2) || (tag === 'list' ? 'item' : 'text');
    const fmts  = { bold: `**${sel}**`, italic: `_${sel}_`, list: `\n• ${sel}` };
    if (tag === 'link') {
      const url = prompt('Enter URL:');
      if (!url) return;
      fmts.link = `[${sel}](${url})`;
    }
    const fmt = fmts[tag];
    if (!fmt) return;
    set('body', fields.body.substring(0, s) + fmt + fields.body.substring(e2));
  };

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="compose-overlay">
        <div className="compose-modal" style={{ maxWidth: 460, textAlign: 'center', padding: 40 }}>
          {result.smtpSent
            ? <CheckCircle size={60} color="var(--green)" style={{ marginBottom: 16 }} />
            : <CheckCircle size={60} color="var(--accent)" style={{ marginBottom: 16 }} />
          }
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {result.smtpSent ? 'Email Delivered! 🎉' : 'Email Sent!'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            {result.message}
          </p>

          {/* Details card */}
          <div style={{ background: 'var(--bg-crust)', borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 20 }}>
            {[
              ['To',      fields.to],
              ['Subject', fields.subject],
              ['Status',  result.smtpSent ? '📤 Real email delivered via SMTP'
                          : result.smtpError ? `⚠️ SMTP error — saved in Sent`
                          : '💾 Saved in Sent folder'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '5px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)', width: 64, flexShrink: 0 }}>{label}:</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* SMTP setup nudge if not sent via SMTP */}
          {!result.smtpSent && (
            <div style={{ background: 'rgba(249,226,175,0.08)', border: '1px solid rgba(249,226,175,0.25)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ color: 'var(--yellow)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                ⚙️ Want real email delivery?
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                Open <code style={{ background: 'var(--bg-surface0)', padding: '1px 5px', borderRadius: 3 }}>backend/.env</code> and add your Gmail or Outlook SMTP credentials. See the setup guide below.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>Done</button>
            <button className="btn-ghost" onClick={() => setResult(null)}>Compose Another</button>
          </div>
        </div>
      </div>
    );
  }

  // ── SMTP Setup panel ──────────────────────────────────────────────────────
  const SmtpPanel = () => (
    <div style={{ background: 'var(--bg-crust)', borderTop: '1px solid var(--bg-surface0)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Settings size={15} color="var(--accent)" />
        <span style={{ fontWeight: 600, fontSize: 14 }}>SMTP Settings</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          These go in your <code>backend/.env</code> file
        </span>
      </div>

      {/* Quick guide */}
      <div style={{ background: 'var(--bg-mantle)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
        <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>📧 Gmail Setup (recommended):</p>
        <ol style={{ color: 'var(--text-muted)', paddingLeft: 16, lineHeight: 2 }}>
          <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>myaccount.google.com/security</a></li>
          <li>Enable <strong style={{ color: 'var(--text-secondary)' }}>2-Step Verification</strong></li>
          <li>Search for <strong style={{ color: 'var(--text-secondary)' }}>App Passwords</strong> → create one for "Mail"</li>
          <li>Copy the 16-character password</li>
          <li>Add to <code>backend/.env</code>:</li>
        </ol>
        <pre style={{ background: 'var(--bg-base)', borderRadius: 6, padding: '10px 14px', marginTop: 8, fontSize: 11, color: 'var(--green)', overflow: 'auto' }}>
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Your Name`}
        </pre>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Then restart backend: <code style={{ color: 'var(--peach)' }}>node server.js</code>
        </p>
      </div>

      {/* Test button */}
      <button
        className="btn-ghost"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        disabled={testingSmtp}
        onClick={async () => {
          setTestingSmtp(true);
          try {
            await api.post('/emails/test-smtp', {});
            setSmtpStatus('ok');
            toast.success('✅ SMTP connected! You can now send real emails.');
          } catch (err) {
            setSmtpStatus('fail');
            toast.error(err.response?.data?.error || 'SMTP test failed');
          } finally {
            setTestingSmtp(false);
          }
        }}
      >
        {testingSmtp ? 'Testing...' : '🔌 Test SMTP Connection'}
      </button>
    </div>
  );

  // ── Main compose form ─────────────────────────────────────────────────────
  return (
    <div className="compose-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="compose-modal" style={{ maxWidth: 700 }}>

        {/* Header */}
        <div className="compose-header">
          <MessageCircle size={16} color="var(--accent)" />
          <span className="compose-title">
            {replyTo ? 'Reply' : forwardOf ? 'Forward' : 'New Message'}
          </span>

          {/* SMTP status badge */}
          <button
            onClick={() => setShowSmtp(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: smtpStatus === 'ok' ? 'rgba(166,227,161,0.12)' : 'rgba(249,226,175,0.1)',
              border: `1px solid ${smtpStatus === 'ok' ? 'rgba(166,227,161,0.3)' : 'rgba(249,226,175,0.25)'}`,
              borderRadius: 20, padding: '3px 10px', cursor: 'pointer',
              fontSize: 11, fontWeight: 600,
              color: smtpStatus === 'ok' ? 'var(--green)' : 'var(--yellow)',
            }}
            title="SMTP settings"
          >
            {smtpStatus === 'ok'
              ? <><Wifi size={11} /> Real Email ON</>
              : <><WifiOff size={11} /> Setup SMTP</>
            }
          </button>

          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* SMTP setup panel (collapsible) */}
        {showSmtp && <SmtpPanel />}

        {/* Fields */}
        <div className="compose-field">
          <span className="compose-field-label">To</span>
          <input type="email" placeholder="recipient@gmail.com, another@outlook.com" value={fields.to}
            onChange={e => set('to', e.target.value)} autoFocus />
          <button className="icon-btn" style={{ fontSize: 11, padding: '3px 7px', color: 'var(--text-muted)' }} onClick={() => setShowCc(s => !s)}>Cc</button>
          <button className="icon-btn" style={{ fontSize: 11, padding: '3px 7px', color: 'var(--text-muted)' }} onClick={() => setShowBcc(s => !s)}>Bcc</button>
        </div>
        {showCc && (
          <div className="compose-field">
            <span className="compose-field-label">Cc</span>
            <input type="text" placeholder="cc@example.com" value={fields.cc} onChange={e => set('cc', e.target.value)} />
          </div>
        )}
        {showBcc && (
          <div className="compose-field">
            <span className="compose-field-label">Bcc</span>
            <input type="text" placeholder="bcc@example.com" value={fields.bcc} onChange={e => set('bcc', e.target.value)} />
          </div>
        )}
        <div className="compose-field">
          <span className="compose-field-label">Sub</span>
          <input type="text" placeholder="Email subject" value={fields.subject} onChange={e => set('subject', e.target.value)} />
        </div>

        {/* Toolbar */}
        <div className="compose-toolbar">
          <button className="toolbar-btn" onClick={() => applyFormat('bold')}  title="Bold"><Bold size={13} /></button>
          <button className="toolbar-btn" onClick={() => applyFormat('italic')} title="Italic"><Italic size={13} /></button>
          <button className="toolbar-btn" onClick={() => applyFormat('link')}  title="Link"><Link2 size={13} /></button>
          <button className="toolbar-btn" onClick={() => applyFormat('list')}  title="List"><List size={13} /></button>
          <button className="toolbar-btn" onClick={() => toast('Attachments coming soon!')} title="Attach"><Paperclip size={13} /></button>
        </div>

        {/* Body */}
        <div className="compose-body">
          <textarea ref={textRef} className="compose-textarea"
            placeholder="Write your message here..." value={fields.body}
            onChange={e => set('body', e.target.value)} />
        </div>

        {/* Share to external apps */}
        <div className="share-section">
          <Share2 size={13} color="var(--text-muted)" />
          <span className="share-label">Share via:</span>
          {SHARE_PLATFORMS.map(p => (
            <button key={p.id} className="share-chip" onClick={() => shareVia(p.id)}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="compose-footer">
          <button className="btn-send" onClick={handleSend} disabled={sending}>
            <Send size={14} />
            {sending ? 'Sending...' : smtpStatus === 'ok' ? 'Send Real Email' : 'Send Email'}
          </button>
          <button className="btn-ghost" onClick={async () => {
            await api.post('/emails/draft', { to: fields.to, cc: fields.cc, bcc: fields.bcc, subject: fields.subject, body: fields.body });
            toast.success('Saved to drafts');
            onClose();
          }}>Save Draft</button>
          <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={onClose}>Discard</button>
        </div>
      </div>
    </div>
  );
}
