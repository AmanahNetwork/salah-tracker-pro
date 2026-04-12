import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Logo from './components/Logo'; // Your new branding component
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in on page load
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <>
          {/* REFINED NAVIGATION */}
          <nav style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '10px 40px', 
            background: 'rgba(15, 23, 42, 0.9)', // Slightly darker for logo contrast
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            {/* BRANDING SECTION */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Logo height={60} /> 
            </div>
            
            {/* USER ACTIONS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                Welcome, <strong style={{ color: '#f59e0b' }}>{localStorage.getItem('username')}</strong>
              </span>
              
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Logout
              </button>
            </div>
          </nav>

          <Dashboard />
        </>
      ) : (
        /* If not logged in, show Auth screen */
        <Auth onLogin={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}

export default App;