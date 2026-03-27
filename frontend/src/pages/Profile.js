// src/pages/Profile.js
import React from "react";
import useAuth from "../hooks/useAuth";

// Dummy stats; you’ll later fetch from backend
const PROFILE_STATS = {
  total_requests: 3,
  completed_requests: 2,
  donations: 5,
};

export default function Profile() {
  const { user, isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="container">
        <h2>Profile</h2>
        <p>Please <a href="/login">login</a> to view your profile.</p>
      </div>
    );
  }

  const formattedDate = new Date(user?.createdAt || "")
    .toISOString()
    .slice(0, 10);

  return (
    <div className="container">
      <h2>Profile</h2>

      <div className="auth-container">
        <h3>Personal Info</h3>
        <p><strong>Name:</strong> {user?.name || "Unknown"}</p>
        <p><strong>Email:</strong> {user?.email || "Unknown"}</p>
        <p><strong>Role:</strong> {user?.role || "User"}</p>
        <p><strong>Phone:</strong> {user?.phone || "Not set"}</p>
        <p><strong>Joined on:</strong> {formattedDate}</p>
      </div>

      <h3>Your Activity</h3>
      <div className="features">
        <div className="feature-card">
          <h3>Requests</h3>
          <p>Total: {PROFILE_STATS.total_requests}</p>
          <p>Completed: {PROFILE_STATS.completed_requests}</p>
        </div>
        <div className="feature-card">
          <h3>Donations</h3>
          <p>Donated items/blood: {PROFILE_STATS.donations}</p>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={logout}
        >
          Logout
        </button>
        <button className="btn btn-outline">
          Edit Profile
        </button>
      </div>
    </div>
  );
}