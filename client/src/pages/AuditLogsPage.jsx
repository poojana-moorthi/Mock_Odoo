import React from 'react';
import Sidebar from '../components/Sidebar';
import { Activity, Shield } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Security / Compliance</span>
            <h1 className="page-title">
              <Activity size={24} className="title-icon" /> System Audit Logs
            </h1>
          </div>
          <div className="admin-only-tag">
            <Shield size={14} /> Admin Access Only
          </div>
        </header>

        <div className="placeholder-card">
          <h3>Audit Logs Placeholder</h3>
          <p>System-wide traceability logs (status changes, price updates, quantity adjustments, deliveries, and manufacturing completions) will be streamed here for Admin review.</p>
        </div>
      </main>
    </div>
  );
}
