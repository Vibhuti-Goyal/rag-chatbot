import React, { useState } from 'react';
import './App.css';
import { Outlet } from 'react-router-dom';
import { SummaryApi } from './common';
import { useDispatch } from 'react-redux';
import { setUserDetails } from './store/userSlice';
import { useEffect } from 'react';
import Context from './context';

const App = () => {
  const dispatch = useDispatch();
  const fetchUser = async () => {
    try {
      const response = await fetch(SummaryApi.FetchUser.url, {
        method: SummaryApi.FetchUser.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User data fetched:', data);
        if (data && data.data) {
          dispatch(setUserDetails(data.data));
          return data.data;
        } else {
          throw new Error('User data not found');
        }
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  };


  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div className="app-container">
      <Context.Provider value={{ fetchUser }}>
        <Outlet />
      </Context.Provider>
    </div>
  );
};

export default App;
