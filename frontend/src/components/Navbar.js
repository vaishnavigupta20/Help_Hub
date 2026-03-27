// src/components/Navbar.js - Add auth buttons
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      background: 'white', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
      padding: '16px 0', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontSize: '24px', fontWeight: '800', color: '#111827', textDecoration: 'none' }}>
          🙏 HelpHub
        </Link>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/donate" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>Donate</Link>
          <Link to="/request-help" style={{ color: '#111827', textDecoration: 'none', fontWeight: '500' }}>Request Help</Link>
          
          {user ? (
            <>
              <span style={{ color: '#6b7280' }}>👋 {user.name}</span>
              <button 
                onClick={handleLogout}
                style={{
                  background: '#ef4444', color: 'white', padding: '10px 20px',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>Login</Link>
              <Link to="/signup" style={{ 
                background: '#3b82f6', color: 'white', padding: '10px 20px',
                textDecoration: 'none', borderRadius: '8px', fontWeight: '600'
              }}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}