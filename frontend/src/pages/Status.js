// src/pages/Status.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Status() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (user) {
      const fetchMyRequests = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("http://localhost:5000/api/requests/my", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            const myRequestsFormatted = data.requests.map(req => ({
              id: req._id,
              title: req.description.substring(0, 50) + "...",
              type: req.help_type,
              location: req.location,
              date: new Date(req.created_at).toLocaleDateString("en-IN", {
                weekday: "short",
                hour: "numeric",
                minute: "numeric"
              }),
              priority: req.priority,
              status: req.status || "Pending",
              description: req.description,
              contact: req.contact
            }));
            setMyRequests(myRequestsFormatted);
          }
        } catch (error) {
          console.error("Failed to fetch my requests:", error);
        }
      };

      fetchMyRequests();
    }
  }, [user]);

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px"
        }}
      >
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0 }}>
            My Status
          </h1>
          <p style={{ color: "#6b7280", fontSize: "18px", margin: "8px 0 0 0" }}>
            Track your requests and help history, {user?.name}
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
            fontWeight: "600"
          }}
        >
          + New Request
        </Link>
      </div>

      {/* My Requests Section */}
      <div style={{ marginBottom: "48px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px"
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827" }}>
            My Requests ({myRequests.length})
          </h2>
        </div>

        {myRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>
            <p style={{ fontSize: "18px" }}>No requests yet</p>
            <Link
              to="/request-help"
              style={{ color: "#667eea", fontWeight: "600" }}
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
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#111827",
                        margin: "0 0 4px 0"
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
                        flexWrap: "wrap"
                      }}
                    >
                      <span>📍 {req.location}</span>
                      <span>🏷️ {req.type}</span>
                      <span>📅 {req.date}</span>
                      {req.priority !== "Medium" && (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            background:
                              req.priority === "High"
                                ? "#fee2e2"
                                : "#dbeafe",
                            color:
                              req.priority === "High"
                                ? "#dc2626"
                                : "#1e40af"
                          }}
                        >
                          {req.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: req.status === "Resolved ✅" ? "#059669" : "#d97706",
                      background: req.status === "Resolved ✅" ? "#f0fdf4" : "#fef3c7"
                    }}
                  >
                    {req.status || "Pending"}
                  </span>
                </div>

                <p style={{ color: "#4b5563", fontSize: "14px", margin: "4px 0 8px 0" }}>
                  📝 {req.description || "No description provided"}
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
