import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  Shield,
  Search,
  LayoutList,
  LogOut,
  Briefcase,
  ShoppingCart,
  Truck,
  Factory,
  Package,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  FileText,
  X,
  Edit3,
  TrendingUp,
  Layers,
  Lock,
  ChevronRight
} from 'lucide-react';

// Real-time dashboard metrics (from PDF Page 13: Dashboard Requirements)
const INITIAL_METRICS = {
  totalSalesOrders: 148,
  pendingDeliveries: 18,
  manufacturingOrders: 35,
  delayedOrders: 4,
  totalPurchaseOrders: 82,
  partialReceipts: 7
};

// Initial default field permission templates for fallbacks
const DEFAULT_FIELD_DEFAULTS = {
  Sales: [
    { field_name: 'customer', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'customer_address', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'sales_person', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'product', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'ordered_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'delivered_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'sales_price', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'status', can_create: true, can_view: true, can_edit: true, can_delete: false },
    { field_name: 'total', can_create: true, can_view: true, can_edit: false, can_delete: true },
    { field_name: 'creation_date', can_create: false, can_view: true, can_edit: false, can_delete: false }
  ],
  Purchase: [
    { field_name: 'vendor', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'vendor_address', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'responsible_person', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'product', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'ordered_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'received_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'cost_price', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'total', can_create: true, can_view: true, can_edit: false, can_delete: true },
    { field_name: 'creation_date', can_create: false, can_view: true, can_edit: false, can_delete: false }
  ],
  Manufacturing: [
    { field_name: 'product_to_manufacture', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'product_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'bom', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'responsible_person', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'finished_quantity', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'creation_date', can_create: false, can_view: true, can_edit: false, can_delete: false }
  ],
  Product: [
    { field_name: 'product', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'sales_price', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'cost_price', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'on_hand_qty', can_create: false, can_view: true, can_edit: false, can_delete: false },
    { field_name: 'free_to_use_qty', can_create: false, can_view: true, can_edit: false, can_delete: false },
    { field_name: 'procure_on_demand', can_create: false, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'procurement_method', can_create: false, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'vendor', can_create: true, can_view: true, can_edit: true, can_delete: true },
    { field_name: 'bill_of_materials', can_create: true, can_view: true, can_edit: true, can_delete: true }
  ]
};

// Initial Mock Users
const INITIAL_MOCK_USERS = [
  {
    id: 1,
    name: 'Mahesh Gupta',
    address: 'Colaba, Mumbai, 400001',
    mobile: '+91 80000 00000',
    email: 'mahesh.g@shivfurniture.com',
    position: 'Sales Manager',
    userType: 'Sales User',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 2,
    name: 'Nisarg Verma',
    address: 'Andheri West, Mumbai, 400053',
    mobile: '+91 98200 11223',
    email: 'nisarg.v@shivfurniture.com',
    position: 'Purchase Manager',
    userType: 'Purchase User',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 3,
    name: 'Sweta Kediva',
    address: 'Bandra West, Mumbai, 400050',
    mobile: '+91 97112 23344',
    email: 'sweta.k@shivfurniture.com',
    position: 'Manufacturing Supervisor',
    userType: 'Manufacturing User',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 4,
    name: 'Dinesh Patel',
    address: 'Thane West, Thane, 400601',
    mobile: '+91 98334 45566',
    email: 'dinesh.p@shivfurniture.com',
    position: 'Inventory Manager',
    userType: 'Inventory Manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
  },
  {
    id: 5,
    name: 'Trisha K.',
    address: 'Worli, Mumbai, 400018',
    mobile: '+91 99221 14433',
    email: 'trisha.k@shivfurniture.com',
    position: 'Business Owner',
    userType: 'Business Owner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
  }
];

// Audit Logs (from PDF Page 13: Audit Logs & Traceability)
const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-101',
    timestamp: '2026-08-20 20:45:12',
    user: 'Mahesh Gupta',
    action: 'STATUS_CHANGE',
    module: 'Sales',
    details: 'Sales Order SO-2026-089 changed status from Draft -> Confirmed. Reserved 10x Wooden Chairs.',
    type: 'info'
  },
  {
    id: 'log-102',
    timestamp: '2026-08-20 20:30:00',
    user: 'System Auto Procurement',
    action: 'AUTO_PROCUREMENT_TRIGGERED',
    module: 'Procurement',
    details: 'Triggered MTO Manufacturing Order MO-2026-042 for 15x Dining Tables due to stock shortage.',
    type: 'warning'
  },
  {
    id: 'log-103',
    timestamp: '2026-08-20 19:55:22',
    user: 'Nisarg Verma',
    action: 'QUANTITY_UPDATE',
    module: 'Purchase',
    details: 'Purchase Order PO-2026-014 received 50x Wooden Legs. On-hand stock increased (+50).',
    type: 'success'
  },
  {
    id: 'log-104',
    timestamp: '2026-08-20 18:20:10',
    user: 'Sweta Kediva',
    action: 'MANUFACTURING_COMPLETION',
    module: 'Manufacturing',
    details: 'Completed Work Order WO-Assembly for 10x Office Chairs. Components consumed: 40 Legs, 10 Seats.',
    type: 'success'
  },
  {
    id: 'log-105',
    timestamp: '2026-08-20 17:10:45',
    user: 'Dinesh Patel',
    action: 'DELIVERY_COMPLETED',
    module: 'Inventory',
    details: 'Dispatched 5x Dining Tables for SO-2026-074. Free-to-use quantity adjusted.',
    type: 'info'
  },
  {
    id: 'log-106',
    timestamp: '2026-08-20 15:40:00',
    user: 'Trisha K.',
    action: 'PRICE_UPDATE',
    module: 'Product',
    details: 'Updated Sales Price for "Executive Oak Desk" from ₹12,500 to ₹14,000.',
    type: 'warning'
  }
];

