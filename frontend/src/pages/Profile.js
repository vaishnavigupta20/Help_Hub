// src/pages/Profile.js - 100% WORKING WITH EDIT
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // ✅ CHECK TOKEN FIRST
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 Profile token:', token ? 'EXISTS' : 'MISSING'); // DEBUG

    if (!token) {
      navigate('/login');
      return;
    }

    // ✅ FETCH USER FROM BACKEND
    fetchUserProfile(token);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/user/me', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('🔍 Profile response:', data); // DEBUG

      if (data.success && data.user) {
        setUser(data.user);
        setForm(data.user);
      } else {
        console.error('Profile fetch failed:', data.error);
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (err) {
      console.error('Profile network error:', err);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    setSaving(true);

    try {
      const response = await fetch('http://localhost:5000/api/user/me', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(form);
        setEditing(false);
        alert('✅ Profile updated successfully!');
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '28px' }}>🔒 Login Required</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Please login to view profile</p>
          <button 
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white', padding: '16px 32px', borderRadius: '12px',
              border: 'none', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px 0', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px 24px' 
      }}>
        {/* HEADER */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '40px',
          background: 'white',
          padding: '40px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            width: '80px', height: '80px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'white'
          }}>
            👤
          </div>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            color: '#1f2937', 
            marginBottom: '8px' 
          }}>
            {user.name || 'Your Name'}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '18px',
            marginBottom: '16px'
          }}>
            {user.role} • Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
          </p>
          
          {/* EDIT BUTTONS */}
          {!editing ? (
            <button 
              onClick={handleEdit}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 32px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
              }}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
              <button 
                onClick={handleCancel}
                style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* PERSONAL INFO */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#1f2937', 
              marginBottom: '24px' 
            }}>
              Personal Info
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
                  Full Name
                </label>
                {editing ? (
                  <input
                    name="name"
                    value={form.name || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    {user.name || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
                  Email
                </label>
                {editing ? (
                  <input
                    name="email"
                    value={form.email || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    {user.email || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
                  Phone
                </label>
                {editing ? (
                  <input
                    name="phone"
                    value={form.phone || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '16px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#111827',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    {user.phone || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', color: '#6b7280', fontWeight: '500', marginBottom: '8px' }}>
                  Role
                </label>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#059669',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '12px'
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVITY */}
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#1f2937', 
              marginBottom: '24px' 
            }}>
              Your Activity
            </h3>
            <div style={{ 
              padding: '24px', 
              background: '#f8fafc', 
              borderRadius: '16px', 
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No requests yet</div>
              <div style={{ fontSize: '14px' }}>Make your first help request to see activity here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}