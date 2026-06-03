import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ComposeModal from '../components/ComposeModal';
import api from '../utils/api';

export default function SettingsPage() {
  const [counts, setCounts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await api.get('/emails/counts');
      setCounts(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return (
    <div className="mailbox-layout">
      <Sidebar
        counts={counts}
        onCompose={() => setShowCompose(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="email-view-panel" style={{ padding: '24px' }}>
        <div className="email-view-header" style={{ justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Settings</div>
            <h1 style={{ marginTop: 8, fontSize: 28, lineHeight: 1.1 }}>Application settings</h1>
          </div>
        </div>

        <div style={{ marginTop: 24, color: 'var(--text-secondary)', maxWidth: 720 }}>
          <p>Settings are not fully implemented yet, but the navigation is now wired correctly.</p>
          <div style={{ marginTop: 20, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div style={{ background: 'var(--bg-crust)', border: '1px solid var(--bg-surface0)', borderRadius: 14, padding: 18 }}>
              <strong>Future settings:</strong>
              <ul style={{ marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                <li>Account preferences</li>
                <li>SMTP and email delivery</li>
                <li>Theme and notifications</li>
              </ul>
            </div>
            <div style={{ background: 'var(--bg-crust)', border: '1px solid var(--bg-surface0)', borderRadius: 14, padding: 18 }}>
              <strong>Quick note:</strong>
              <p style={{ marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                You can still compose email from the sidebar on this page.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}