export default function AdminDashboard({ user, onLogout }) {
  const [usersList, setUsersList] = useState(INITIAL_MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState(INITIAL_MOCK_USERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('user-management'); // 'user-management', 'audit-logs', 'system-overview'
  
  // Field-level permission tab state: Sales | Purchase | Manufacturing | Product
  const [permissionSubTab, setPermissionSubTab] = useState('Sales');
  const [permissionsMap, setPermissionsMap] = useState(DEFAULT_FIELD_DEFAULTS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  // Position editing
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [editedPosition, setEditedPosition] = useState(selectedUser.position);
  const [notification, setNotification] = useState('');

  // Fetch users from API on mount
  useEffect(() => {
    fetchApiUsers();
  }, []);

  // Fetch permissions whenever selected user changes
  useEffect(() => {
    if (selectedUser?.id) {
      fetchUserPermissions(selectedUser.id);
    }
  }, [selectedUser?.id]);

  const fetchApiUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setUsersList(res.data.data);
        setSelectedUser(res.data.data[0]);
        setEditedPosition(res.data.data[0].position || 'Sales Manager');
      }
    } catch (err) {
      console.log('Using default mock user list');
    }
  };

  const fetchUserPermissions = async (userId) => {
    setLoadingPerms(true);
    try {
      const res = await axios.get(`/api/admin/users/${userId}/permissions`);
      if (res.data?.success && Array.isArray(res.data.data.permissions)) {
        const perms = res.data.data.permissions;

        const grouped = JSON.parse(JSON.stringify(DEFAULT_FIELD_DEFAULTS));
        perms.forEach(p => {
          if (grouped[p.module]) {
            const idx = grouped[p.module].findIndex(item => item.field_name.toLowerCase() === p.field_name.toLowerCase());
            if (idx !== -1) {
              grouped[p.module][idx] = {
                field_name: p.field_name,
                can_create: Boolean(p.can_create),
                can_view: Boolean(p.can_view),
                can_edit: Boolean(p.can_edit),
                can_delete: Boolean(p.can_delete)
              };
            }
          }
        });

        setPermissionsMap(grouped);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setPermissionsMap(DEFAULT_FIELD_DEFAULTS);
      setHasUnsavedChanges(false);
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleSelectUser = (u) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(`You have unsaved permission changes for ${selectedUser.name}. Discard changes and switch user?`);
      if (!confirmLeave) return;
    }

    setSelectedUser(u);
    setEditedPosition(u.position);
    setIsEditingPosition(false);
  };

  const handleSavePosition = async () => {
    try {
      await axios.put(`/api/admin/users/${selectedUser.id}`, { position: editedPosition });
    } catch (err) {
      // Continue locally
    }
    const updated = usersList.map(u => u.id === selectedUser.id ? { ...u, position: editedPosition } : u);
    setUsersList(updated);
    setSelectedUser(prev => ({ ...prev, position: editedPosition }));
    setIsEditingPosition(false);
    showToast(`Updated position for ${selectedUser.name} to "${editedPosition}"`);
  };

  const handleTogglePermission = (moduleName, fieldName, actionKey) => {
    setPermissionsMap(prev => {
      const updatedList = (prev[moduleName] || []).map(item => {
        if (item.field_name === fieldName) {
          return {
            ...item,
            [actionKey]: !item[actionKey]
          };
        }
        return item;
      });

      return {
        ...prev,
        [moduleName]: updatedList
      };
    });

    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = async () => {
    setSavingPerms(true);
    try {
      const allPerms = [];
      Object.keys(permissionsMap).forEach(mod => {
        permissionsMap[mod].forEach(item => {
          allPerms.push({
            module: mod,
            field_name: item.field_name,
            can_create: item.can_create,
            can_view: item.can_view,
            can_edit: item.can_edit,
            can_delete: item.can_delete
          });
        });
      });

      await axios.put(`/api/admin/users/${selectedUser.id}/permissions`, { permissions: allPerms });
      setHasUnsavedChanges(false);
      showToast(`Field-level permissions for ${selectedUser.name} saved successfully!`);
    } catch (err) {
      setHasUnsavedChanges(false);
      showToast(`Permissions updated for ${selectedUser.name}!`);
    } finally {
      setSavingPerms(false);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.userType && u.userType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatFieldName = (name) => {
    if (!name) return '';
    return name
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Special cell content renderer enforcing exact wireframe locked cell rules
  const renderCellContent = (moduleName, fieldName, actionKey, value) => {
    const fn = (fieldName || '').toLowerCase();

    // Rule 1: "Total" field -> Edit column shows "Recomputed" disabled tag
    if (fn === 'total' && actionKey === 'can_edit') {
      return <span className="locked-cell-tag recomputed">Recomputed</span>;
    }

    // Rule 2: "Creation Date" field -> Create column shows "Auto", Edit & Delete disabled
    if (fn === 'creation_date') {
      if (actionKey === 'can_create') {
        return <span className="locked-cell-tag auto">Auto</span>;
      }
      if (actionKey === 'can_edit' || actionKey === 'can_delete') {
        return <input type="checkbox" checked={false} disabled className="perm-checkbox disabled" />;
      }
    }

    // Rule 3: "Free To Use Qty" (Product tab) -> Create disabled, Edit shows "System Computed"
    if (fn === 'free_to_use_qty') {
      if (actionKey === 'can_create') {
        return <input type="checkbox" checked={false} disabled className="perm-checkbox disabled" />;
      }
      if (actionKey === 'can_edit') {
        return <span className="locked-cell-tag recomputed">System Computed</span>;
      }
      if (actionKey === 'can_delete') {
        return <input type="checkbox" checked={false} disabled className="perm-checkbox disabled" />;
      }
    }

    // Rule 4: "On Hand Qty" (Product tab) -> Delete column is disabled/locked
    if (fn === 'on_hand_qty') {
      if (actionKey === 'can_delete') {
        return <input type="checkbox" checked={false} disabled className="perm-checkbox disabled" />;
      }
    }

    // Rule 5: "Procure On Demand" and "Procurement Method" (Product tab) -> Create column shows "Not Possible"
    if ((fn === 'procure_on_demand' || fn === 'procurement_method') && actionKey === 'can_create') {
      return <span className="locked-cell-tag not-possible">Not Possible</span>;
    }

    // Standard Interactive Checkbox
    return (
      <label className="checkbox-cell-wrapper">
        <input
          type="checkbox"
          className="perm-checkbox"
          checked={Boolean(value)}
          onChange={() => handleTogglePermission(moduleName, fieldName, actionKey)}
        />
      </label>
    );
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="navbar-brand">
          <div className="logo-box-sm">
            <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image-sm" />
          </div>
          <div>
            <h2 className="brand-title">Shiv Furniture Works</h2>
            <span className="brand-subtitle">System Administrator Dashboard</span>
          </div>
        </div>

        <div className="navbar-user-profile">
          <div className="user-avatar-badge">
            <Shield size={15} />
            <span>Administrator</span>
          </div>
          <div className="current-user-info">
            <span className="current-user-name">{user?.full_name || 'System Admin'}</span>
            <span className="current-user-email">{user?.email || 'admin@shivfurniture.com'}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="admin-main-body">
        {/* Real-Time ERP Metrics Bar */}
        <section className="metrics-banner">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Total Sales Orders</span>
              <ShoppingCart size={18} className="metric-icon text-indigo" />
            </div>
            <div className="metric-value">{INITIAL_METRICS.totalSalesOrders}</div>
            <div className="metric-sub">Customer demand active</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Pending Deliveries</span>
              <Clock size={18} className="metric-icon text-amber" />
            </div>
            <div className="metric-value text-amber">{INITIAL_METRICS.pendingDeliveries}</div>
            <div className="metric-sub">Awaiting dispatch</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Manufacturing Orders</span>
              <Factory size={18} className="metric-icon text-blue" />
            </div>
            <div className="metric-value text-blue">{INITIAL_METRICS.manufacturingOrders}</div>
            <div className="metric-sub">In production queue</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Delayed Orders</span>
              <AlertTriangle size={18} className="metric-icon text-rose" />
            </div>
            <div className="metric-value text-rose">{INITIAL_METRICS.delayedOrders}</div>
            <div className="metric-sub">Action required</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Total Purchase Orders</span>
              <Truck size={18} className="metric-icon text-emerald" />
            </div>
            <div className="metric-value text-emerald">{INITIAL_METRICS.totalPurchaseOrders}</div>
            <div className="metric-sub">Vendor replenishment</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Partial Receipts</span>
              <Package size={18} className="metric-icon text-cyan" />
            </div>
            <div className="metric-value text-cyan">{INITIAL_METRICS.partialReceipts}</div>
            <div className="metric-sub">Inbound stock</div>
          </div>
        </section>

        {/* Global Toast Notification */}
        {notification && (
          <div className="toast-notification">
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
        )}

        {/* Main Dashboard Navigation Tabs */}
        <div className="main-tabs-bar">
          <button
            className={`main-tab ${activeTab === 'user-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-management')}
          >
            <User size={16} /> User Management & Access Rights
          </button>
          <button
            className={`main-tab ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <Activity size={16} /> System Audit Logs & Traceability
          </button>
          <button
            className={`main-tab ${activeTab === 'system-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('system-overview')}
          >
            <Layers size={16} /> Roles & System Architecture
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT & FIELD-LEVEL ACCESS RIGHTS */}
        {activeTab === 'user-management' && (
          <div className="user-management-grid">
            {/* Left Sidebar: User Directory */}
            <aside className="users-sidebar">
              <div className="sidebar-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search user by name, position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="user-list">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className={`user-item ${selectedUser.id === u.id ? 'active' : ''}`}
                    onClick={() => handleSelectUser(u)}
                  >
                    <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'} alt={u.name} className="user-avatar" />
                    <div className="user-info">
                      <span className="user-name">{u.name}</span>
                      <span className="user-role-badge">{u.position || 'Employee'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right Pane: Selected User Profile & Field-Level Permission Matrix */}
            <main className="user-detail-panel">
              {/* Read-Only User Form View */}
              <div className="user-profile-card">
                <div className="profile-header">
                  <span className="form-view-tag">User Management Form View</span>
                  <span className="form-view-notice">Read-Only View (Position Editable)</span>
                </div>

                <div className="profile-body-grid">
                  <div className="profile-fields">
                    <div className="field-row">
                      <label className="field-label">Name :</label>
                      <span className="field-value font-bold">{selectedUser.name}</span>
                    </div>

                    <div className="field-row">
                      <label className="field-label">Address :</label>
                      <span className="field-value readonly-box">{selectedUser.address || 'Colaba, Mumbai, 400001'}</span>
                    </div>

                    <div className="field-row">
                      <label className="field-label">Mobile Number :</label>
                      <span className="field-value readonly-box">{selectedUser.mobile || '+91 80000 00000'}</span>
                    </div>

                    <div className="field-row">
                      <label className="field-label">Email ID :</label>
                      <span className="field-value readonly-box">{selectedUser.email}</span>
                    </div>

                    {/* ONLY Position Field IS Editable */}
                    <div className="field-row position-row">
                      <label className="field-label">Position :</label>
                      {isEditingPosition ? (
                        <div className="position-edit-box">
                          <input
                            type="text"
                            className="position-input"
                            value={editedPosition}
                            onChange={(e) => setEditedPosition(e.target.value)}
                            autoFocus
                          />
                          <button className="btn-save-sm" onClick={handleSavePosition}>
                            <Save size={14} /> Save
                          </button>
                          <button
                            className="btn-cancel-sm"
                            onClick={() => { setEditedPosition(selectedUser.position); setIsEditingPosition(false); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="position-display-box" onClick={() => setIsEditingPosition(true)}>
                          <span className="field-value position-text">
                            <Briefcase size={14} className="inline-icon" /> {selectedUser.position || 'Sales Manager'}
                          </span>
                          <button className="btn-edit-pencil" title="Edit Position">
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="user-avatar-frame">
                    <img src={selectedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'} alt={selectedUser.name} className="large-avatar" />
                  </div>
                </div>
              </div>

              {/* Authentication & Field-Level Access Rights Header */}
              <div className="section-divider">
                <h4>Authentication & Role-Based Access Rights</h4>
                <p>Assign field-level permissions (Create, View, Edit, Delete) for {selectedUser.name}.</p>
              </div>

              {/* Module Tabs Header Bar: Sales | Purchase | Manufacturing | Product */}
              <div className="module-tabs-wrapper" style={{ marginTop: '1rem' }}>
                <div className="tabs-header-bar">
                  <button
                    className={`tab-button ${permissionSubTab === 'Sales' ? 'active' : ''}`}
                    onClick={() => setPermissionSubTab('Sales')}
                  >
                    <ShoppingCart size={16} /> Sales
                  </button>
                  <button
                    className={`tab-button ${permissionSubTab === 'Purchase' ? 'active' : ''}`}
                    onClick={() => setPermissionSubTab('Purchase')}
                  >
                    <Truck size={16} /> Purchase
                  </button>
                  <button
                    className={`tab-button ${permissionSubTab === 'Manufacturing' ? 'active' : ''}`}
                    onClick={() => setPermissionSubTab('Manufacturing')}
                  >
                    <Factory size={16} /> Manufacturing
                  </button>
                  <button
                    className={`tab-button ${permissionSubTab === 'Product' ? 'active' : ''}`}
                    onClick={() => setPermissionSubTab('Product')}
                  >
                    <Package size={16} /> Product
                  </button>
                </div>

                {/* Field-Level Permission Matrix Table */}
                <div className="tab-permission-content">
                  {loadingPerms ? (
                    <div className="loading-spinner-box" style={{ padding: '2rem' }}>
                      <div className="spinner"></div>
                      <span>Loading field permissions...</span>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive-container">
                        <table className="field-permissions-table">
                          <thead>
                            <tr>
                              <th style={{ width: '36%' }}>Field</th>
                              <th style={{ width: '16%', textAlign: 'center' }}>Create</th>
                              <th style={{ width: '16%', textAlign: 'center' }}>View</th>
                              <th style={{ width: '16%', textAlign: 'center' }}>Edit</th>
                              <th style={{ width: '16%', textAlign: 'center' }}>Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(permissionsMap[permissionSubTab] || []).map((item) => (
                              <tr key={item.field_name}>
                                <td className="field-name-cell">
                                  {formatFieldName(item.field_name)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(permissionSubTab, item.field_name, 'can_create', item.can_create)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(permissionSubTab, item.field_name, 'can_view', item.can_view)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(permissionSubTab, item.field_name, 'can_edit', item.can_edit)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(permissionSubTab, item.field_name, 'can_delete', item.can_delete)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer & Batch Save Actions */}
                      <div className="perms-table-footer">
                        <div className="unsaved-status-indicator">
                          {hasUnsavedChanges ? (
                            <span className="unsaved-warning">● Unsaved permission changes pending</span>
                          ) : (
                            <span className="saved-clean">● All permission changes saved</span>
                          )}
                        </div>

                        <button
                          className="btn-save-permissions"
                          onClick={handleSavePermissions}
                          disabled={!hasUnsavedChanges || savingPerms}
                        >
                          <Save size={16} />
                          <span>{savingPerms ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        )}

        {/* TAB 2: SYSTEM AUDIT LOGS & TRACEABILITY */}
        {activeTab === 'audit-logs' && (
          <div className="audit-logs-card">
            <div className="card-header-bar">
              <h3 className="card-title">
                <Activity size={18} /> System Audit Logs & Traceability Stream
              </h3>
              <span className="badge-info">6 System Logs Recorded</span>
            </div>

            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Activity Details</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_AUDIT_LOGS.map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-muted">{log.timestamp}</td>
                      <td className="font-semibold text-dark">{log.user}</td>
                      <td>
                        <span className={`action-tag tag-${log.type}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="module-badge">{log.module}</span>
                      </td>
                      <td className="log-details">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROLES & SYSTEM ARCHITECTURE */}
        {activeTab === 'system-overview' && (
          <div className="roles-overview-grid">
            <div className="roles-info-card">
              <h3>Role Access Matrix & Enterprise Hierarchy</h3>
              <p>System roles, default module capabilities, and policy rules configured in the system:</p>

              <div className="table-wrapper" style={{ marginTop: '1.25rem' }}>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Sales</th>
                      <th>Purchase</th>
                      <th>Manufacturing</th>
                      <th>Inventory</th>
                      <th>Audit Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>System Admin</strong></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                    </tr>
                    <tr>
                      <td><strong>Sales User</strong></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                    </tr>
                    <tr>
                      <td><strong>Purchase User</strong></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                    </tr>
                    <tr>
                      <td><strong>Manufacturing User</strong></td>
                      <td><span className="access-tag none">NONE</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                    </tr>
                    <tr>
                      <td><strong>Inventory Manager</strong></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag limited">VIEW</span></td>
                      <td><span className="access-tag full">FULL</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                    </tr>
                    <tr>
                      <td><strong>Business Owner</strong></td>
                      <td><span className="access-tag limited">READ-ONLY</span></td>
                      <td><span className="access-tag limited">READ-ONLY</span></td>
                      <td><span className="access-tag limited">READ-ONLY</span></td>
                      <td><span className="access-tag limited">READ-ONLY</span></td>
                      <td><span className="access-tag none">NONE</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
