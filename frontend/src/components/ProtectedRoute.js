import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdminAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '100px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (adminOnly) {
    if (!isAdminAuthenticated && (!user || user.role !== 'admin')) {
      return <Navigate to="/admin-login" replace state={{ from: location }} />;
    }
    return children;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
