import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import ConsumerPortal from './pages/ConsumerPortal';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#060B14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    </div>
  );
  if (!user || !profile) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify" element={<ConsumerPortal />} />

          {/* Protected – dashboard shell */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
