// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin/ngos' : '/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
          Welcome Back
        </h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '36px' }}>Sign in to your HelpHub account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{
                width: '100%', padding: '16px 20px', border: '2px solid #e5e7eb', borderRadius: '12px',
                fontSize: '16px', background: '#f9fafb'
              }}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                width: '100%', padding: '16px 20px', border: '2px solid #e5e7eb', borderRadius: '12px',
                fontSize: '16px', background: '#f9fafb'
              }}
              required
            />
          </div>
          {error && (
            <div style={{
              padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white', padding: '18px', border: 'none', borderRadius: '12px',
              fontSize: '18px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <Link to="/signup" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}