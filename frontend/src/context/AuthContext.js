// src/context/AuthContext.js - FIXED NETWORK ERROR
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Use CONSISTENT token key 'token' everywhere
  useEffect(() => {
    const token = localStorage.getItem('token');  // ← FIXED: was 'userToken'
    if (token) {
      fetch(`${API_BASE}/api/user/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token invalid');
      })
      .then(data => {
        setUser(data);  // ← Backend returns full user object
      })
      .catch(() => {
        localStorage.removeItem('token');  // ← FIXED: consistent key
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ FIXED: Use proxy URL + consistent token key
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      
      // ✅ FIXED: Store with 'token' key (matches useEffect)
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
      
    } catch (error) {
      return { success: false, error: 'Network error. Check backend on port 5000' };
    }
  };

  // ✅ FIXED: Use proxy URL consistently
  const signup = async (name, email, password, role, phone) => {
    try {
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data;
      
    } catch (error) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');  // ← FIXED: consistent key
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
