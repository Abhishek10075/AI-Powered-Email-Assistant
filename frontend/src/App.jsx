import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EmailGenerator from './components/EmailGenerator';
import Inbox from './components/Inbox';

export default function App() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [composeDefaults, setComposeDefaults] = useState(null);

  const handleStartCompose = (data) => {
    setComposeDefaults(data);
    setActiveTab('sent');
  };

  return (
    <div className="flex h-screen w-screen bg-[#070a10] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'inbox' ? (
          <Inbox onComposeAction={handleStartCompose} />
        ) : (
          <EmailGenerator initialData={composeDefaults} />
        )}
      </main>
    </div>
  );
}