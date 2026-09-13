import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EmailGenerator from './components/EmailGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState('sent');

  return (
    <div className="flex h-screen w-screen bg-[#070a10] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Right View */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'sent' ? (
          <EmailGenerator />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Inbox is currently empty.
          </div>
        )}
      </main>
    </div>
  );
}