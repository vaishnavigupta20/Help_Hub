// src/components/ProtectedRoute.js - ✅ COMBINED & PERFECT
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const adminToken = localStorage.getItem('adminToken');

  // ✅ Loading state
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '100px', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (adminOnly) {
    if (!adminToken && (!user || user.role !== 'admin')) {
      return <Navigate to="/admin-login" replace />;
    }
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
