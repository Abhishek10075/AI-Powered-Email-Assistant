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
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Reply,
  Forward,
  Trash2,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';
const INBOX_ENDPOINT = `${API_BASE_URL}/api/emails/inbox?limit=15`;

export default function Inbox({ onComposeAction }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDeleteEmail = async (e, id) => {
    e.stopPropagation(); // Parent click prevent karein
    if (deletingId) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/emails/inbox/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail || 'Failed to delete email');
      }

      setEmails((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        if (selectedId === id) {
          setSelectedId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting email');
    } finally {
      setDeletingId(null);
    }
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownloadAttachment = (file) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
  const receivedAttachments = selectedEmail?.attachments || [];

  const handleReply = () => {
    if (!selectedEmail || !onComposeAction) return;
    const currentSubject = selectedEmail.subject || 'No Subject';
    const cleanSub = currentSubject.startsWith('Re:') ? currentSubject : `Re: ${currentSubject}`;

    onComposeAction({
      receiver: selectedSender?.email || '',
      subject: cleanSub,
      description: `Replying to:\n"${selectedEmail.body.slice(0, 300)}..."\n\nPlease write a professional and polite reply.`,
    });
  };

  const handleForward = () => {
    if (!selectedEmail || !onComposeAction) return;
    const currentSubject = selectedEmail.subject || 'No Subject';
    const cleanSub = currentSubject.startsWith('Fwd:') ? currentSubject : `Fwd: ${currentSubject}`;

    onComposeAction({
      receiver: '',
      subject: cleanSub,
      description: `Forwarding this email to a colleague:\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`,
    });
  };

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
            const hasAtt = item.attachments && item.attachments.length > 0;
            const isDeleting = deletingId === item.id;

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

                  <div className="email-header-right">
                    {hasAtt && <Paperclip size={11} className="text-[#1f6f5c]" />}
                    <span className="email-item-date">{formatDate(item.date)}</span>

                    {/* Delete Action on Hover */}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => handleDeleteEmail(e, item.id)}
                      className="email-delete-btn"
                      title="Delete email"
                    >
                      {isDeleting ? (
                        <Loader2 size={12} className="spin text-red-600" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="verified-pill">
                    <Sparkles size={12} /> Gmail Verified
                  </span>

                  {/* Header Delete Action */}
                  <button
                    type="button"
                    disabled={deletingId === selectedEmail.id}
                    onClick={(e) => handleDeleteEmail(e, selectedEmail.id)}
                    className="email-header-delete-btn"
                    title="Delete this message"
                  >
                    {deletingId === selectedEmail.id ? (
                      <Loader2 size={13} className="spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Delete</span>
                  </button>
                </div>

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
                {/* Text Body */}
                <div className="email-body-text">{selectedEmail.body}</div>

                {/* Attachments Section */}
                {receivedAttachments.length > 0 && (
                  <div className="inbox-attachments-section">
                    <div className="inbox-att-title">
                      <Paperclip size={14} />
                      <span>Attachments ({receivedAttachments.length})</span>
                    </div>

                    <div className="inbox-att-grid">
                      {receivedAttachments.map((file, idx) => (
                        <div key={idx} className="inbox-att-card">
                          <div className="inbox-att-icon">
                            {file.content_type?.startsWith('image/') ? (
                              <ImageIcon size={18} className="text-[#1f6f5c]" />
                            ) : (
                              <FileText size={18} className="text-[#1f6f5c]" />
                            )}
                          </div>
                          <div className="inbox-att-meta">
                            <div className="inbox-att-name" title={file.filename}>
                              {file.filename}
                            </div>
                            <div className="inbox-att-size">{formatFileSize(file.size)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(file)}
                            className="inbox-att-download"
                            title="Download file"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply and Forward Action Bar */}
                <div className="inbox-actions-bar">
                  <button
                    type="button"
                    onClick={handleReply}
                    className="inbox-action-btn"
                  >
                    <Reply size={14} />
                    <span>Reply</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleForward}
                    className="inbox-action-btn"
                  >
                    <Forward size={14} />
                    <span>Forward</span>
                  </button>
                </div>
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
          position: relative;
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

        .email-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .email-item-date {
          font-size: 0.6875rem;
          color: #9ea194;
          white-space: nowrap;
        }

        .email-delete-btn {
          display: none;
          background: transparent;
          border: none;
          color: #9ea194;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }

        .email-item:hover .email-delete-btn {
          display: inline-flex;
          align-items: center;
        }

        .email-delete-btn:hover {
          color: #b73822;
          background: #fbece8;
        }

        .email-header-delete-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: 1px solid #eeccc0;
          color: #ad4632;
          border-radius: 7px;
          padding: 0.25rem 0.55rem;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .email-header-delete-btn:hover {
          background: #fbece8;
          border-color: #ad4632;
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

        .inbox-attachments-section {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e2ded0;
        }

        .inbox-att-title {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78125rem;
          font-weight: 600;
          color: #1f6f5c;
          margin-bottom: 0.85rem;
        }

        .inbox-att-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 0.75rem;
        }

        .inbox-att-card {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: #faf8f2;
          border: 1px solid #e2ded0;
          border-radius: 10px;
          padding: 0.65rem 0.75rem;
          transition: border-color 0.15s, transform 0.1s;
        }

        .inbox-att-card:hover {
          border-color: #1f6f5c;
          transform: translateY(-1px);
        }

        .inbox-att-icon {
          width: 32px;
          height: 32px;
          background: #e7f1ee;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .inbox-att-meta {
          flex: 1;
          min-width: 0;
        }

        .inbox-att-name {
          font-size: 0.78125rem;
          font-weight: 500;
          color: #24261f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .inbox-att-size {
          font-size: 0.6875rem;
          color: #7f8677;
          margin-top: 0.1rem;
        }

        .inbox-att-download {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #ffffff;
          border: 1px solid #e2ded0;
          color: #1f6f5c;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }

        .inbox-att-download:hover {
          background: #1f6f5c;
          border-color: #1f6f5c;
          color: #ffffff;
        }

        .inbox-actions-bar {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #e2ded0;
        }

        .inbox-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.95rem;
          border-radius: 8px;
          border: 1px solid #e2ded0;
          background: #faf8f2;
          color: #24261f;
          font-size: 0.78125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .inbox-action-btn:hover {
          border-color: #1f6f5c;
          background: #e7f1ee;
          color: #1f6f5c;
          transform: translateY(-1px);
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