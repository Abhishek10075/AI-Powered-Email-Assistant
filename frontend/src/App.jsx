import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EmailGenerator from './components/EmailGenerator';
import Inbox from './components/Inbox';

export default function App() {
  const [activeTab, setActiveTab] = useState('inbox'); // Default inbox khulega

  return (
    <div className="flex h-screen w-screen bg-[#070a10] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Right View */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'inbox' ? <Inbox /> : <EmailGenerator />}
      </main>
    </div>
  );
}