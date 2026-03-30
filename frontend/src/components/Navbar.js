// src/components/Navbar.js - ✅ ADMIN READY
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken"); // ✅ ADMIN CHECK
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!token;
  const isAdmin = !!adminToken; // ✅ ADMIN DETECTION
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken"); // ✅ ADMIN LOGOUT
    navigate('/');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    navigate('/admin-login');
  };

  return (
    <nav
      style={{
        background: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: "16px 0",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: "24px",
            fontWeight: "800",
            color: "#111827",
            textDecoration: "none"
          }}
        >
          🙏 HelpHub
        </Link>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {/* Public Links */}
          <Link
            to="/donate"
            style={{
              color: "#3b82f6",
              textDecoration: "none",
              fontWeight: "600"
            }}
          >
            Donate
          </Link>

          {isLoggedIn ? (
            <>
              {/* User Links */}
              <Link
                to="/request-help"
                style={{
                  color: "#111827",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
              >
                Request Help
              </Link>
              <Link
                to="/status"
                style={{
                  color: "#10b981",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
              >
                My Status
              </Link>
              <Link
                to="/available-requests"
                style={{
                  color: "#f59e0b",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
              >
                Available Requests
              </Link>
              <Link
                to="/profile"
                style={{
                  color: "#8b5cf6",
                  textDecoration: "none",
                  fontWeight: "500"
                }}
              >
                Profile
              </Link>

              {/* ✅ ADMIN PANEL LINK - Only visible when adminToken exists */}
              {isAdmin && (
                <Link
                  to="/admin"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    textDecoration: "none",
                    fontWeight: "700",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  🛠️ Admin Panel
                </Link>
              )}

              <span
                style={{
                  color: "#6b7280",
                  fontSize: "14px"
                }}
              >
                {userData.name || userData.email}
                {isAdmin && " 👑"}
              </span>

              <button
                onClick={handleLogout}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  color: "#3b82f6",
                  textDecoration: "none",
                  fontWeight: "600"
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  background: "#3b82f6",
                  color: "white",
                  padding: "10px 20px",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: "600"
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
