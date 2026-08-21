import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Truck, Lock } from 'lucide-react';

export default function PurchasePage() {
  const { role, canWrite } = useAuth();

  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Purchase Management</span>
            <h1 className="page-title">
              <Truck size={24} className="title-icon" /> Purchase Orders & Vendors
            </h1>
          </div>
          {!canWrite() && (
            <div className="readonly-banner">
              <Lock size={14} /> Read-Only Mode ({role})
            </div>
          )}
        </header>

        <div className="placeholder-card">
          <h3>Purchase Module Placeholder</h3>
          <p>Purchase order workflows (Draft → Confirmed → Partially Received → Fully Received), vendor management, and stock replenishment will be managed here.</p>
        </div>
      </main>
    </div>
  );
}
