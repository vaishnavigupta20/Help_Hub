// ✅ CORRECT HelpList.js (React ONLY)
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import Filter from '../components/Filter';

export default function HelpList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({ type: 'all', status: 'all', searchText: '' });
  const [loading, setLoading] = useState(true);
  const [loadingResolve, setLoadingResolve] = useState({});
  const API_BASE = process.env.REACT_APP_API_BASE;

  const typeFilter = searchParams.get('type') || 'all';

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = requests.filter(req => {
      const matchesType = newFilters.type === 'all' || req.type === newFilters.type;
      const matchesStatus = newFilters.status === 'all' || req.status === newFilters.status;
      const matchesSearch = !newFilters.searchText || 
        req.title?.toLowerCase().includes(newFilters.searchText.toLowerCase()) ||
        req.location?.toLowerCase().includes(newFilters.searchText.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    });
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, typeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const endpoint = typeFilter === 'animal_rescue' ? '/api/requests/animal' : '/api/requests/unresolved';
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        const formattedRequests = data.requests.map(req => ({
          _id: req._id,
          title: req.description?.substring(0, 60) + '...' || 'Help Request',
          type: req.help_type || req.type || 'general',
          location: req.location || 'Unknown',
          priority: req.priority || 'Medium',
          status: req.status || 'Pending',
          resolved: req.status === 'Resolved ✅',
          description: req.description,
          requester_name: req.requester_name || 'Anonymous'
        }));
        setRequests(formattedRequests);
        setFilteredRequests(formattedRequests);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  };

  const markResolved = async (requestId) => {
    setLoadingResolve(prev => ({ ...prev, [requestId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/requests/${requestId}/resolve`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          helperId: user.id,
          helperName: user.name || user.email,
          status: "Resolved ✅"
        })
      });
      
      if (response.ok) {
        setRequests(prev => prev.filter(req => req._id !== requestId));
        setFilteredRequests(prev => prev.filter(req => req._id !== requestId));
        alert('✅ Thank you for helping!');
      }
    } catch (error) {
      alert('Failed to resolve. Try again.');
    } finally {
      setLoadingResolve(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', textAlign: 'center', color: '#111827' }}>
        {typeFilter === 'animal_rescue' ? '🐾 Animal Help Requests' : 'Active Help Requests'}
      </h1>
      
      <Filter onFilterChange={handleFilterChange} defaultFilters={filters} />
      
      {filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <h2>🎉 No requests right now!</h2>
          <p>Check back soon or create a new request</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {filteredRequests.map((req) => (
            <div key={req._id} style={{
              padding: '24px',
              border: '2px solid #e5e7eb',
              borderRadius: '16px',
              background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
                    {req.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', color: '#6b7280' }}>
                    <span>📍 {req.location}</span>
                    <span>🏷️ {req.type}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => markResolved(req._id)}
                  disabled={loadingResolve[req._id]}
                  style={{
                    background: loadingResolve[req._id] ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '12px 28px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: loadingResolve[req._id] ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loadingResolve[req._id] ? 'Resolving...' : 'I Can Help!'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
