import React from 'react';

const LoginPage = ({ onLogin }) => {
  return (
    <div id="login-view">
      <div className="login-container">
        <h1>Enterprise Co-Pilot</h1>
        <p className="subtext">The single source of truth for your organization.</p>
        <button className="btn btn-primary login-btn" onClick={() => onLogin('user')}>Log in as a User</button>
        <button className="btn btn-secondary login-btn" onClick={() => onLogin('admin')}>Log in as an Admin</button>
      </div>
    </div>
  );
};

export default LoginPage;
