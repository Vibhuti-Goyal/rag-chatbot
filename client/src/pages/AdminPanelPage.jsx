import React, { useState } from 'react';

const AdminPanelPage = ({ user, onLogout, onViewUser }) => {
  const [adminPage, setAdminPage] = useState('dashboard-content');

  const renderAdminPage = () => {
    switch (adminPage) {
      case 'dashboard-content': return <h1 className="page-title">Dashboard</h1>;
      case 'datasources-content': return <h1 className="page-title">Data Sources</h1>;
      case 'users-content': return <h1 className="page-title">Users & Roles</h1>;
      case 'analytics-content': return <h1 className="page-title">Analytics</h1>;
      case 'settings-content': return <h1 className="page-title">Settings</h1>;
      default: return <h1 className="page-title">Not Found</h1>;
    }
  };

  return (
    <div id="admin-view">
      <aside className="admin-sidebar">
        <h1>Co-Pilot Admin</h1>
        <nav>
          <ul>
            <li><a href="#" className={adminPage === 'dashboard-content' ? 'active' : ''} onClick={() => setAdminPage('dashboard-content')}>📊 Dashboard</a></li>
            <li><a href="#" className={adminPage === 'datasources-content' ? 'active' : ''} onClick={() => setAdminPage('datasources-content')}>📚 Data Sources</a></li>
            <li><a href="#" className={adminPage === 'users-content' ? 'active' : ''} onClick={() => setAdminPage('users-content')}>👥 Users & Roles</a></li>
            <li><a href="#" className={adminPage === 'analytics-content' ? 'active' : ''} onClick={() => setAdminPage('analytics-content')}>📈 Analytics</a></li>
            <li><a href="#" className={adminPage === 'settings-content' ? 'active' : ''} onClick={() => setAdminPage('settings-content')}>⚙️ Settings</a></li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p>{`Logged in: ${user?.name}`}</p>
          <a href="#" onClick={onViewUser}>👩‍💻 View Co-Pilot</a>
          <a href="#" onClick={onLogout}>🚪 Logout</a>
        </div>
      </aside>
      <main className="admin-content">
        {renderAdminPage()}
      </main>
    </div>
  );
};

export default AdminPanelPage;
