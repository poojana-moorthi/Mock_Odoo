import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import AdminDashboard from './AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import PurchasePage from './pages/PurchasePage';
import ManufacturingPage from './pages/ManufacturingPage';
import InventoryPage from './pages/InventoryPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminUserListPage from './pages/AdminUserListPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import {
  Lock,
  Mail,
  User,
  Shield,
  Building,
  Key,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  ShoppingCart,
  Archive,
  Truck,
  Factory,
  Check
} from 'lucide-react';

axios.defaults.baseURL = '';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { currentUser, login, logout, role, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAuthSuccess = (user, token) => {
    login(user, token);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/login" 
        element={!currentUser ? <LoginView onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/admin-signup" 
        element={!currentUser ? <AdminSignupView onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/user-signup" 
        element={!currentUser ? <UserSignupView onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/forgot-password" 
        element={!currentUser ? <ForgotPasswordView /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/reset-password" 
        element={!currentUser ? <ResetPasswordView /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/unauthorized" 
        element={<UnauthorizedPage />} 
      />
      <Route 
        path="/dashboard" 
        element={
          currentUser ? (
            role === 'Admin' ? (
              <AdminDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <DashboardView user={currentUser} onLogout={handleLogout} />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Admin User Management Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminUserListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminUserDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Role Protected ERP Module Routes */}
      <Route
        path="/products"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser']}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'SalesUser', 'BusinessOwner']}>
            <SalesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'PurchaseUser', 'BusinessOwner']}>
            <PurchasePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manufacturing"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'ManufacturingUser', 'BusinessOwner']}>
            <ManufacturingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'InventoryManager', 'BusinessOwner']}>
            <InventoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

/* ==========================================================================
   1. LOGIN VIEW
   ========================================================================== */
function LoginView({ onAuthSuccess }) {
  const [userType, setUserType] = useState('System User'); // 'System User' or 'Administrator'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password, userType });
      if (response.data?.success) {
        const { user, token } = response.data.data;
        onAuthSuccess(user, token);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left panel */}
      <div className="left-panel">
        <div className="left-header">
          <span className="left-subtitle">Shiv Furniture Works</span>
          <h1 className="left-title">Mini ERP</h1>
          <p className="left-desc">
            Connect sales, inventory, procurement and manufacturing in one intelligent workspace.
          </p>
        </div>

        {/* Demand to Delivery timeline */}
        <div className="workflow-card">
          <div className="workflow-header">From Demand to Delivery</div>
          <div className="workflow-timeline">
            <div className="workflow-line"></div>
            
            <div className="workflow-step">
              <div className="workflow-node">
                <ShoppingCart size={16} />
              </div>
              <span className="workflow-label">Order</span>
            </div>
            
            <div className="workflow-step">
              <div className="workflow-node">
                <Archive size={16} />
              </div>
              <span className="workflow-label">Inventory</span>
            </div>
            
            <div className="workflow-step">
              <div className="workflow-node">
                <Truck size={16} />
              </div>
              <span className="workflow-label">Procurement</span>
            </div>
            
            <div className="workflow-step">
              <div className="workflow-node">
                <Factory size={16} />
              </div>
              <span className="workflow-label">Mfg</span>
            </div>
            
            <div className="workflow-step active">
              <div className="workflow-node">
                <Check size={16} />
              </div>
              <span className="workflow-label">Delivery</span>
            </div>
          </div>
        </div>

        <div className="left-footer">
          © 2026 Shiv Furniture Works | Enterprise Resource Management
        </div>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="form-card">
          <div className="logo-box">
            <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image" />
          </div>

          {/* System User vs Administrator pills */}
          <div className="pills-container">
            <button
              type="button"
              className={`pill-tab ${userType === 'System User' ? 'active' : ''}`}
              onClick={() => setUserType('System User')}
            >
              System User
            </button>
            <button
              type="button"
              className={`pill-tab ${userType === 'Administrator' ? 'active' : ''}`}
              onClick={() => setUserType('Administrator')}
            >
              Administrator
            </button>
          </div>

          <h2 className="form-title">Welcome back</h2>
          <p className="form-subtitle">Sign in to your Mini ERP workspace</p>

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="btn-dark" disabled={loading}>
              {loading ? <div className="spinner"></div> : <>Login <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="form-footer">
            New Administrator? <Link to="/admin-signup" className="footer-link">Sign Up</Link>
          </div>

          <div className="security-notice">
            <Shield size={14} className="security-icon" />
            <span>Secure access to your ERP workspace. Your access is based on your assigned role.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. ADMIN SIGNUP VIEW
   ========================================================================== */
function AdminSignupView({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSecurityCode, setAdminSecurityCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/admin-signup', {
        fullName,
        email,
        password,
        adminSecurityCode
      });

      if (response.data?.success) {
        const { user, token } = response.data.data;
        onAuthSuccess(user, token);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Admin signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left panel */}
      <div className="left-panel">
        <div className="left-top-logo">
          <div className="square-icon"></div>
          <span className="left-top-text">Shiv Furniture Works</span>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <h1 className="left-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            From Demand<br />to Delivery
          </h1>
          <p className="left-desc" style={{ fontSize: '1rem' }}>
            Enterprise Resource Planning engineered for precision manufacturing.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="form-card" style={{ maxWidth: '480px' }}>
          {/* Underline Tabs */}
          <div className="tabs-container">
            <button
              type="button"
              className="underline-tab active"
              onClick={() => {}}
            >
              ADMINISTRATOR
            </button>
            <button
              type="button"
              className="underline-tab"
              onClick={() => navigate('/user-signup')}
            >
              SYSTEM USER
            </button>
          </div>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '1.85rem' }}>Create Admin Account</h2>
          <p className="form-subtitle" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
            Register a new System Administrator for your enterprise.
          </p>

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">FULL NAME</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WORK EMAIL ADDRESS</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">CREATE PASSWORD</label>
              <div className="input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
                <button
                  type="button"
                  className="input-suffix"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CONFIRM PASSWORD</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ADMIN SECURITY CODE</label>
              <input
                type="text"
                className="form-input"
                placeholder="XXX-XXX"
                value={adminSecurityCode}
                onChange={(e) => setAdminSecurityCode(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span style={{ fontSize: '0.825rem' }}>
                  I agree to the <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button type="submit" className="btn-dark" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'SIGN UP'}
            </button>
          </form>

          <div className="form-footer" style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login" className="footer-link">Login</Link> <br />
            Not an Admin? <Link to="/user-signup" className="footer-link">Sign up as User</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. USER SIGNUP VIEW
   ========================================================================== */
function UserSignupView({ onAuthSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!department) {
      setErrorMsg('Please select a department.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/user-signup', {
        fullName,
        email,
        password,
        department
      });

      if (response.data?.success) {
        const { user, token } = response.data.data;
        onAuthSuccess(user, token);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left panel */}
      <div className="left-panel">
        <div className="left-header">
          <span className="left-subtitle">Mini ERP</span>
          <h1 className="left-title" style={{ fontSize: '2.5rem' }}>SHIV FURNITURE WORKS</h1>
          <p className="left-desc" style={{ fontSize: '1rem' }}>From Demand to Delivery.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="form-card" style={{ maxWidth: '480px' }}>
          <div className="logo-box" style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
            <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image" />
          </div>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '1.85rem' }}>Create User Account</h2>
          <p className="form-subtitle" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
            Join your team on the Shiv Furniture ERP.
          </p>

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Work Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '1rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="" disabled>Select Department</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Procurement & Logistics">Procurement & Logistics</option>
                <option value="Manufacturing Operations">Manufacturing Operations</option>
                <option value="Inventory Control">Inventory Control</option>
                <option value="Executive Management">Executive Management</option>
              </select>
            </div>

            {/* Side-by-side Password fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '1.25rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="input-suffix"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ right: '0.75rem' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: '1.25rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="input-suffix"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ right: '0.75rem' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span style={{ fontSize: '0.825rem' }}>
                  I agree to the <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>.
                </span>
              </label>
            </div>

            <button type="submit" className="btn-dark" disabled={loading}>
              {loading ? <div className="spinner"></div> : 'SIGN UP'}
            </button>
          </form>

          <div className="form-footer" style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login" className="footer-link">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. FORGOT PASSWORD VIEW
   ========================================================================== */
function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setTokenInfo(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data?.success) {
        setTokenInfo(response.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left panel */}
      <div className="left-panel">
        <div className="left-header">
          <h1 className="left-title" style={{ fontSize: '2.5rem' }}>SHIV FURNITURE WORKS</h1>
          <span className="left-subtitle" style={{ fontSize: '1.25rem', marginTop: '0.5rem', textTransform: 'none', color: '#fff' }}>
            Mini ERP
          </span>
          <p className="left-desc" style={{ fontSize: '1.05rem', marginTop: '1rem' }}>
            From Demand to Delivery.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="form-card">
          <div className="logo-box" style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
            <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image" />
          </div>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '1.85rem' }}>Reset Password</h2>
          <p className="form-subtitle" style={{ textAlign: 'left', marginBottom: '2.25rem', lineHeight: '1.5' }}>
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {tokenInfo ? (
            <div>
              <div className="alert alert-success">
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <div>Reset token generated successfully! Please click the link below to change your password.</div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link to={`/reset-password?token=${tokenInfo.token}`} className="btn-dark">
                  Reset Password Link <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <button type="submit" className="btn-dark" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? <div className="spinner"></div> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="form-footer" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/login" className="footer-link" style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. RESET PASSWORD VIEW
   ========================================================================== */
function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/reset-password', { token, newPassword });
      if (response.data?.success) {
        setSuccessMsg(response.data.message || 'Password reset successfully!');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-container">
      {/* Left panel */}
      <div className="left-panel">
        <div className="left-header">
          <h1 className="left-title" style={{ fontSize: '2.5rem' }}>SHIV FURNITURE WORKS</h1>
          <span className="left-subtitle" style={{ fontSize: '1.25rem', marginTop: '0.5rem', textTransform: 'none', color: '#fff' }}>
            Mini ERP
          </span>
          <p className="left-desc" style={{ fontSize: '1.05rem', marginTop: '1rem' }}>
            From Demand to Delivery.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="right-panel">
        <div className="form-card">
          <div className="logo-box" style={{ marginBottom: '1.5rem', justifyContent: 'flex-start' }}>
            <img src="/shiv_logo.png" alt="Shiv Furniture Logo" className="logo-image" />
          </div>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '1.85rem' }}>Enter New Password</h2>
          <p className="form-subtitle" style={{ textAlign: 'left', marginBottom: '2.25rem' }}>
            Establish a secure new password for your account.
          </p>

          {errorMsg && (
            <div className="alert alert-error">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg ? (
            <div>
              <div className="alert alert-success">
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <div>{successMsg}</div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to="/login" className="btn-dark">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Recovery Token</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter recovery token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '1rem' }}
                />
              </div>

              <button type="submit" className="btn-dark" disabled={loading} style={{ marginTop: '1.5rem' }}>
                {loading ? <div className="spinner"></div> : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="form-footer" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/login" className="footer-link" style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   6. DASHBOARD VIEW (AUTHENTICATED)
   ========================================================================== */
function DashboardView({ user, onLogout }) {
  const [systemLogs, setSystemLogs] = useState([]);
  
  useEffect(() => {
    const defaultLogs = [
      { id: 1, action: 'SESSION_STARTED', details: `User session active for ${user.full_name}`, time: 'Just now' },
      { id: 2, action: 'SECURITY_CHECK', details: 'JWT Signature verified successfully', time: '1m ago' },
      { id: 3, action: 'ROLE_VALIDATED', details: `User type context matches role: ${user.role_name}`, time: '2m ago' }
    ];
    setSystemLogs(defaultLogs);
  }, [user]);

  return (
    <div className="dashboard-outer">
      <div className="dashboard-wrapper">
        <div className="dashboard-header">
          <div>
            <span className="user-badge">{user.role_name} Profile</span>
            <h1 className="auth-title" style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '2rem', textAlign: 'left' }}>
              Welcome back, {user.full_name}
            </h1>
          </div>
          <button className="btn-secondary" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="grid-2col" style={{ marginTop: '2rem' }}>
          {/* User Details */}
          <div className="panel-card">
            <h3 className="panel-title">
              <User size={18} style={{ color: 'var(--primary)' }} /> Profile Context
            </h3>
            
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{user.full_name}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Email Context</span>
              <span className="info-value">{user.email}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Department</span>
              <span className="info-value">{user.department || 'N/A'}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value" style={{ color: user.status === 'Active' ? 'var(--success)' : 'var(--error)' }}>
                ● {user.status}
              </span>
            </div>
          </div>

          {/* System Security Logs */}
          <div className="panel-card">
            <h3 className="panel-title">
              <Activity size={18} style={{ color: 'var(--primary)' }} /> Live Security Logs
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {systemLogs.map(log => (
                <div 
                  key={log.id} 
                  style={{ 
                    padding: '1rem', 
                    background: 'rgba(0,0,0,0.02)', 
                    border: '1px solid rgba(0,0,0,0.04)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', marginTop: '0.25rem' }}>
                      {log.details}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {log.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        © 2026 Shiv Furniture Works ERP. All systems operational.
      </footer>
    </div>
  );
}
