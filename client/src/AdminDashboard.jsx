import React, { useState } from 'react';
import {
  User,
  Shield,
  Search,
  LayoutList,
  LayoutGrid,
  LogOut,
  Mail,
  Phone,
  MapPin,
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
  Check,
  X,
  Edit3,
  TrendingUp,
  Layers
} from 'lucide-react';

// Mock real-time dashboard metrics (from PDF Page 13: Dashboard Requirements)
const INITIAL_METRICS = {
  totalSalesOrders: 148,
  pendingDeliveries: 18,
  manufacturingOrders: 35,
  delayedOrders: 4,
  totalPurchaseOrders: 82,
  partialReceipts: 7
};

// Mock Users based on Target Users in PDF Page 4 & Mockup
const MOCK_USERS = [
  {
    id: 'usr-1',
    name: 'Mahesh Gupta',
    address: 'Colaba, Mumbai, 400001',
    mobile: '+91 80000 00000',
    email: 'mahesh.g@shivfurniture.com',
    position: 'Sales Manager',
    userType: 'Sales User',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    moduleAccess: {
      sales: { level: 'Full Access', description: 'Full access to create, view, edit & deliver sales orders.' },
      purchase: { level: 'No Access', description: 'No access to purchase replenishment module.' },
      manufacturing: { level: 'Limited Access', description: 'Can view work order statuses only.' },
      product: { level: 'Limited Access', description: 'Can view product prices & stock availability.' }
    }
  },
  {
    id: 'usr-2',
    name: 'Nisarg Verma',
    address: 'Andheri West, Mumbai, 400053',
    mobile: '+91 98200 11223',
    email: 'nisarg.v@shivfurniture.com',
    position: 'Purchase Manager',
    userType: 'Purchase User',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    moduleAccess: {
      sales: { level: 'Limited Access', description: 'Can view confirmed customer demand.' },
      purchase: { level: 'Full Access', description: 'Full access to manage purchase orders & vendors.' },
      manufacturing: { level: 'Limited Access', description: 'Can view raw material consumption requirements.' },
      product: { level: 'Full Access', description: 'Can update cost prices & vendor info.' }
    }
  },
  {
    id: 'usr-3',
    name: 'Sweta Kediva',
    address: 'Bandra West, Mumbai, 400050',
    mobile: '+91 97112 23344',
    email: 'sweta.k@shivfurniture.com',
    position: 'Manufacturing Supervisor',
    userType: 'Manufacturing User',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    moduleAccess: {
      sales: { level: 'No Access', description: 'No direct access to sales client records.' },
      purchase: { level: 'Limited Access', description: 'Can view incoming raw material receipts.' },
      manufacturing: { level: 'Full Access', description: 'Full access to BoMs, Work Orders & MO execution.' },
      product: { level: 'Limited Access', description: 'Can view product BoM structures & finished stock.' }
    }
  },
  {
    id: 'usr-4',
    name: 'Dinesh Patel',
    address: 'Thane West, Thane, 400601',
    mobile: '+91 98334 45566',
    email: 'dinesh.p@shivfurniture.com',
    position: 'Inventory Manager',
    userType: 'Inventory Manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    moduleAccess: {
      sales: { level: 'Limited Access', description: 'Can update stock delivery statuses.' },
      purchase: { level: 'Limited Access', description: 'Can receive purchase stock into warehouse.' },
      manufacturing: { level: 'Limited Access', description: 'Can issue raw material components.' },
      product: { level: 'Full Access', description: 'Full access to track stock balances & stock ledgers.' }
    }
  },
  {
    id: 'usr-5',
    name: 'Trisha K.',
    address: 'Worli, Mumbai, 400018',
    mobile: '+91 99221 14433',
    email: 'trisha.k@shivfurniture.com',
    position: 'Business Owner',
    userType: 'Business Owner',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    moduleAccess: {
      sales: { level: 'Full Access', description: 'Monitor complete sales pipeline & demand.' },
      purchase: { level: 'Full Access', description: 'Monitor vendor costs & procurement strategies.' },
      manufacturing: { level: 'Full Access', description: 'Monitor production delays & efficiency.' },
      product: { level: 'Full Access', description: 'Full management of products, prices & BoMs.' }
    }
  }
];

