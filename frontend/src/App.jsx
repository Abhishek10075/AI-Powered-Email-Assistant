import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EmailGenerator from './components/EmailGenerator';
import Inbox from './components/Inbox';
import Login from './components/Login';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('smartmail_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('inbox');
  const [composeDefaults, setComposeDefaults] = useState(null);

  const handleLoginSuccess = (userData) => {
    sessionStorage.setItem('smartmail_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('smartmail_user');
    setUser(null);
    setActiveTab('inbox');
  };

  const handleStartCompose = (data) => {
    setComposeDefaults(data);
    setActiveTab('sent');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#070a10] overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={user.email}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'inbox' ? (
          <Inbox user={user} onComposeAction={handleStartCompose} />
        ) : (
          <EmailGenerator user={user} initialData={composeDefaults} />
        )}
      </main>
    </div>
  );
}