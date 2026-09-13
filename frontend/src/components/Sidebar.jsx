import React from 'react';
import { Send, Inbox, Mail, Settings } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col justify-between p-4 h-full select-none">
      <div>
        {/* App Branding */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="p-2 bg-indigo-600 rounded-lg shadow">
            <Mail size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white tracking-wide text-sm">SmartMail AI</h1>
            <p className="text-[10px] text-slate-400">MAIL WORKSPACE</p>
          </div>
        </div>

        {/* Menu Buttons */}
        <nav className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition ${
              activeTab === 'inbox' 
                ? 'bg-[#1a2035] text-white font-medium shadow-sm' 
                : 'text-slate-400 hover:bg-[#141a2c] hover:text-slate-200'
            }`}
          >
            <Inbox size={18} />
            <span>Inbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition ${
              activeTab === 'sent' 
                ? 'bg-[#1a2035] text-white font-medium shadow-sm' 
                : 'text-slate-400 hover:bg-[#141a2c] hover:text-slate-200'
            }`}
          >
            <Send size={18} />
            <span>Sent</span>
          </button>
        </nav>
      </div>

      {/* Settings Bottom Area */}
      <div className="border-t border-slate-800 pt-3">
        <button
          type="button"
          className="flex items-center gap-3 text-slate-400 text-sm px-3.5 py-2 hover:text-slate-200 w-full rounded-lg transition hover:bg-[#141a2c]"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}