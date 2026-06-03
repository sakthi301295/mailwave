import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import ComposeModal from '../components/ComposeModal';
import api from '../utils/api';

export default function ContactsPage() {
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
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Contacts</div>
            <h1 style={{ marginTop: 8, fontSize: 28, lineHeight: 1.1 }}>Your contacts</h1>
          </div>
        </div>

        <div style={{ marginTop: 24, color: 'var(--text-secondary)', maxWidth: 720 }}>
          <p>This area will show your saved contacts once the feature is enabled.</p>
          <p>For now, use the sidebar links to navigate to your mailbox or settings.</p>
          <div style={{ marginTop: 20, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div style={{ background: 'var(--bg-crust)', border: '1px solid var(--bg-surface0)', borderRadius: 14, padding: 18 }}>
              <strong>Coming soon:</strong>
              <ul style={{ marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                <li>Contact list and search</li>
                <li>Favorites and groups</li>
                <li>Import/export</li>
              </ul>
            </div>
            <div style={{ background: 'var(--bg-crust)', border: '1px solid var(--bg-surface0)', borderRadius: 14, padding: 18 }}>
              <strong>Quick actions:</strong>
              <p style={{ marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Press <code style={{ background: 'var(--bg-surface0)', padding: '2px 5px', borderRadius: 4 }}>C</code> to compose a new message.
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
