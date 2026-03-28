// src/pages/HelpList.js - ✅ BLOOD + PERFECT NO LOOP
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link} from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
// import Filter from '../components/Filter'; // ✅ COMMENTED OUT

export default function HelpList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingResolve, setLoadingResolve] = useState({});

  const typeFilter = searchParams.get('type') || 'all';

  // ✅ BLOOD + ANIMAL + GENERAL - SINGLE API CALL
  useEffect(() => {
    if (!user || !localStorage.getItem('token')) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // ✅ BLOOD SUPPORT ADDED
        let endpoint;
        if (typeFilter === 'animal_rescue') endpoint = '/api/requests/animal';
        else if (typeFilter === 'blood') endpoint = '/api/requests/blood';  // 🩸 NEW
        else endpoint = '/api/requests/unresolved';
        
        console.log(`📡 Fetching ${typeFilter}: ${endpoint}`);
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📡 Data:', data);
        
        if (data.success) {
          const formatted = data.requests.map(req => ({
            _id: req._id,
            title: req.description?.substring(0, 60) + '...',
            type: req.help_type || req.type || 'general',
            location: req.location || 'Unknown',
            priority: req.priority || 'Medium',
            status: req.status || 'Pending',
            description: req.description,
            requester_name: req.requester_name || 'Anonymous'
          }));
          setAllRequests(formatted);
          setFilteredRequests(formatted);
        }
      } catch (error) {
        console.error("❌ Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, typeFilter]); // ✅ Stable - NO LOOP

  // ✅ Simple client filter (no Filter component needed)
  const applyFilters = () => {
    return allRequests.filter(req => {
      // Auto-filter by type from URL
      if (typeFilter !== 'all' && req.type !== typeFilter) return false;
      return true;
    });
  };

  const markResolved = async (requestId) => {
    setLoadingResolve(prev => ({ ...prev, [requestId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/requests/${requestId}/resolve`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ status: "Resolved ✅" })
      });
      
      if (response.ok) {
        setAllRequests(prev => prev.filter(req => req._id !== requestId));
        setFilteredRequests(prev => prev.filter(req => req._id !== requestId));
        alert('✅ Thank you for helping the community!');
      } else {
        alert('Failed to resolve');
      }
    } catch (error) {
      console.error('Resolve error:', error);
      alert('Network error');
    } finally {
      setLoadingResolve(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const currentRequests = applyFilters();

  if (loading) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
        <h2>Loading requests...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* ✅ BLOOD TITLE SUPPORT */}
      <h1 style={{ fontSize: '32px', textAlign: 'center', color: '#111827', marginBottom: '20px' }}>
        {typeFilter === 'animal_rescue' ? '🐾 Animal Rescue Requests' :
         typeFilter === 'blood' ? '🩸 Blood Donation Requests' :
         'Active Help Requests'}
      </h1>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '18px', marginBottom: '40px' }}>
        {currentRequests.length} requests need your help
      </p>
      
      {/* Filter commented out to prevent loops */}
      {/* <Filter ... /> */}
      
      {currentRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          <h2>🎉 No requests right now!</h2>
          <p>Check back soon or <Link to="/request-help" style={{color: '#3b82f6'}}>request help</Link></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {currentRequests.map(req => (
            <div key={req._id} style={{
              padding: '24px',
              border: `2px solid ${req.type === 'blood' ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '16px',
              background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
                    {req.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>📍 {req.location}</span>
                    <span>🏷️ {req.type}</span>
                    <span>⭐ {req.priority}</span>
                  </div>
                  {req.requester_name && (
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: '8px 0 0 0' }}>
                      👤 {req.requester_name}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => markResolved(req._id)}
                  disabled={loadingResolve[req._id]}
                  style={{
                    background: loadingResolve[req._id] 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '12px 28px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: loadingResolve[req._id] ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
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
