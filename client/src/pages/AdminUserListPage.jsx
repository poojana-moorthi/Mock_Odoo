import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
  Search,
  LayoutList,
  Flag,
  User,
  Shield,
  LogOut,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function AdminUserListPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [tooltip, setTooltip] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get('/api/admin/users');
      if (response.data?.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load users list from server');
    } finally {
      setLoading(false);
    }
  };

  const showFeatureNotice = (featureName) => {
    setTooltip(`${featureName}: Coming soon`);
    setTimeout(() => setTooltip(''), 2500);
  };

  const filteredUsers = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="erp-page-layout">
      <Sidebar />

      <main className="erp-page-content" style={{ padding: 0 }}>
        {/* Top Bar: App logo/name centered, user avatar top-right */}
        <header className="admin-user-list-topbar">
          <div className="topbar-spacer"></div>

          <div className="topbar-brand-center">
            <div className="logo-box-sm">
              <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image-sm" />
            </div>
            <span className="brand-title">Shiv Furniture Works</span>
          </div>

          <div className="topbar-avatar-container">
            <button
              className="topbar-avatar-btn"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              title="Account Menu"
            >
              <div className="avatar-circle-sm">
                <User size={18} />
              </div>
            </button>

            {showAccountMenu && (
              <div className="account-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{currentUser?.full_name || 'Admin'}</strong>
                  <span>{currentUser?.email || 'admin@shivfurniture.com'}</span>
                </div>
                <button className="dropdown-item logout" onClick={logout}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="user-list-page-container">
          {tooltip && (
            <div className="feature-toast">
              <span>{tooltip}</span>
            </div>
          )}

          {/* Toolbar Row */}
          <div className="toolbar-row">
            <div className="search-box-large">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input-large"
                placeholder="Search users by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="toolbar-actions">
              <button
                className="toolbar-btn active"
                onClick={() => showFeatureNotice('List View')}
                title="List View"
              >
                <LayoutList size={16} />
              </button>
              <button
                className="toolbar-btn"
                onClick={() => showFeatureNotice('Report / Flagging')}
                title="Reports & Flags"
              >
                <Flag size={16} />
              </button>
            </div>
          </div>

          <div className="user-list-card">
            <div className="user-list-card-header">
              <h2 className="user-list-title">
                <User size={20} className="title-icon" /> System Administrators & Users Directory
              </h2>
              <span className="users-count-badge">{filteredUsers.length} Users</span>
            </div>

            {errorMsg && (
              <div className="alert alert-error" style={{ margin: '1.5rem' }}>
                <AlertCircle size={16} />
                <div>{errorMsg}</div>
              </div>
            )}

            {loading ? (
              <div className="loading-spinner-box">
                <div className="spinner"></div>
                <span>Loading users from database...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-users-state">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="vertical-users-list">
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    className="user-row-item"
                    onClick={() => navigate(`/admin/users/${u.id}`)}
                  >
                    <div className="user-row-avatar">
                      <User size={18} />
                    </div>
                    <div className="user-row-info">
                      <span className="user-row-name">{u.name}</span>
                      <span className="user-row-position">{u.position || u.role || 'System Employee'}</span>
                    </div>
                    <div className="user-row-meta">
                      <span className="user-row-email">{u.email}</span>
                      <span className={`user-row-role-tag role-${(u.role || '').toLowerCase()}`}>
                        <Shield size={12} /> {u.role || 'User'}
                      </span>
                      <ChevronRight size={18} className="chevron-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
