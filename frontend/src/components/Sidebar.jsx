import React from 'react';
import { Send, Inbox, Mail, Settings, Feather } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sm-sidebar">
      {/* Top Branding */}
      <div>
        <div className="sm-sidebar-brand">
          <span className="sm-sidebar-logo">
            <Feather size={15} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="sm-sidebar-title">SmartMail</h1>
            <p className="sm-sidebar-subtitle">MAIL WORKSPACE</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="sm-sidebar-nav">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`sm-nav-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          >
            <Inbox size={16} strokeWidth={activeTab === 'inbox' ? 2.2 : 1.8} />
            <span>Inbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`sm-nav-btn ${activeTab === 'sent' ? 'active' : ''}`}
          >
            <Send size={16} strokeWidth={activeTab === 'sent' ? 2.2 : 1.8} />
            <span>Compose & Sent</span>
          </button>
        </nav>
      </div>

      {/* Bottom Settings */}
      <div className="sm-sidebar-footer">
        <button type="button" className="sm-footer-btn">
          <Settings size={15} strokeWidth={1.8} />
          <span>Settings</span>
        </button>
      </div>

      <style>{`
        .sm-sidebar {
          width: 220px;
          min-width: 220px;
          max-width: 220px;
          height: 100vh;
          background: #181d19;
          border-right: 1px solid #282f2a;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1.25rem 0.85rem;
          user-select: none;
          flex-shrink: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sm-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.35rem 0.5rem 1.4rem;
          border-bottom: 1px solid #262e28;
          margin-bottom: 1rem;
        }

        .sm-sidebar-logo {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #1f6f5c;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sm-sidebar-title {
          font-family: Georgia, 'Iowan Old Style', serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #f5f3ec;
          line-height: 1.15;
          letter-spacing: 0.01em;
          margin: 0;
        }

        .sm-sidebar-subtitle {
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #7f8a82;
          margin: 0.15rem 0 0;
        }

        .sm-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .sm-nav-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #9ba69e;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          box-sizing: border-box;
        }

        .sm-nav-btn:hover {
          background: #202722;
          color: #e4e9e5;
        }

        .sm-nav-btn.active {
          background: #1f6f5c;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .sm-sidebar-footer {
          border-top: 1px solid #262e28;
          padding-top: 0.75rem;
        }

        .sm-footer-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #7f8a82;
          font-size: 0.78125rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sm-footer-btn:hover {
          background: #202722;
          color: #d1d8d3;
        }
      `}</style>
    </aside>
  );
}