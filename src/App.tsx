import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Home from './components/home';
import LoginPage from './components/login';
import RegisterPage from './components/register';

type Page = 'login' | 'register' | 'home';

function App() {
  // Simple state-based routing — no react-router-dom needed
  // Keep the user logged in across refreshes while a token is present.
  const [page, setPage] = useState<Page>(() =>
    localStorage.getItem('auth_token') ? 'home' : 'login'
  );

  const handleNavigate = (target: 'login' | 'register' | 'home') => {
    setPage(target);
  };

  const renderPage = () => {
    if (page === 'register') {
      return <RegisterPage onNavigate={handleNavigate} />;
    }

    if (page === 'home') {
      return <Home onNavigate={handleNavigate} />;
    }

    // Default: login
    return <LoginPage onNavigate={handleNavigate} />;
  };

  return (
    <>
      {renderPage()}
      <ToastContainer position="top-right" autoClose={3000} newestOnTop={false} theme="colored" />
    </>
  );
}

export default App;
