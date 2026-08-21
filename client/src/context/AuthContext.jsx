import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const normalizeRole = (roleStr) => {
  if (!roleStr) return '';
  const cleaned = roleStr.replace(/\s+/g, '').toLowerCase();
  if (cleaned === 'admin' || cleaned === 'administrator') return 'Admin';
  if (cleaned === 'salesuser' || cleaned === 'sales') return 'SalesUser';
  if (cleaned === 'purchaseuser' || cleaned === 'purchase') return 'PurchaseUser';
  if (cleaned === 'manufacturinguser' || cleaned === 'manufacturing') return 'ManufacturingUser';
  if (cleaned === 'inventorymanager' || cleaned === 'inventory') return 'InventoryManager';
  if (cleaned === 'businessowner' || cleaned === 'owner') return 'BusinessOwner';
  return roleStr;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = (user, authToken) => {
    localStorage.setItem('token', authToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    setToken(authToken);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken('');
    setCurrentUser(null);
  };

  const role = currentUser ? normalizeRole(currentUser.role_name || currentUser.role) : '';

  const hasRole = (...allowedRoles) => {
    if (!currentUser) return false;
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return normalizedAllowed.includes(role);
  };

  const canWrite = () => {
    if (!currentUser) return false;
    // BusinessOwner is read-only across all modules
    return role !== 'BusinessOwner';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        token,
        role,
        loading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        hasRole,
        canWrite
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
