import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import ChatbotPage from './pages/ChatbotPage';
import AdminPanelPage from './pages/AdminPanelPage';
import './App.css';

const App = () => {
  const [view, setView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (role) => {
    setCurrentUser({ name: role === 'admin' ? 'Admin User' : 'Standard User', role });
    setView(role);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  return (
    <div className="app-view">
      {view === 'login' && <LoginPage onLogin={handleLogin} />}
      {view === 'user' && <ChatbotPage user={currentUser} onLogout={handleLogout} />}
      {view === 'admin' && <AdminPanelPage user={currentUser} onLogout={handleLogout} onViewUser={() => setView('user')} />}
    </div>
  );
};

export default App;
