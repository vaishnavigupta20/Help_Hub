// src/App.js - ✅ CORRECT UPDATED VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// ✅ USER PAGES
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import RequestHelp from './pages/RequestHelp';
import Donate from './pages/Donate';
import AnimalRescue from './pages/AnimalRescue';
import HelpList from './pages/HelpList';
import Status from './pages/Status';
import Profile from './pages/Profile';
import AvailableRequests from './pages/AvailableRequests';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// ✅ ADMIN PAGES
import AdminLogin from './pages/AdminLogin';
import AdminNGOs from './pages/AdminNGOs';

function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '/helphub' : '/'}>
      <AuthProvider>
        <div className="App">
          <Navbar />

          <main className="container">
            <Routes>
              {/* ✅ PUBLIC ROUTES */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/animal-rescue" element={<AnimalRescue />} />
              <Route path="/help-list" element={<HelpList />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              {/* ✅ REDIRECT ROUTES */}
              <Route path="/blood-network" element={<Navigate to="/help-list?type=blood" replace />} />
              <Route path="/request" element={<Navigate to="/help-list" replace />} />

              {/* ✅ PROTECTED USER ROUTES */}
              <Route
                path="/request-help"
                element={
                  <ProtectedRoute>
                    <RequestHelp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/status"
                element={
                  <ProtectedRoute>
                    <Status />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/available-requests"
                element={
                  <ProtectedRoute>
                    <AvailableRequests />
                  </ProtectedRoute>
                }
              />

              {/* ✅ ADMIN ONLY ROUTES */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminNGOs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ngos"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminNGOs />
                  </ProtectedRoute>
                }
              />

              {/* ✅ 404 ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;