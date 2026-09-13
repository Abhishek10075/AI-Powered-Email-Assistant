import React, { useState, useEffect } from 'react';
import {
  Inbox as InboxIcon,
  RefreshCw,
  Search,
  Calendar,
  Mail,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';
const INBOX_ENDPOINT = `${API_BASE_URL}/api/emails/inbox?limit=15`;

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState(new Set());

  const fetchInbox = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(INBOX_ENDPOINT);
      if (!res.ok) {
        throw new Error(`Failed to load inbox (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data?.emails) ? data.emails : [];
      setEmails(list);

      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
        setReadIds((prev) => new Set([...prev, list[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to email inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSelectEmail = (id) => {
    setSelectedId(id);
    setReadIds((prev) => new Set([...prev, id]));
  };

  const formatSender = (rawFrom) => {
    if (!rawFrom) return { name: 'Unknown', email: '' };
    const match = rawFrom.match(/^(.*?)\s*<(.+?)>$/);
    if (match) {
      return {
        name: match[1].replace(/["']/g, '').trim() || match[2],
        email: match[2].trim(),
      };
    }
    return { name: rawFrom.trim(), email: rawFrom.trim() };
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return rawDate;
    }
  };

  const filteredEmails = emails.filter((item) => {
    const q = searchQuery.toLowerCase();
    const sender = item.from?.toLowerCase() || '';
    const subject = item.subject?.toLowerCase() || '';
    const body = item.body?.toLowerCase() || '';
    return sender.includes(q) || subject.includes(q) || body.includes(q);
  });

  const selectedEmail = emails.find((item) => item.id === selectedId);
  const selectedSender = selectedEmail ? formatSender(selectedEmail.from) : null;

  return (
    <div className="inbox-container">
      {/* Top Header */}
      <header className="inbox-header">
        <div className="inbox-header-title-box">
          <span className="inbox-header-icon">
            <InboxIcon size={16} strokeWidth={2.2} />
          </span>
          <span className="inbox-header-title">Inbox</span>
          <span className="inbox-badge">{emails.length} messages</span>
        </div>

        <div className="inbox-header-actions">
          <div className="inbox-search">
            <Search size={14} color="#7f8677" />
            <input
              type="text"
              placeholder="Search sender, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={fetchInbox}
            disabled={loading}
            className="inbox-refresh"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Two Panes */}
      <div className="inbox-split-view">
        {/* Left List */}
        <aside className="inbox-list-pane">
          {loading && emails.length === 0 && (
            <div className="inbox-state-msg">
              <Loader2 size={20} className="spin text-accent" />
              <span>Fetching latest emails...</span>
            </div>
          )}

          {error && (
            <div className="inbox-error-box">
              <AlertCircle size={16} />
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!loading && filteredEmails.length === 0 && !error && (
            <div className="inbox-state-msg">
              <Mail size={24} color="#9ea194" />
              <span>No emails found</span>
            </div>
          )}

          {filteredEmails.map((item) => {
            const sender = formatSender(item.from);
            const isSelected = item.id === selectedId;
            const isUnread = !readIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleSelectEmail(item.id)}
                className={`email-item ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
              >
                <div className="email-item-header">
                  <div className="email-sender-wrap">
                    {isUnread && <span className="unread-dot" />}
                    <span className="email-sender-name">{sender.name}</span>
                  </div>
                  <span className="email-item-date">{formatDate(item.date)}</span>
                </div>
                <div className="email-item-subject">{item.subject || 'No Subject'}</div>
                <div className="email-item-snippet">
                  {item.body ? item.body.slice(0, 110) : 'No preview available.'}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Right Preview */}
        <main className="inbox-preview-pane">
          {selectedEmail ? (
            <div className="email-full-card">
              <div className="email-full-header">
                <span className="verified-pill">
                  <Sparkles size={12} /> Gmail Verified
                </span>
                <h2 className="email-full-subject">{selectedEmail.subject || 'No Subject'}</h2>

                <div className="email-meta-bar">
                  <div className="email-sender-info">
                    <div className="avatar">{selectedSender?.name?.charAt(0).toUpperCase() || 'M'}</div>
                    <div>
                      <div className="sender-name-full">
                        {selectedSender?.name}{' '}
                        {selectedSender?.email && <span>&lt;{selectedSender.email}&gt;</span>}
                      </div>
                      <div className="sender-sub">Received via IMAP SSL</div>
                    </div>
                  </div>

                  <div className="email-date-pill">
                    <Calendar size={13} />
                    <span>{selectedEmail.date}</span>
                  </div>
                </div>
              </div>

              <div className="email-full-body">
                <div className="email-body-text">{selectedEmail.body}</div>
              </div>
            </div>
          ) : (
            <div className="inbox-state-msg">
              <Mail size={32} color="#9ea194" />
              <span>Select an email from the left list to read</span>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .inbox-container {
          width: 100%;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #faf8f2;
          color: #24261f;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .inbox-header {
          height: 54px;
          background: #ffffff;
          border-bottom: 1px solid #e2ded0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          flex-shrink: 0;
        }

        .inbox-header-title-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .inbox-header-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #1f6f5c;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inbox-header-title {
          font-family: Georgia, serif;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .inbox-badge {
          font-size: 0.7rem;
          font-weight: 600;
          background: #e7f1ee;
          color: #1f6f5c;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
        }

        .inbox-header-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .inbox-search {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #faf8f2;
          border: 1px solid #e2ded0;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
        }

        .inbox-search input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.8rem;
          width: 220px;
        }

        .inbox-refresh {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: #ffffff;
          border: 1px solid #e2ded0;
          border-radius: 8px;
          padding: 0.4rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #5b6270;
          cursor: pointer;
        }

        .inbox-refresh:hover { border-color: #1f6f5c; color: #1f6f5c; }

        .inbox-split-view {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .inbox-list-pane {
          width: 380px;
          background: #ffffff;
          border-right: 1px solid #e2ded0;
          overflow-y: auto;
          flex-shrink: 0;
        }

        .inbox-preview-pane {
          flex: 1;
          background: #faf8f2;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .email-item {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #eae6da;
          cursor: pointer;
          transition: background 0.15s;
        }

        .email-item:hover { background: #f6f4ee; }
        .email-item.selected {
          background: #e7f1ee !important;
          border-left: 4px solid #1f6f5c;
        }

        .email-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .email-sender-wrap {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          overflow: hidden;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #1f6f5c;
          flex-shrink: 0;
        }

        .email-sender-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #24261f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .email-item.unread .email-sender-name {
          font-weight: 700;
        }

        .email-item-date {
          font-size: 0.6875rem;
          color: #9ea194;
          white-space: nowrap;
        }

        .email-item-subject {
          font-size: 0.78125rem;
          font-weight: 500;
          color: #3b4035;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .email-item-snippet {
          font-size: 0.72rem;
          color: #7f8677;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .email-full-card {
          background: #ffffff;
          border: 1px solid #e2ded0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .email-full-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2ded0;
          background: #fff;
        }

        .verified-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #eaf5ee;
          color: #2f7d52;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          margin-bottom: 0.75rem;
        }

        .email-full-subject {
          font-family: Georgia, serif;
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #24261f;
        }

        .email-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #eae6da;
        }

        .email-sender-info {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: #1f6f5c;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .sender-name-full {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #24261f;
        }

        .sender-name-full span {
          font-size: 0.75rem;
          font-weight: 400;
          color: #7f8677;
        }

        .sender-sub {
          font-size: 0.6875rem;
          color: #9ea194;
        }

        .email-date-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #faf8f2;
          border: 1px solid #e2ded0;
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
          font-size: 0.75rem;
          color: #5b6270;
        }

        .email-full-body {
          padding: 1.75rem;
        }

        .email-body-text {
          font-family: Georgia, serif;
          font-size: 0.9375rem;
          line-height: 1.8;
          color: #24261f;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .inbox-state-msg {
          height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #7f8677;
          font-size: 0.8rem;
        }

        .inbox-error-box {
          margin: 1rem;
          padding: 0.75rem;
          background: #fbece8;
          color: #b73822;
          border-radius: 8px;
          font-size: 0.75rem;
          display: flex;
          gap: 0.5rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}