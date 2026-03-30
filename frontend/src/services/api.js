// src/services/api.js

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const getHeaders = () => ({
  "Content-Type": "application/json",
});

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
};

// ================= USER SERVICE =================

const userService = {
  signup: async ({ name, email, password, role = "user", phone = "" }) => {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password, role, phone }),
    });
    return handleResponse(res);
  },

  login: async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  getUser: async () => {
    const res = await fetch(`${API_BASE}/api/user/me`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};

// ================= REQUEST SERVICE =================

const requestService = {
  listRequests: async () => {
    const res = await fetch(`${API_BASE}/api/requests/unresolved`, {
      headers: authHeaders(),
    });
    const data = await handleResponse(res);
    return data.requests || [];
  },

  getMyRequests: async () => {
    const res = await fetch(`${API_BASE}/api/requests/my`, {
      headers: authHeaders(),
    });
    const data = await handleResponse(res);
    return data.requests || [];
  },

  createRequest: async (reqData) => {
    const res = await fetch(`${API_BASE}/api/requests`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(reqData),
    });
    return handleResponse(res);
  },

  resolveRequest: async (id, data = {}) => {
    const res = await fetch(`${API_BASE}/api/requests/${id}/resolve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ================= DONATION SERVICE =================

const donationService = {
  // Donation routes not yet implemented in backend
  listDonations: async () => [],
  createDonation: async () => ({ success: false, error: "Not implemented" }),
};

// ================= MODULE EXPORT =================

export default {
  userService,
  requestService,
  donationService,
};
