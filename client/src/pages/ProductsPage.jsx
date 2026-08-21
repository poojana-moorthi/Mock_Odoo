import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Package, Lock } from 'lucide-react';

export default function ProductsPage() {
  const { role, canWrite } = useAuth();

  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Product Management</span>
            <h1 className="page-title">
              <Package size={24} className="title-icon" /> Products & Procurement Setup
            </h1>
          </div>
          {!canWrite() && (
            <div className="readonly-banner">
              <Lock size={14} /> Read-Only Mode ({role})
            </div>
          )}
        </header>

        <div className="placeholder-card">
          <h3>Product Module Placeholder</h3>
          <p>Product creation, pricing (Sales Price, Cost Price), stock quantities (On-hand, Reserved, Free-to-Use), and Procurement Strategy (MTS / MTO) will be managed here.</p>
        </div>
      </main>
    </div>
  );
}