// Mock Audit Logs (from PDF Page 13: Audit Logs & Traceability)
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
  const [usersList, setUsersList] = useState(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('user-management'); // 'user-management', 'audit-logs', 'system-overview'
  const [moduleSubTab, setModuleSubTab] = useState('sales'); // 'sales', 'purchase', 'manufacturing', 'product'
  
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [editedPosition, setEditedPosition] = useState(selectedUser.position);
  const [notification, setNotification] = useState('');

  const filteredUsers = usersList.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setEditedPosition(u.position);
    setIsEditingPosition(false);
  };

  const handleSavePosition = () => {
    const updated = usersList.map(u => u.id === selectedUser.id ? { ...u, position: editedPosition } : u);
    setUsersList(updated);
    setSelectedUser(prev => ({ ...prev, position: editedPosition }));
    setIsEditingPosition(false);
    showToast(`Updated position for ${selectedUser.name} to "${editedPosition}"`);
  };

  const handleAccessLevelChange = (moduleKey, newLevel) => {
    let desc = '';
    if (newLevel === 'Full Access') desc = `Full administrative & operational access to ${moduleKey} module.`;
    else if (newLevel === 'Limited Access') desc = `Restricted access to view & update specific ${moduleKey} records.`;
    else desc = `No access permission granted for ${moduleKey} module.`;

    const updatedUser = {
      ...selectedUser,
      moduleAccess: {
        ...selectedUser.moduleAccess,
        [moduleKey]: { level: newLevel, description: desc }
      }
    };

    setSelectedUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    showToast(`Access level for ${selectedUser.name} in ${moduleKey.toUpperCase()} updated to "${newLevel}"`);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
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
        {/* Real-Time ERP Metrics Bar (PDF Page 13: Real-Time Dashboard Requirements) */}
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
            <div className="metric-sub">Requires admin review</div>
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
              <Package size={18} className="metric-icon text-purple" />
            </div>
            <div className="metric-value text-purple">{INITIAL_METRICS.partialReceipts}</div>
            <div className="metric-sub">Incoming shipments</div>
          </div>
        </section>

        {/* Section Navigation Tabs */}
        <div className="admin-nav-tabs">
          <button
            className={`admin-nav-btn ${activeTab === 'user-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-management')}
          >
            <User size={16} /> User Management & Access Rights
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <Activity size={16} /> Audit Logs & Traceability
          </button>
          <button
            className={`admin-nav-btn ${activeTab === 'system-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('system-overview')}
          >
            <Layers size={16} /> Roles & System Architecture
          </button>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="alert alert-success admin-toast">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* TAB 1: User Management & Access Rights */}
        {activeTab === 'user-management' && (
          <div className="admin-split-layout">
            {/* Left Sidebar: Users List */}
            <div className="users-sidebar">
              <div className="sidebar-header">
                <div className="sidebar-title-row">
                  <h3 className="sidebar-title">
                    <User size={18} /> Users Directory
                  </h3>
                  <div className="view-mode-toggles">
                    <button className="icon-btn active" title="List View"><LayoutList size={16} /></button>
                    <button className="icon-btn" title="Kanban View"><LayoutGrid size={16} /></button>
                  </div>
                </div>

                <div className="search-input-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search users or roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="users-list-scroll">
                {filteredUsers.length === 0 ? (
                  <div className="empty-users">No users match search query</div>
                ) : (
                  filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className={`user-list-item ${selectedUser.id === u.id ? 'active' : ''}`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <div className="user-item-avatar">
                        <img src={u.avatar} alt={u.name} />
                      </div>
                      <div className="user-item-details">
                        <div className="user-item-name">{u.name}</div>
                        <div className="user-item-position">{u.position}</div>
                        <span className="user-role-badge">{u.userType}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Main View: User Management Form View */}
            <div className="form-view-main">
              <div className="form-view-header">
                <div>
                  <h3 className="form-view-title">User Management Form View</h3>
                  <p className="form-view-subtitle">Manage user profiles and configure role-based access rights.</p>
                </div>
                <span className="read-only-badge">Form View (Position Editable)</span>
              </div>

              {/* User Profile Details Card */}
              <div className="user-card-form">
                <div className="user-card-body">
                  <div className="fields-grid">
                    <div className="field-row read-only">
                      <span className="field-label">Name :</span>
                      <span className="field-value highlight">{selectedUser.name}</span>
                    </div>

                    <div className="field-row read-only">
                      <span className="field-label">Address :</span>
                      <span className="field-value">
                        <MapPin size={14} className="inline-icon" /> {selectedUser.address}
                      </span>
                    </div>

                    <div className="field-row read-only">
                      <span className="field-label">Mobile Number :</span>
                      <span className="field-value">
                        <Phone size={14} className="inline-icon" /> {selectedUser.mobile}
                      </span>
                    </div>

                    <div className="field-row read-only">
                      <span className="field-label">Email ID :</span>
                      <span className="field-value">
                        <Mail size={14} className="inline-icon" /> {selectedUser.email}
                      </span>
                    </div>

                    <div className="field-row editable-row">
                      <span className="field-label">Position :</span>
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
                            <Briefcase size={14} className="inline-icon" /> {selectedUser.position}
                          </span>
                          <button className="btn-edit-pencil" title="Edit Position">
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="user-avatar-frame">
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="large-avatar" />
                  </div>
                </div>
              </div>

              {/* Authentication & Access Rights Header (PDF Page 4) */}
              <div className="section-divider">
                <h4>Authentication & Role-Based Access Rights</h4>
                <p>Assign module permissions (Full Access, Limited Module Access, No Access) for {selectedUser.name}.</p>
              </div>

              {/* Module Tabs Header */}
              <div className="module-tabs-bar">
                <button
                  className={`module-tab ${moduleSubTab === 'sales' ? 'active' : ''}`}
                  onClick={() => setModuleSubTab('sales')}
                >
                  <ShoppingCart size={16} /> Sales Module
                </button>
                <button
                  className={`module-tab ${moduleSubTab === 'purchase' ? 'active' : ''}`}
                  onClick={() => setModuleSubTab('purchase')}
                >
                  <Truck size={16} /> Purchase Module
                </button>
                <button
                  className={`module-tab ${moduleSubTab === 'manufacturing' ? 'active' : ''}`}
                  onClick={() => setModuleSubTab('manufacturing')}
                >
                  <Factory size={16} /> Manufacturing Module
                </button>
                <button
                  className={`module-tab ${moduleSubTab === 'product' ? 'active' : ''}`}
                  onClick={() => setModuleSubTab('product')}
                >
                  <Package size={16} /> Product & Inventory
                </button>
              </div>

              {/* Module Access Rights Configuration Panel */}
              <div className="access-config-card">
                <div className="access-config-header">
                  <div className="access-title-group">
                    <span className="access-module-title">
                      {moduleSubTab.toUpperCase()} MODULE PERMISSIONS
                    </span>
                    <span className="access-current-badge">
                      Current: {selectedUser.moduleAccess[moduleSubTab]?.level}
                    </span>
                  </div>

                  {/* Level Radio Selectors */}
                  <div className="access-level-options">
                    {['Full Access', 'Limited Access', 'No Access'].map((levelOption) => (
                      <label
                        key={levelOption}
                        className={`access-radio-btn ${selectedUser.moduleAccess[moduleSubTab]?.level === levelOption ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`access-${moduleSubTab}`}
                          value={levelOption}
                          checked={selectedUser.moduleAccess[moduleSubTab]?.level === levelOption}
                          onChange={() => handleAccessLevelChange(moduleSubTab, levelOption)}
                        />
                        <span>{levelOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="access-description-box">
                  <div className="access-desc-title">Module Access Policy:</div>
                  <p className="access-desc-text">
                    {selectedUser.moduleAccess[moduleSubTab]?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Audit Logs & Traceability (PDF Page 13: Audit Logs) */}
        {activeTab === 'audit-logs' && (
          <div className="audit-logs-container">
            <div className="audit-header">
              <div>
                <h3 className="audit-title">System Audit Logs & Traceability</h3>
                <p className="audit-subtitle">Every status change, inventory movement, price update, and delivery is automatically logged for complete audit compliance.</p>
              </div>
              <div className="audit-badge">
                <Shield size={16} /> Live Audit Ledger
              </div>
            </div>

            <div className="audit-table-card">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User / Event</th>
                    <th>Module</th>
                    <th>Action Type</th>
                    <th>Log Details</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_AUDIT_LOGS.map(log => (
                    <tr key={log.id}>
                      <td className="log-time-cell">{log.timestamp}</td>
                      <td className="log-user-cell">
                        <strong>{log.user}</strong>
                      </td>
                      <td>
                        <span className="module-pill">{log.module}</span>
                      </td>
                      <td>
                        <span className={`action-tag action-${log.type}`}>{log.action}</span>
                      </td>
                      <td className="log-details-cell">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Target Users & Role Definitions (PDF Page 4) */}
        {activeTab === 'system-overview' && (
          <div className="system-overview-container">
            <h3 className="overview-title">Enterprise Target Users & Access Rights Matrix</h3>
            <p className="overview-subtitle">Role-based access matrix governing Shiv Furniture Works operations.</p>

            <div className="grid-2col" style={{ marginTop: '1.5rem', gap: '1.5rem' }}>
              {/* Target Users Responsibilities Table (PDF Page 4) */}
              <div className="panel-card-white">
                <h4 className="panel-card-title">Target Users & Responsibilities</h4>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>User Type</th>
                      <th>Responsibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Admin</strong></td>
                      <td>Full system access & system administration</td>
                    </tr>
                    <tr>
                      <td><strong>Sales User</strong></td>
                      <td>Manage sales orders & customer demand</td>
                    </tr>
                    <tr>
                      <td><strong>Purchase User</strong></td>
                      <td>Manage purchase orders & vendor relations</td>
                    </tr>
                    <tr>
                      <td><strong>Manufacturing User</strong></td>
                      <td>Handle manufacturing orders, BoMs & Work Orders</td>
                    </tr>
                    <tr>
                      <td><strong>Inventory Manager</strong></td>
                      <td>Track stock movement & stock ledger balance</td>
                    </tr>
                    <tr>
                      <td><strong>Business Owner</strong></td>
                      <td>Monitor overall business flow & manage products</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Authentication Access Levels (PDF Page 4) */}
              <div className="panel-card-white">
                <h4 className="panel-card-title">Authentication & Access Rights Policy</h4>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Access Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="access-tag full">Admin</span></td>
                      <td>Full system access across all 5 modules including Audit Logs.</td>
                    </tr>
                    <tr>
                      <td><span className="access-tag limited">User</span></td>
                      <td>Limited module access assigned strictly by department role.</td>
                    </tr>
                    <tr>
                      <td><span className="access-tag none">None</span></td>
                      <td>No access permissions to module records or operations.</td>
                    </tr>
                  </tbody>
                </table>

                <div className="policy-notes">
                  <strong>Role Enforcement Rules:</strong>
                  <ul>
                    <li>Sales Users may only access the Sales module.</li>
                    <li>Manufacturing Users may only access Manufacturing & BoMs.</li>
                    <li>Admin users have unrestricted visibility including live Audit Logs.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
