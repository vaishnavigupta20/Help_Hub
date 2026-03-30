// src/pages/Status.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Status() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const token = localStorage.getItem("token");

        if (!token) {
          setErrorMsg("Please login again.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/requests/my`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          setErrorMsg(data.error || "Failed to fetch requests.");
          setLoading(false);
          return;
        }

        const myRequestsFormatted = (data.requests || []).map((req) => ({
          id: req._id || req.id,
          title: req.description
            ? req.description.length > 50
              ? req.description.substring(0, 50) + "..."
              : req.description
            : "Help Request",
          type: req.help_type || req.type || "Other",
          location: req.location || "Location not available",
          date: req.created_at
            ? new Date(req.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Date unavailable",
          priority: req.priority || "Medium",
          status: req.status || "Pending",
          description: req.description || "No description provided",
          contact: req.contact || "",
        }));

        setMyRequests(myRequestsFormatted);
      } catch (error) {
        console.error("Failed to fetch my requests:", error);
        setErrorMsg("Failed to fetch my requests.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
        };
      case "High":
        return {
          background: "#fee2e2",
          color: "#dc2626",
        };
      case "Low":
        return {
          background: "#ecfdf5",
          color: "#059669",
        };
      default:
        return {
          background: "#f3f4f6",
          color: "#4b5563",
        };
    }
  };

  const getStatusStyle = (status) => {
    const normalized = status.toLowerCase();

    if (normalized.includes("resolved")) {
      return {
        color: "#059669",
        background: "#f0fdf4",
      };
    }

    if (normalized.includes("in progress")) {
      return {
        color: "#2563eb",
        background: "#dbeafe",
      };
    }

    return {
      color: "#d97706",
      background: "#fef3c7",
    };
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0 }}>
            My Status
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: "8px 0 0 0" }}>
            Track your requests and help history{user?.name ? `, ${user.name}` : ""}
          </p>
        </div>

        <Link
          to="/request-help"
          style={{
            background: "#2563eb",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          + New Request
        </Link>
      </div>

      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}>
            My Requests ({myRequests.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
            <p style={{ fontSize: "18px" }}>Loading requests...</p>
          </div>
        ) : errorMsg ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#dc2626" }}>
            <p style={{ fontSize: "18px" }}>{errorMsg}</p>
          </div>
        ) : myRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
            <p style={{ fontSize: "18px" }}>No requests yet</p>
            <Link
              to="/request-help"
              style={{ color: "#2563eb", fontWeight: "600" }}
            >
              Create your first request
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {myRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  padding: "24px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  background: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#111827",
                        margin: "0 0 4px 0",
                      }}
                    >
                      {req.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        color: "#6b7280",
                        fontSize: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>📍 {req.location}</span>
                      <span>🏷️ {req.type}</span>
                      <span>📅 {req.date}</span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          ...getPriorityStyle(req.priority),
                        }}
                      >
                        {req.priority}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      ...getStatusStyle(req.status),
                    }}
                  >
                    {req.status}
                  </span>
                </div>

                <p style={{ color: "#4b5563", fontSize: "14px", margin: "4px 0 8px 0" }}>
                  📝 {req.description}
                </p>

                {req.contact && (
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                    📞 {req.contact}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
