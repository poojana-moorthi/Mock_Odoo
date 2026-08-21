import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  User,
  Edit3,
  Save,
  X,
  Check,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  ShoppingCart,
  Truck,
  Factory,
  Package
} from 'lucide-react';

const MODULE_TABS = [
  { key: 'Sales', label: 'Sales', icon: ShoppingCart },
  { key: 'Purchase', label: 'Purchase', icon: Truck },
  { key: 'Manufacturing', label: 'Manufacturing', icon: Factory },
  { key: 'Product', label: 'Product', icon: Package }
];

export default function AdminUserDetailPage() {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  // User detail state
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [editedPosition, setEditedPosition] = useState('');
  const [savingPosition, setSavingPosition] = useState(false);

  // Tab & Permissions state
  const [activeTab, setActiveTab] = useState('Sales');
  const [permissionsMap, setPermissionsMap] = useState({}); // { Sales: [...], Purchase: [...], ... }
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);

  // Messages
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchUserDetail();
    fetchAllPermissions();
  }, [userId]);

  // Unsaved changes browser reload prompt
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchUserDetail = async () => {
    setLoadingUser(true);
    try {
      const response = await axios.get(`/api/admin/users/${userId}`);
      if (response.data?.success) {
        setUserInfo(response.data.data);
        setEditedPosition(response.data.data.position || '');
      }
    } catch (err) {
      console.error('Failed to fetch user detail:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load user information');
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchAllPermissions = async () => {
    setLoadingPerms(true);
    try {
      const response = await axios.get(`/api/admin/users/${userId}/permissions`);
      if (response.data?.success) {
        const permsArray = response.data.data.permissions || [];
        // Group by module
        const grouped = {};
        MODULE_TABS.forEach(t => { grouped[t.key] = []; });

        permsArray.forEach(p => {
          if (!grouped[p.module]) {
            grouped[p.module] = [];
          }
          grouped[p.module].push(p);
        });

        setPermissionsMap(grouped);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load user permissions');
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleSavePosition = async () => {
    if (!editedPosition.trim()) return;
    setSavingPosition(true);
    try {
      const response = await axios.put(`/api/admin/users/${userId}`, { position: editedPosition });
      if (response.data?.success) {
        setUserInfo(prev => ({ ...prev, position: response.data.data.position }));
        setIsEditingPosition(false);
        showToast('Position updated successfully');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update position');
    } finally {
      setSavingPosition(false);
    }
  };

  const handleTogglePermission = (moduleName, fieldName, actionKey) => {
    setPermissionsMap(prev => {
      const updatedModuleList = (prev[moduleName] || []).map(item => {
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
        [moduleName]: updatedModuleList
      };
    });

    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = async () => {
    setSavingPerms(true);
    setErrorMsg('');
    try {
      // Flatten all updated permissions across tabs
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

      const response = await axios.put(`/api/admin/users/${userId}/permissions`, { permissions: allPerms });
      if (response.data?.success) {
        setHasUnsavedChanges(false);
        showToast('Field-level permissions saved successfully');
      }
    } catch (err) {
      console.error('Failed to save permissions:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved permission changes. Are you sure you want to leave without saving?');
      if (!confirmLeave) return;
    }
    navigate('/admin/users');
  };

  // Helper to determine special disabled cell rules per wireframe
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
        <span className="custom-checkmark"></span>
      </label>
    );
  };

  const formatFieldName = (name) => {
    if (!name) return '';
    return name
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="erp-page-layout">
      <Sidebar />

      <main className="erp-page-content">
        {/* Navigation Breadcrumb */}
        <div className="detail-top-nav">
          <button className="btn-back" onClick={handleNavigateBack}>
            <ArrowLeft size={16} /> Back to Users Directory
          </button>
          <span className="detail-breadcrumb">User Management / Form View</span>
        </div>

        {toastMsg && (
          <div className="alert alert-success admin-toast">
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <div>{errorMsg}</div>
          </div>
        )}

        {loadingUser ? (
          <div className="loading-spinner-box">
            <div className="spinner"></div>
            <span>Loading user profile...</span>
          </div>
        ) : userInfo && (
          <>
            {/* Top Section Card (User Info) */}
            <div className="user-management-card">
              <div className="user-card-header">
                <span className="card-badge">User Management Form View</span>
                <span className="card-readonly-notice">Read-Only View (Position Editable)</span>
              </div>

              <div className="user-card-layout">
                {/* Left Side: Fields */}
                <div className="readonly-fields-list">
                  <div className="readonly-field-item">
                    <label className="field-label-text">Name :</label>
                    <span className="field-value-text highlight-name">{userInfo.name}</span>
                  </div>

                  <div className="readonly-field-item">
                    <label className="field-label-text">Address :</label>
                    <span className="field-value-text readonly">{userInfo.address || 'Colaba, Mumbai, 400001'}</span>
                  </div>

                  <div className="readonly-field-item">
                    <label className="field-label-text">Mobile Number :</label>
                    <span className="field-value-text readonly">{userInfo.mobile || '+91 80000 00000'}</span>
                  </div>

                  <div className="readonly-field-item">
                    <label className="field-label-text">Email ID :</label>
                    <span className="field-value-text readonly">{userInfo.email}</span>
                  </div>

                  {/* ONLY Position Field IS Editable */}
                  <div className="readonly-field-item position-row">
                    <label className="field-label-text">Position :</label>
                    {isEditingPosition ? (
                      <div className="position-edit-inline">
                        <input
                          type="text"
                          className="position-input-field"
                          value={editedPosition}
                          onChange={(e) => setEditedPosition(e.target.value)}
                          placeholder="e.g. Sales Manager"
                          autoFocus
                        />
                        <button
                          className="btn-save-position"
                          onClick={handleSavePosition}
                          disabled={savingPosition}
                        >
                          <Save size={14} /> {savingPosition ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="btn-cancel-position"
                          onClick={() => { setEditedPosition(userInfo.position || ''); setIsEditingPosition(false); }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="position-view-box" onClick={() => setIsEditingPosition(true)}>
                        <span className="field-value-text position-highlight">
                          {userInfo.position || 'Sales Manager'}
                        </span>
                        <button className="btn-edit-icon" title="Only Position Field is editable">
                          <Edit3 size={14} />
                        </button>
                        <span className="editable-tooltip-tag">Only Position field is editable</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Avatar Placeholder with Pencil Overlay */}
                <div className="user-avatar-upload-box">
                  <div className="avatar-frame">
                    <img
                      src={userInfo.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                      alt={userInfo.name}
                      className="avatar-img"
                    />
                    <button
                      className="avatar-pencil-overlay"
                      onClick={() => showToast('Avatar image upload stub: Image uploaded')}
                      title="Edit Avatar"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Module Tabs Header */}
            <div className="module-tabs-wrapper">
              <div className="tabs-header-bar">
                {MODULE_TABS.map(tab => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      className={`tab-button ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <IconComponent size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Permission Table Inside Selected Tab */}
              <div className="tab-permission-content">
                {loadingPerms ? (
                  <div className="loading-spinner-box" style={{ padding: '2rem' }}>
                    <div className="spinner"></div>
                    <span>Fetching field permissions...</span>
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
                          {(permissionsMap[activeTab] || []).length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                No field permissions defined for {activeTab} module.
                              </td>
                            </tr>
                          ) : (
                            (permissionsMap[activeTab] || []).map((item) => (
                              <tr key={item.field_name}>
                                <td className="field-name-cell">
                                  {formatFieldName(item.field_name)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(activeTab, item.field_name, 'can_create', item.can_create)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(activeTab, item.field_name, 'can_view', item.can_view)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(activeTab, item.field_name, 'can_edit', item.can_edit)}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {renderCellContent(activeTab, item.field_name, 'can_delete', item.can_delete)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer / Save Actions */}
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
          </>
        )}
      </main>
    </div>
  );
}
