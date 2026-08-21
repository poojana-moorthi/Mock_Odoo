import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Factory,
  Archive,
  Activity,
  Shield,
  LogOut,
  User
} from 'lucide-react';

export default function Sidebar() {
  const { currentUser, role, logout, hasRole, canWrite } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'Products',
      path: '/products',
      icon: Package,
      show: hasRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser')
    },
    {
      name: 'Sales',
      path: '/sales',
      icon: ShoppingCart,
      show: hasRole('Admin', 'SalesUser', 'BusinessOwner')
    },
    {
      name: 'Purchase',
      path: '/purchase',
      icon: Truck,
      show: hasRole('Admin', 'PurchaseUser', 'BusinessOwner')
    },
    {
      name: 'Manufacturing',
      path: '/manufacturing',
      icon: Factory,
      show: hasRole('Admin', 'ManufacturingUser', 'BusinessOwner')
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: Archive,
      show: hasRole('Admin', 'InventoryManager', 'BusinessOwner')
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: Activity,
      show: hasRole('Admin')
    }
  ];

  return (
    <aside className="erp-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-box">
          <img src="/shiv_logo.png" alt="Shiv Furniture" className="brand-logo-img" />
        </div>
        <div className="brand-text-group">
          <span className="brand-name">Shiv Furniture</span>
          <span className="brand-sub">Mini ERP</span>
        </div>
      </div>

      <div className="sidebar-user-card">
        <div className="user-avatar-circle">
          <User size={18} />
        </div>
        <div className="user-card-info">
          <span className="user-card-name">{currentUser?.full_name || 'User'}</span>
          <span className="user-card-role">
            <Shield size={12} className="role-icon" /> {role}
          </span>
          {!canWrite() && (
            <span className="readonly-tag">Read-Only Access</span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">MODULES</div>
        {navItems.filter(item => item.show).map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="sidebar-logout-btn">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
