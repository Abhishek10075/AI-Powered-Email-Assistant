import React, { useState, useEffect } from 'react';
import {
  Inbox as InboxIcon,
  RefreshCw,
  Search,
  Calendar,
  User,
  Clock,
  Mail,
  AlertCircle,
  Loader2,
  ChevronRight,
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

      // Pehla email automatically select karein agar available ho
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

  // Helper functions clean display ke liye
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
    <div className="inbox-shell w-full h-full flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="inbox-topbar flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-2.5">
          <span className="inbox-badge-icon">
            <InboxIcon size={16} strokeWidth={2} />
          </span>
          <h1 className="inbox-title">Inbox</h1>
          <span className="inbox-count-pill">{emails.length} messages</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="inbox-search-box flex items-center gap-2 px-3 py-1.5 rounded-lg border">
            <Search size={14} className="text-muted" />
            <input
              type="text"
              placeholder="Search sender, subject, or message…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-52 md:w-64"
            />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchInbox}
            disabled={loading}
            className="inbox-refresh-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium"
            title="Refresh inbox"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Email List (5 cols) */}
        <section className="md:col-span-5 lg:col-span-4 border-r flex flex-col h-full overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto divide-y divide-subtle">
            {loading && emails.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted text-xs">
                <Loader2 size={20} className="animate-spin text-accent" />
                <span>Fetching latest emails from Gmail…</span>
              </div>
            )}

            {error && (
              <div className="m-4 p-3.5 bg-error-soft border border-error-line text-error rounded-xl text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Failed to read emails</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}

            {!loading && filteredEmails.length === 0 && !error && (
              <div className="h-64 flex flex-col items-center justify-center text-muted text-xs text-center p-6">
                <Mail size={28} className="stroke-[1.2] mb-2 opacity-50" />
                <p className="font-medium text-ink">No emails match your query</p>
                <p className="text-[11px] opacity-75 mt-0.5">Your primary inbox has no items to display.</p>
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
                  className={`email-row p-3.5 cursor-pointer transition ${
                    isSelected
                      ? 'email-row-active'
                      : isUnread
                      ? 'bg-[#fafaf7] hover:bg-[#f3f1ea]'
                      : 'hover:bg-[#f7f6f1]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      {isUnread && <span className="unread-dot flex-shrink-0" />}
                      <span className={`text-xs truncate ${isUnread ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>
                        {sender.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-faint flex-shrink-0 whitespace-nowrap">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  <div className={`text-xs truncate mb-1 ${isUnread ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                    {item.subject || 'No Subject'}
                  </div>

                  <p className="text-[11px] text-faint line-clamp-2 leading-relaxed font-sans">
                    {item.body ? item.body.slice(0, 140) : 'No preview available.'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Full Email Reading Pane (7 cols) */}
        <section className="md:col-span-7 lg:col-span-8 flex flex-col h-full overflow-hidden bg-[#faf8f2]">
          {selectedEmail ? (
            <article className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Email Content Header */}
              <div className="p-6 md:p-8 bg-white border-b flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="status-pill">
                    <Sparkles size={11} /> Gmail Verified
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-tight mb-4">
                  {selectedEmail.subject || 'No Subject'}
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-subtle text-xs">
                  <div className="flex items-center gap-3">
                    <div className="avatar-circle">
                      {selectedSender?.name ? selectedSender.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <div className="font-semibold text-ink flex items-center gap-1.5">
                        <span>{selectedSender?.name}</span>
                        {selectedSender?.email && (
                          <span className="text-[11px] font-normal text-muted">
                            &lt;{selectedSender.email}&gt;
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> Received via IMAP SSL
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted bg-[#f5f3ec] px-3 py-1.5 rounded-lg border">
                    <Calendar size={12} />
                    <span>{selectedEmail.date}</span>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="email-body-paper bg-white p-6 md:p-8 rounded-xl border shadow-sm">
                  <div className="email-prose text-sm text-ink whitespace-pre-wrap leading-relaxed font-serif select-text">
                    {selectedEmail.body || 'This message contains no readable text body.'}
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted">
              <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center mb-3 shadow-sm">
                <Mail size={22} className="stroke-[1.3] text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-ink">No conversation selected</h3>
              <p className="text-xs text-muted max-w-xs mt-1">
                Choose an incoming message from the left to read its complete content.
              </p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .inbox-shell {
          --paper: #f5f3ec;
          --surface: #ffffff;
          --surface-2: #faf8f2;
          --ink: #24261f;
          --ink-soft: #5b6270;
          --muted: #7f8677;
          --faint: #9ea194;
          --line: #e2ded0;
          --subtle: #eae6da;
          --accent: #1f6f5c;
          --accent-soft: #e7f1ee;
          --stamp: #ad4632;
          --error: #b73822;
          --error-soft: #fbece8;
          --error-line: #f1cfc6;
          background: var(--surface-2);
          color: var(--ink);
        }

        .inbox-topbar {
          background: #ffffff;
          border-color: var(--line);
        }

        .inbox-badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: var(--accent);
          color: #fff;
        }

        .inbox-title {
          font-family: Georgia, 'Iowan Old Style', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
        }

        .inbox-count-pill {
          font-size: 0.6875rem;
          font-weight: 600;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
        }

        .inbox-search-box {
          background: #ffffff;
          border-color: var(--line);
          color: var(--ink);
        }

        .inbox-refresh-btn {
          background: #ffffff;
          border-color: var(--line);
          color: var(--ink-soft);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .inbox-refresh-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }

        .email-row {
          border-color: var(--subtle);
        }

        .email-row-active {
          background: var(--accent-soft) !important;
          border-left: 4px solid var(--accent);
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--accent);
        }

        .avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #eaf5ee;
          color: #2f7d52;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
        }

        .email-body-paper {
          border-color: var(--line);
        }

        .email-prose {
          line-height: 1.8;
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
}