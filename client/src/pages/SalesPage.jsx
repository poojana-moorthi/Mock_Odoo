import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Lock } from 'lucide-react';

export default function SalesPage() {
  const { role, canWrite } = useAuth();

  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Sales Management</span>
            <h1 className="page-title">
              <ShoppingCart size={24} className="title-icon" /> Sales Orders & Demand
            </h1>
          </div>
          {!canWrite() && (
            <div className="readonly-banner">
              <Lock size={14} /> Read-Only Mode ({role})
            </div>
          )}
        </header>

        <div className="placeholder-card">
          <h3>Sales Module Placeholder</h3>
          <p>Sales order workflow (Draft → Confirmed → Partially Delivered → Fully Delivered), customer demand, stock reservations, and auto-procurement triggers will be managed here.</p>
        </div>
      </main>
    </div>
  );
}
