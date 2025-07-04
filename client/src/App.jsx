import React, { useState } from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';

const App = () => {
  return (
    <div className="app-container">
      <Outlet />
    </div>
  );
};

export default App;
