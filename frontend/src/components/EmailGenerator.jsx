import React, { useState, useRef, useEffect } from 'react';
import {
  Feather,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';
const GENERATE_EMAIL_ENDPOINT = `${API_BASE_URL}/api/generate-email`;
const SEND_EMAIL_ENDPOINT = `${API_BASE_URL}/api/send-email`;

export default function EmailGenerator() {
  const [formData, setFormData] = useState({
    receiver: '',
    subject: '',
    description: '',
    contact: '',
  });
  const [attachments, setAttachments] = useState([]);

  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [preview, setPreview] = useState({ to: '', subject: '', body: '' });
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef(null);

  const [sendStatus, setSendStatus] = useState('idle');
  const [sendErrorMessage, setSendErrorMessage] = useState('');

  useEffect(() => () => clearTimeout(copyTimeout.current), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentUpload = (e) => {
    const incoming = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...incoming]);
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canGenerate =
    formData.subject.trim().length > 0 &&
    formData.description.trim().length > 0 &&
    status !== 'loading';

  const generateEmail = async () => {
    if (!formData.subject.trim() || !formData.description.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(GENERATE_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          short_description: formData.description.trim(),
          contact_details: formData.contact.trim(),
        }),
      });

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const errBody = await res.json();
          if (typeof errBody?.detail === 'string') message = errBody.detail;
          else if (typeof errBody?.error === 'string') message = errBody.error;
        } catch (_) {}
        throw new Error(message);
      }

      const data = await res.json();
      if (typeof data?.email !== 'string') {
        throw new Error('The API response was missing an "email" field.');
      }

      setPreview({
        to: formData.receiver.trim(),
        subject: formData.subject.trim(),
        body: data.email,
      });
      setStatus('success');
      setSendStatus('idle');
      setSendErrorMessage('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong while generating the email.'
      );
      setStatus('error');
    }
  };

  const handleCopy = async () => {
    const fullText = `Subject: ${preview.subject}\n\n${preview.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 1800);
    } catch (_) {}
  };

  const handleDownload = () => {
    const fullText = `Subject: ${preview.subject}\n\n${preview.body}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = (preview.subject || 'email').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    link.href = url;
    link.download = `${slug || 'email'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!preview.to.trim() || !preview.body.trim()) return;

    setSendStatus('sending');
    setSendErrorMessage('');

    try {
      const form = new FormData();
      form.append('to', preview.to.trim());
      form.append('subject', preview.subject.trim());
      form.append('body', preview.body);
      attachments.forEach((file) => form.append('attachments', file));

      const res = await fetch(SEND_EMAIL_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const errBody = await res.json();
          if (typeof errBody?.detail === 'string') message = errBody.detail;
          else if (typeof errBody?.error === 'string') message = errBody.error;
        } catch (_) {}
        throw new Error(message);
      }

      setSendStatus('sent');
    } catch (err) {
      setSendErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong while sending the email.'
      );
      setSendStatus('error');
    }
  };

  return (
    <div className="sm-shell w-full">
      <div className="sm-page">
        {/* Top bar */}
        <div className="sm-topbar">
          <div className="sm-brand">
            <span className="sm-mark">
              <Feather size={14} strokeWidth={2} />
            </span>
            <span className="sm-wordmark">SmartMail</span>
          </div>
          <p className="sm-tagline">Draft with AI, refine like your inbox</p>
        </div>

        {/* Two-column layout */}
        <div className="sm-panels">
          <ComposePanel
            formData={formData}
            attachments={attachments}
            canGenerate={canGenerate}
            status={status}
            onChange={handleInputChange}
            onUpload={handleAttachmentUpload}
            onRemoveAttachment={removeAttachment}
            onGenerate={generateEmail}
          />
          <PreviewPanel
            status={status}
            errorMessage={errorMessage}
            preview={preview}
            copied={copied}
            onPreviewChange={setPreview}
            onRegenerate={generateEmail}
            onCopy={handleCopy}
            onDownload={handleDownload}
            sendStatus={sendStatus}
            sendErrorMessage={sendErrorMessage}
            onSend={handleSendEmail}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
          />
        </div>
      </div>

      <style>{`
        .sm-shell {
          --paper: #f5f3ec;
          --surface: #ffffff;
          --surface-2: #faf8f2;
          --ink: #24261f;
          --ink-soft: #6a6d63;
          --ink-faint: #a1a396;
          --line: #e2ded0;
          --line-soft: #ebe7db;
          --accent: #2f5d50;
          --accent-soft: #e6efe9;
          --stamp: #ad4632;
          --stamp-hover: #953b2a;
          --success: #2f7d52;
          --success-bg: #eaf5ee;
          --error: #ad4632;
          --error-bg: #fbece8;
          background: var(--paper);
          color: var(--ink);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          min-height: 100vh;
          height: 100vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .sm-page {
          max-width: 78rem;
          margin: 0 auto;
          padding: 1.5rem 1.25rem 2.5rem;
          display: flex;
          flex-direction: column;
          min-height: 100%;
        }
        @media (min-width: 768px) {
          .sm-page { padding: 2rem 2.5rem 3rem; }
        }

        .sm-topbar {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .sm-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sm-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: var(--ink);
          color: #fff;
        }
        .sm-wordmark {
          font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
          font-size: 1.15rem;
          letter-spacing: 0.01em;
          color: var(--ink);
        }
        .sm-tagline {
          font-size: 0.75rem;
          color: var(--ink-soft);
        }

        .sm-panels {
          flex: 1;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr;
          box-shadow: 0 1px 2px rgba(36, 38, 31, 0.04);
        }
        @media (min-width: 1024px) {
          .sm-panels { grid-template-columns: minmax(0, 380px) 1fr; }
        }

        /* Compose Panel */
        .sm-compose {
          background: var(--surface-2);
          border-bottom: 1px solid var(--line);
          padding: 1.375rem 1.375rem 1.25rem;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 1024px) {
          .sm-compose {
            border-bottom: none;
            border-right: 1px dashed var(--line);
            padding: 1.5rem 1.5rem 1.375rem;
          }
        }

        .sm-compose-fields { flex: 1; }
        .sm-block + .sm-block { margin-top: 1.15rem; }

        .sm-block-title {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--ink-faint);
          letter-spacing: 0.02em;
          margin-bottom: 0.5rem;
        }

        .sm-label {
          display: block;
          font-size: 0.6875rem;
          color: var(--ink-soft);
          margin-bottom: 0.25rem;
        }

        .sm-field + .sm-field { margin-top: 0.6rem; }

        .sm-input, .sm-textarea {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0.45rem 0.65rem;
          font-size: 0.8125rem;
          line-height: 1.35;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .sm-input::placeholder, .sm-textarea::placeholder { color: var(--ink-faint); }
        .sm-input:focus, .sm-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .sm-textarea { resize: vertical; line-height: 1.45; }

        .sm-chips {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }
        .sm-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 0.28rem 0.28rem 0.28rem 0.5rem;
          border-radius: 999px;
          font-size: 0.6875rem;
          color: var(--ink-soft);
          max-width: 100%;
        }
        .sm-chip span {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sm-chip button {
          display: inline-flex;
          color: var(--ink-faint);
          border-radius: 999px;
          padding: 2px;
          flex-shrink: 0;
        }
        .sm-chip button:hover { color: var(--stamp); background: var(--error-bg); }

        .sm-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: transparent;
          border: 1px dashed var(--line);
          border-radius: 999px;
          padding: 0.3rem 0.6rem;
          font-size: 0.6875rem;
          color: var(--ink-soft);
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .sm-upload-btn:hover { border-color: var(--accent); color: var(--accent); }

        .sm-hint {
          font-size: 0.6875rem;
          color: var(--ink-faint);
          margin-top: 0.4rem;
        }

        .sm-generate-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background: var(--stamp);
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.65rem 1rem;
          border-radius: 10px;
          transition: background 0.15s ease, transform 0.1s ease;
          margin-top: 1.25rem;
          flex-shrink: 0;
        }
        .sm-generate-btn:hover:not(:disabled) { background: var(--stamp-hover); }
        .sm-generate-btn:active:not(:disabled) { transform: scale(0.99); }
        .sm-generate-btn:disabled {
          background: var(--line);
          color: var(--ink-faint);
          cursor: not-allowed;
        }

        /* Preview Panel */
        .sm-preview-col {
          display: flex;
          flex-direction: column;
          min-height: 420px;
          padding: 1.5rem;
          background: linear-gradient(var(--surface), var(--surface)) padding-box;
        }
        @media (min-width: 768px) {
          .sm-preview-col { padding: 1.75rem 2.25rem; }
        }

        .sm-empty, .sm-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0.6rem;
          padding: 2rem 1rem;
        }
        .sm-empty { color: var(--ink-faint); }
        .sm-empty-icon, .sm-loading-icon {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.15rem;
        }
        .sm-empty-icon {
          background: var(--surface-2);
          border: 1px solid var(--line);
          color: var(--ink-faint);
        }
        .sm-empty-title { font-size: 0.8125rem; color: var(--ink-soft); font-weight: 500; }
        .sm-empty-sub { font-size: 0.75rem; color: var(--ink-faint); max-width: 260px; }

        .sm-loading { color: var(--ink-soft); }
        .sm-loading-icon {
          background: var(--accent-soft);
          color: var(--accent);
          animation: sm-pulse 1.4s ease-in-out infinite;
        }
        @keyframes sm-pulse {
          0%, 100% { opacity: 0.55; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sm-loading-icon { animation: none; }
        }
        .sm-loading-text { font-size: 0.8125rem; }

        .sm-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: var(--error-bg);
          border: 1px solid #eeccc0;
          color: var(--error);
          border-radius: 9px;
          padding: 0.7rem 0.85rem;
          font-size: 0.78125rem;
          margin-bottom: 1rem;
        }
        .sm-retry-link {
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .sm-letter {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          animation: sm-fade-in 0.3s ease;
        }
        @keyframes sm-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sm-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--success-bg);
          color: var(--success);
          font-size: 0.72rem;
          font-weight: 500;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          margin-bottom: 1rem;
          width: fit-content;
        }

        .sm-letter-header {
          border: 1px solid var(--line);
          border-radius: 10px 10px 0 0;
          border-bottom: none;
          background: var(--surface-2);
        }
        .sm-letter-line {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
          padding: 0.5rem 0.85rem;
        }
        .sm-letter-line + .sm-letter-line { border-top: 1px solid var(--line-soft); }
        .sm-letter-line-label {
          font-size: 0.72rem;
          color: var(--ink-faint);
          width: 3.4rem;
          flex-shrink: 0;
        }
        .sm-letter-line input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.85rem;
          color: var(--ink);
          font-family: inherit;
          padding: 0.1rem 0;
          min-width: 0;
        }
        .sm-letter-line input::placeholder { color: var(--ink-faint); }

        .sm-letter-body-wrap {
          border: 1px solid var(--line);
          border-radius: 0 0 10px 10px;
          padding: 1.1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 220px;
          background: #ffffff;
        }

        .sm-letter-body {
          width: 100%;
          border: none;
          outline: none;
          resize: vertical;
          background: transparent;
          font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
          font-size: 0.9375rem;
          line-height: 1.75;
          color: var(--ink);
          min-height: 180px;
          flex: 1;
        }

        /* Preview Attachments Section below body */
        .sm-preview-attachments {
          margin-top: 1rem;
          padding-top: 0.9rem;
          border-top: 1px dashed var(--line);
        }

        .sm-preview-att-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.6rem;
        }

        .sm-preview-att-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .sm-preview-att-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 0.35rem 0.6rem;
          font-size: 0.72rem;
          color: var(--ink);
        }

        .sm-preview-att-pill .att-name {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .sm-preview-att-pill .att-size {
          font-size: 0.65rem;
          color: var(--ink-faint);
        }

        .sm-preview-att-pill button {
          display: inline-flex;
          align-items: center;
          color: var(--ink-faint);
          padding: 1px;
          border-radius: 999px;
          transition: color 0.15s;
        }

        .sm-preview-att-pill button:hover {
          color: var(--stamp);
          background: var(--error-bg);
        }

        /* Toolbar */
        .sm-letter-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          margin-top: 1rem;
        }
        .sm-tool-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .sm-tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--ink-soft);
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 7px;
          padding: 0.4rem 0.65rem;
          transition: border-color 0.15s ease, color 0.15s ease;
          cursor: pointer;
        }
        .sm-tool-btn:hover { border-color: var(--accent); color: var(--accent); }
        .sm-tool-btn.copied { color: var(--success); border-color: var(--success); }

        .sm-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background: var(--accent);
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.6rem 1.15rem;
          border-radius: 9px;
          transition: background 0.15s ease, transform 0.1s ease;
          flex-shrink: 0;
          cursor: pointer;
        }
        .sm-send-btn:hover:not(:disabled) { background: #204a3e; }
        .sm-send-btn:active:not(:disabled) { transform: scale(0.99); }
        .sm-send-btn:disabled {
          background: var(--line);
          color: var(--ink-faint);
          cursor: not-allowed;
        }

        .sm-spin { animation: sm-spin 0.8s linear infinite; }
        @keyframes sm-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .sm-spin { animation: none; }
        }

        .sm-sent-banner {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--success-bg);
          color: var(--success);
          border-radius: 9px;
          padding: 0.6rem 0.85rem;
          font-size: 0.78125rem;
          margin-top: 0.75rem;
        }

        .sm-send-error-banner {
          margin-top: 0.75rem;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

function ComposePanel({
  formData,
  attachments,
  canGenerate,
  status,
  onChange,
  onUpload,
  onRemoveAttachment,
  onGenerate,
}) {
  return (
    <div className="sm-compose">
      <div className="sm-compose-fields">
        <div className="sm-block">
          <div className="sm-block-title">Recipient &amp; subject</div>
          <div className="sm-field">
            <span className="sm-label">Recipient email</span>
            <input
              type="email"
              name="receiver"
              placeholder="recipient@example.com"
              value={formData.receiver}
              onChange={onChange}
              className="sm-input"
            />
          </div>
          <div className="sm-field">
            <span className="sm-label">Subject</span>
            <input
              type="text"
              name="subject"
              placeholder="e.g. AI Developer Intern application"
              value={formData.subject}
              onChange={onChange}
              className="sm-input"
            />
          </div>
        </div>

        <div className="sm-block">
          <div className="sm-block-title">What it's about</div>
          <textarea
            name="description"
            rows={4}
            placeholder="Give the key points, context, or instructions — the AI will shape these into a full email."
            value={formData.description}
            onChange={onChange}
            className="sm-textarea"
          />
        </div>

        <div className="sm-block">
          <div className="sm-block-title">Sign-off details</div>
          <textarea
            name="contact"
            rows={2}
            placeholder={'Name\nPhone\nAddress'}
            value={formData.contact}
            onChange={onChange}
            className="sm-textarea"
          />
          <p className="sm-hint">Added exactly as written, under the closing line.</p>
        </div>

        <div className="sm-block">
          <div className="sm-block-title">Attachments</div>
          <div className="sm-chips">
            {attachments.map((file, i) => (
              <span key={i} className="sm-chip">
                {file.type?.startsWith('image/') ? (
                  <ImageIcon size={12} />
                ) : (
                  <FileText size={12} />
                )}
                <span>{file.name}</span>
                <button type="button" onClick={() => onRemoveAttachment(i)}>
                  <X size={11} />
                </button>
              </span>
            ))}
            <label className="sm-upload-btn">
              <UploadCloud size={12} />
              Add file
              <input type="file" multiple onChange={onUpload} className="hidden" />
            </label>
          </div>
          <p className="sm-hint">Attached files will be dispatched along with this email.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="sm-generate-btn"
      >
        <Feather size={14} />
        {status === 'loading' ? 'Generating…' : 'Generate email'}
      </button>
    </div>
  );
}

function PreviewPanel({
  status,
  errorMessage,
  preview,
  copied,
  onPreviewChange,
  onRegenerate,
  onCopy,
  onDownload,
  sendStatus,
  sendErrorMessage,
  onSend,
  attachments = [],
  onRemoveAttachment,
}) {
  const canSend = preview.to.trim().length > 0 && preview.body.trim().length > 0 && sendStatus !== 'sending';

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="sm-preview-col">
      {status === 'error' && (
        <div className="sm-error-banner">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <div>{errorMessage || 'Something went wrong while generating the email.'}</div>
            <button type="button" onClick={onRegenerate} className="sm-retry-link">
              Try again
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="sm-loading">
          <span className="sm-loading-icon">
            <Feather size={18} />
          </span>
          <span className="sm-loading-text">Drafting your email…</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="sm-empty">
          <span className="sm-empty-icon">
            <Feather size={18} />
          </span>
          <span className="sm-empty-title">Your generated email will appear here</span>
          <span className="sm-empty-sub">
            Fill in the subject and a short description on the left, then generate a draft to edit here.
          </span>
        </div>
      )}

      {(status === 'success' || status === 'error') && preview.body && (
        <div className="sm-letter">
          {status === 'success' && (
            <span className="sm-status-pill">
              <Check size={12} /> Draft ready — edit freely below
            </span>
          )}

          <div className="sm-letter-header">
            <div className="sm-letter-line">
              <span className="sm-letter-line-label">To</span>
              <input
                value={preview.to}
                placeholder="recipient@example.com"
                onChange={(e) => onPreviewChange({ ...preview, to: e.target.value })}
              />
            </div>
            <div className="sm-letter-line">
              <span className="sm-letter-line-label">Subject</span>
              <input
                value={preview.subject}
                placeholder="No subject yet"
                onChange={(e) => onPreviewChange({ ...preview, subject: e.target.value })}
              />
            </div>
          </div>

          <div className="sm-letter-body-wrap">
            <textarea
              className="sm-letter-body"
              value={preview.body}
              onChange={(e) => onPreviewChange({ ...preview, body: e.target.value })}
            />

            {/* Attached files displayed below email body */}
            {attachments.length > 0 && (
              <div className="sm-preview-attachments">
                <div className="sm-preview-att-header">
                  <Paperclip size={13} />
                  <span>Attachments ({attachments.length})</span>
                </div>
                <div className="sm-preview-att-list">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="sm-preview-att-pill">
                      {file.type?.startsWith('image/') ? (
                        <ImageIcon size={13} className="text-[#2f5d50]" />
                      ) : (
                        <FileText size={13} className="text-[#2f5d50]" />
                      )}
                      <span className="att-name" title={file.name}>
                        {file.name}
                      </span>
                      <span className="att-size">({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(idx)}
                        title="Remove file"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sm-letter-toolbar">
            <div className="sm-tool-group">
              <button type="button" className={`sm-tool-btn ${copied ? 'copied' : ''}`} onClick={onCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="sm-tool-btn" onClick={onDownload}>
                <Download size={13} />
                Download .txt
              </button>
              <button type="button" className="sm-tool-btn" onClick={onRegenerate}>
                <RefreshCw size={13} />
                Regenerate
              </button>
            </div>

            <button
              type="button"
              onClick={onSend}
              disabled={canSend ? false : true}
              className="sm-send-btn"
            >
              {sendStatus === 'sending' ? (
                <Loader2 size={15} className="sm-spin" />
              ) : (
                <Send size={15} />
              )}
              {sendStatus === 'sending' ? 'Sending…' : 'Send email'}
            </button>
          </div>

          {sendStatus === 'sent' && (
            <div className="sm-sent-banner">
              <Check size={14} />
              Sent to <strong>{preview.to}</strong>
            </div>
          )}

          {sendStatus === 'error' && (
            <div className="sm-error-banner sm-send-error-banner">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <div>{sendErrorMessage || 'Something went wrong while sending the email.'}</div>
                <button type="button" onClick={onSend} className="sm-retry-link">
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}