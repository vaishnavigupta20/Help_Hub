// src/pages/AvailableRequests.js - ✅ FIXED: Real User Names + Contact Info
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AvailableRequests() {
  const { user } = useAuth();
  const [availableRequests, setAvailableRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    searchText: "",
  });
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [loadingAccept, setLoadingAccept] = useState({});
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    let filtered = availableRequests.filter((req) => {
      const matchesType = newFilters.type === "all" || req.type === newFilters.type;
      const matchesStatus = newFilters.status === "all" || req.status === newFilters.status;
      const matchesSearch =
        newFilters.searchText === "" ||
        req.title?.toLowerCase().includes(newFilters.searchText.toLowerCase()) ||
        req.location?.toLowerCase().includes(newFilters.searchText.toLowerCase());

      return matchesType && matchesStatus && matchesSearch;
    });
    setFilteredRequests(filtered);
  };

  useEffect(() => {
    if (user) {
      const fetchAvailableRequests = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");

          const params = new URLSearchParams({
            type: filters.type,
            status: filters.status,
            search: filters.searchText,
          });

          const response = await fetch(
            `${API_BASE}/api/requests/unresolved?${params}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          const data = await response.json();
          if (data.success) {
            const otherUsersRequests = data.requests.map((req) => ({
              _id: req._id,
              id: req._id,
              title: req.description.length > 50 ? req.description.substring(0, 50) + "..." : req.description,
              type: req.help_type || req.type || "general",
              help_type: req.help_type || req.type || "general",
              location: req.location || "Not specified",
              priority: req.priority || "Medium",
              status: req.status || "Pending",
              description: req.description,
              fullDescription: req.description,
              requester_name: req.requester_name || req.requesterName || "Anonymous User",
              requester_phone: req.requester_phone || req.requesterPhone,
              requester_email: req.requester_email || req.requesterEmail,
              photo: req.photo,
              contact: req.contact,
              created_at: req.created_at,
              createdDate: req.createdDate || req.created_at,
            }));

            setAvailableRequests(otherUsersRequests);
            setFilteredRequests(otherUsersRequests);
          }
        } catch (error) {
          console.error("Failed to fetch available requests:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAvailableRequests();
    }
  }, [user]);

  const acceptAndResolveRequest = async (requestId) => {
    setLoadingAccept((prev) => ({ ...prev, [requestId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/api/requests/${requestId}/resolve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            helperId: user.id,
            helperName: user.name,
            status: "Resolved ✅",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        alert("✅ Request marked as RESOLVED! Thank you for helping.");
        setAvailableRequests((prev) => prev.filter((req) => req._id !== requestId));
        setFilteredRequests((prev) => prev.filter((req) => req._id !== requestId));
        setExpandedRequest(null);
      }
    } catch (error) {
      alert("Failed to resolve request. Try again.");
    } finally {
      setLoadingAccept((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const toggleDetails = (req) => {
    setExpandedRequest(expandedRequest?._id === req._id ? null : req);
  };

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔄</div>
        <h2>Loading requests...</h2>
        <p>Fetching help requests from HelpHub network</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Available Requests
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: "8px 0 0 0" }}>
            Help others in need ({filteredRequests.length})
          </p>
        </div>
        <Link
          to="/request-help"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          ➕ New Request
        </Link>
      </div>

      {/* Available Requests List */}
      <div>
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", background: "#f8fafc", borderRadius: "20px", border: "2px dashed #d1d5db" }}>
            <div style={{ fontSize: "48px", marginBottom: "24px", color: "#10b981" }}>📭</div>
            <h3 style={{ color: "#111827", margin: "0 0 12px 0", fontSize: "24px" }}>
              {filters.searchText || filters.type !== "all" || filters.status !== "all"
                ? "No requests match your filters"
                : "No available requests right now"}
            </h3>
            <p style={{ color: "#6b7280", fontSize: "16px", margin: 0 }}>
              {filters.searchText || filters.type !== "all" || filters.status !== "all"
                ? "Try adjusting your filters"
                : "Check back soon for new help requests"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {filteredRequests.map((req) => (
              <div
                key={req._id || req.id}
                style={{
                  padding: "24px",
                  border: `2px solid ${req.priority === "High" ? "#ef4444" : "#f59e0b"}`,
                  borderRadius: "16px",
                  background: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "20px", fontWeight: "700", color: req.priority === "High" ? "#dc2626" : "#d97706", margin: 0 }}>
                        🆘 {req.type}
                      </h3>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: req.priority === "High" ? "#fee2e2" : "#dbeafe",
                        color: req.priority === "High" ? "#dc2626" : "#1e40af",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}>
                        {req.priority}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "16px", color: "#6b7280", fontSize: "14px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <span>📍 {req.location}</span>
                      <span>👤 {req.requester_name}</span> {/* ✅ REAL USER NAME */}
                      {req.status && <span>📊 {req.status}</span>}
                    </div>

                    <p style={{ color: "#374151", margin: "0 0 12px 0", lineHeight: "1.6", fontSize: "15px" }}>
                      {req.description?.substring(0, 120)}...
                    </p>

                    {req.created_at && (
                      <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                        Posted {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      onClick={() => toggleDetails(req)}
                      style={{
                        padding: "12px 20px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ MODAL: Real Names + Enhanced Contact Section BEFORE Posted Date */}
      {expandedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && setExpandedRequest(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              maxWidth: "600px",
              maxHeight: "90vh",
              width: "100%",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            {/* Header */}
            <div style={{ padding: "30px 30px 20px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
                  🆘 Request Details
                </h2>
                <button
                  onClick={() => setExpandedRequest(null)}
                  style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280", padding: 0 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                <span style={{
                  padding: "6px 16px",
                  background: expandedRequest.priority === "High" ? "#fee2e2" : "#dbeafe",
                  color: expandedRequest.priority === "High" ? "#dc2626" : "#1e40af",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}>
                  {expandedRequest.priority}
                </span>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>📍 {expandedRequest.location}</span>
                <span style={{ color: "#6b7280", fontSize: "14px" }}>👤 {expandedRequest.requester_name}</span> {/* ✅ REAL USER NAME */}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "30px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 16px 0" }}>
                {expandedRequest.type}
              </h3>

              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
                <p style={{ color: "#374151", lineHeight: "1.6", fontSize: "16px", margin: 0, whiteSpace: "pre-wrap" }}>
                  {expandedRequest.description || expandedRequest.fullDescription}
                </p>
              </div>

              {/* ✅ ENHANCED CONTACT SECTION - BEFORE Posted Date */}
              {(expandedRequest.requester_phone || expandedRequest.requester_email) && (
                <div style={{
                  margin: "20px 0",
                  padding: "20px",
                  background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                  borderRadius: "16px",
                  border: "1px solid #bfdbfe",
                }}>
                  <div style={{
                    fontSize: "15px",
                    color: "#1e40af",
                    fontWeight: "600",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    📞 Contact Details
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#1e3a8a", marginBottom: "4px" }}>
                    {expandedRequest.requester_name}
                  </div>
                  <div style={{ fontSize: "16px", color: "#1e40af", marginBottom: "8px" }}>
                    {expandedRequest.requester_phone || expandedRequest.requester_email}
                  </div>
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>
                    Tap to call/message after accepting
                  </div>
                </div>
              )}

              {/* Posted Date - AFTER Contact */}
              {expandedRequest.created_at && (
                <div style={{ color: "#6b7280", fontSize: "14px", marginBottom: "30px" }}>
                  Posted on {new Date(expandedRequest.created_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Accept Button */}
            <div style={{ padding: "24px 30px 30px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <button
                onClick={() => acceptAndResolveRequest(expandedRequest._id)}
                disabled={loadingAccept[expandedRequest._id]}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: loadingAccept[expandedRequest._id] ? "#9ca3af" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "700",
                  cursor: loadingAccept[expandedRequest._id] ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.4)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!loadingAccept[expandedRequest._id]) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(16,185,129,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 14px rgba(16,185,129,0.4)";
                }}
              >
                {loadingAccept[expandedRequest._id] ? (
                  <>
                    <span>✅ Accepting...</span>
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "20px",
                      height: "20px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                  </>
                ) : (
                  `Help`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
