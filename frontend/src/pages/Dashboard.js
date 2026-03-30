// src/pages/Dashboard.js - Dynamic Requests with Filters
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHelp, setLoadingHelp] = useState({});
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    search: '',
  });

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/requests/unresolved?type=all&status=Pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const mappedRequests = data.requests.map((req) => ({
          id: req._id,
          type: req.help_type || req.type || 'general',
          title:
            req.description.length > 50
              ? req.description.substring(0, 50) + '...'
              : req.description,
          description: req.description,
          location: req.location || 'Not specified',
          priority: req.priority || 'Medium',
          contact: req.requester_phone || req.requester_email || 'N/A',
          requester_name: req.requester_name || 'Anonymous',
          created_at: req.created_at,
        }));
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = async (request) => {
    setLoadingHelp((prev) => ({ ...prev, [request.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/requests/${request.id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          helperId: user.id,
          helperName: user.name,
          status: 'Resolved ✅',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `✅ "${request.title}" marked RESOLVED!\nContact: ${request.contact}\nThank you ${user?.name}! 🎉`
        );
        setRequests((prev) => prev.filter((r) => r.id !== request.id));
      } else {
        alert('Failed to resolve request. Try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Error resolving request.');
    } finally {
      setLoadingHelp((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  const applyFilters = () => {
    let temp = [...requests];
    // Filter by type
    if (filters.type !== 'all') temp = temp.filter((r) => r.type === filters.type);
    // Filter by priority
    if (filters.priority !== 'all') temp = temp.filter((r) => r.priority === filters.priority);
    // Filter by search
    if (filters.search.trim() !== '') {
      const s = filters.search.toLowerCase();
      temp = temp.filter(
        (r) =>
          r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s)
      );
    }
    setFilteredRequests(temp);
  };

  if (!isLoggedIn) return <div>Please log in</div>;
  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading requests...</div>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>
            HelpHub Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '18px', margin: '8px 0 0 0' }}>
            Hi, <strong>{user?.name}</strong>! Ready to help?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/request-help"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
            }}
          >
            + Request Help
          </Link>
          <button
            onClick={logout}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        >
          <option value="all">All Types</option>
          <option value="food">Food</option>
          <option value="medicine">Medicine</option>
          <option value="clothes">Clothes</option>
          <option value="blood">Blood</option>
          <option value="animal_rescue">Animal Rescue</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        >
          <option value="all">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />
      </div>

      {/* Requests List */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Help Requests Near You ({filteredRequests.length})
          </h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>Browse and help those in need</p>
        </div>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {filteredRequests.map((request) => (
            <div key={request.id} style={{ padding: '24px 32px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: request.priority === 'Urgent' ? '#fef2f2' : request.priority === 'High' ? '#fef3c7' : '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                color: request.priority === 'Urgent' ? '#dc2626' : request.priority === 'High' ? '#d97706' : '#16a34a',
              }}>
                {request.type === 'food' ? '🍚' : request.type === 'clothes' ? '👕' : request.type === 'medicine' ? '💊' : request.type === 'blood' ? '🩸' : request.type === 'animal_rescue' ? '🐕' : '🙏'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    background: '#eff6ff',
                    color: '#1e40af',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {request.type.replace('_', ' ')}
                  </span>
                  <span style={{
                    color: request.priority === 'Urgent' ? '#dc2626' : request.priority === 'High' ? '#d97706' : '#059669',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}>
                    {request.priority}
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>{request.title}</h3>
                <p style={{ color: '#6b7280', margin: '0 0 12px 0', fontSize: '16px' }}>{request.description}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#374151' }}>
                  <span>📍 {request.location}</span>
                  <span>📞 {request.contact}</span>
                  <span style={{ color: '#6b7280' }}>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => handleHelp(request)}
                disabled={loadingHelp[request.id]}
                style={{
                  background: loadingHelp[request.id] ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: loadingHelp[request.id] ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {loadingHelp[request.id] ? 'Processing...' : 'I Can Help!'}
              </button>
            </div>
          ))}
          {filteredRequests.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No requests found.</div>}
        </div>
      </div>
    </div>
  );
}
