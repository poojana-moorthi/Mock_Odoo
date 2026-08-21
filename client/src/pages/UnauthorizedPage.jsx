import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { role, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#ffffff', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>403 - Not Authorized</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Your current assigned role (<strong>{role || 'User'}</strong>) does not have access permissions to view this module.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn-dark" style={{ width: 'auto', padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Return to Dashboard
          </Link>
          <button onClick={logout} className="btn-secondary" style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer' }}>
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
