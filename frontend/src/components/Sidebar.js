import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Inbox, Send, Star, AlertCircle, Trash2, Archive, FileText, Mail, LogOut, Users, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'important', label: 'Important', icon: AlertCircle },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'spam', label: 'Spam', icon: Mail },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const MANAGE_ITEMS = [
  { id: 'contacts', label: 'Contacts', icon: Users, path: '/contacts' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ counts, onCompose, isOpen = false, onClose }) {
  const { folder } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const activeFolder = location.pathname.startsWith('/mail/') ? location.pathname.split('/')[2] : null;

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`} onClick={onClose ? onClose : undefined} />
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Mail size={16} color="#11111b" strokeWidth={2.5} />
          </div>
          <span className="sidebar-title">MailWave</span>
          {onClose && <button className="sidebar-close-btn" onClick={onClose} title="Close menu"><X size={16} /></button>}
        </div>

      <button className="compose-btn" onClick={() => { onCompose(); onClose && onClose(); }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
        Compose
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Mail</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const count = counts?.[id];
          return (
            <div key={id}
              className={`nav-item ${activeFolder === id ? 'active' : ''}`}
              onClick={() => {
                navigate(`/mail/${id}`);
                onClose && onClose();
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
              {count > 0 && <span className="badge">{count > 99 ? '99+' : count}</span>}
            </div>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: 12 }}>Manage</div>
        {MANAGE_ITEMS.map(({ id, label, icon: Icon, path }) => (
          <div key={id}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => {
              navigate(path);
              onClose && onClose();
            }}
          >
            <Icon size={15} strokeWidth={1.8} />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Sign out">
          <div className="avatar">{user?.avatar || user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <LogOut size={14} color="var(--text-muted)" />
        </div>
      </div>
    </aside>
    </>
  );
}
