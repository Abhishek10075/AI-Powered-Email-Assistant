import React, { useState } from 'react';
import {
  Mail,
  Key,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Feather,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(true);

  const handlePasswordChange = (e) => {
    // Automatically saare spaces remove karein
    const cleaned = e.target.value.replace(/\s+/g, '');
    setPassword(cleaned);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.replace(/\s+/g, '');

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide both Gmail and App Password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          app_password: cleanPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed. Check your credentials.');
      }

      onLoginSuccess({
        email: cleanEmail,
        password: cleanPassword,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Card: Login Form */}
        <div className="login-card">
          <div className="login-brand">
            <span className="login-brand-icon">
              <Feather size={18} strokeWidth={2.2} />
            </span>
            <h1>SmartMail AI</h1>
            <p>Login with your Gmail credentials</p>
          </div>

          {error && (
            <div className="login-error-box">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Gmail Address</label>
              <div className="input-box">
                <Mail size={16} color="#7f8677" />
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>16-Digit App Password</label>
              <div className="input-box">
                <Key size={16} color="#7f8677" />
                <input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <p className="hint-text">Spaces will be removed automatically.</p>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Verifying with Gmail...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Sign In to SmartMail</span>
                </>
              )}
            </button>
          </form>

          {/* Mobile Guide Toggle */}
          <button
            type="button"
            className="guide-toggle-btn"
            onClick={() => setShowGuide(!showGuide)}
          >
            <HelpCircle size={14} />
            <span>How to generate an App Password?</span>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Right Card: Step-by-Step App Password Guide */}
        {showGuide && (
          <div className="guide-card">
            <div className="guide-header">
              <HelpCircle size={16} className="text-[#1f6f5c]" />
              <h2>How to create a Google App Password</h2>
            </div>
            <p className="guide-sub">Follow these steps to generate your 16-character password:</p>

            <ul className="guide-steps-list">
              <li>
                <span className="step-num">1</span>
                <div>
                  Open your{' '}
                  <a
                    href="https://myaccount.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="guide-link"
                  >
                    Google Account <ExternalLink size={11} className="inline-block" />
                  </a>
                  .
                </div>
              </li>

              <li>
                <span className="step-num">2</span>
                <div>
                  Click on <strong>Security and sign-in</strong>.
                </div>
              </li>

              <li>
                <span className="step-num">3</span>
                <div>
                  Click <strong>2-Step Verification</strong>, enter your password, and click{' '}
                  <strong>Turn on 2-Step Verification</strong> at the bottom.
                </div>
              </li>

              <li>
                <span className="step-num">4</span>
                <div>
                  Search for <strong>App Password</strong> in the search box at the top.
                </div>
              </li>

              <li>
                <span className="step-num">5</span>
                <div>
                  Enter an <strong>App name</strong> (e.g. <em>SmartMail</em>) and click{' '}
                  <strong>Create</strong>.
                </div>
              </li>

              <li>
                <span className="step-num">6</span>
                <div>
                  Copy the 16-character code and paste it into the <strong>App Password</strong>{' '}
                  field to log in.
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>

      <style>{`
        .login-wrapper {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #faf8f2;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #24261f;
          padding: 1.5rem;
          box-sizing: border-box;
        }

        .login-container {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: 1.25rem;
          width: 100%;
          max-width: 880px;
        }

        @media (max-width: 840px) {
          .login-container {
            flex-direction: column;
            max-width: 440px;
          }
        }

        .login-card {
          flex: 1;
          background: #ffffff;
          border: 1px solid #e2ded0;
          border-radius: 16px;
          padding: 2.25rem 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-brand {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .login-brand-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #1f6f5c;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.65rem;
        }

        .login-brand h1 {
          font-family: Georgia, serif;
          font-size: 1.45rem;
          font-weight: 700;
          margin: 0;
          color: #24261f;
        }

        .login-brand p {
          font-size: 0.78125rem;
          color: #7f8677;
          margin-top: 0.25rem;
        }

        .login-error-box {
          background: #fbece8;
          border: 1px solid #eeccc0;
          color: #b73822;
          border-radius: 9px;
          padding: 0.7rem 0.85rem;
          font-size: 0.78125rem;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          margin-bottom: 1.15rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #5b6270;
          margin-bottom: 0.35rem;
        }

        .input-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: #faf8f2;
          border: 1px solid #e2ded0;
          border-radius: 10px;
          padding: 0.6rem 0.85rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .input-box:focus-within {
          border-color: #1f6f5c;
          box-shadow: 0 0 0 3px #e7f1ee;
          background: #ffffff;
        }

        .input-box input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          width: 100%;
          color: #24261f;
        }

        .hint-text {
          font-size: 0.6875rem;
          color: #9ea194;
          margin-top: 0.3rem;
        }

        .login-btn {
          margin-top: 0.35rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #1f6f5c;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0.72rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .login-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .guide-toggle-btn {
          display: none;
          margin-top: 1rem;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: transparent;
          border: none;
          color: #1f6f5c;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem;
        }

        @media (max-width: 840px) {
          .guide-toggle-btn {
            display: inline-flex;
          }
        }

        /* Right Guide Card */
        .guide-card {
          flex: 1;
          background: #ffffff;
          border: 1px solid #e2ded0;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
        }

        .guide-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .guide-header h2 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #24261f;
          margin: 0;
        }

        .guide-sub {
          font-size: 0.75rem;
          color: #7f8677;
          margin: 0 0 1.25rem;
        }

        .guide-steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .guide-steps-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.78125rem;
          line-height: 1.45;
          color: #3b4035;
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #e7f1ee;
          color: #1f6f5c;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .guide-link {
          color: #1f6f5c;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .guide-link:hover {
          color: #164f42;
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