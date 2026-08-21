import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => r.replace(/\s+/g, '').toLowerCase());
    const userRoleNormalized = role.replace(/\s+/g, '').toLowerCase();

    if (!normalizedAllowed.includes(userRoleNormalized)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
