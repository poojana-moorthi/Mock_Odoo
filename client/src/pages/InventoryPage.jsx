import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Archive, Lock } from 'lucide-react';

export default function InventoryPage() {
  const { role, canWrite } = useAuth();

  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Inventory Control</span>
            <h1 className="page-title">
              <Archive size={24} className="title-icon" /> Inventory & Stock Movements
            </h1>
          </div>
          {!canWrite() && (
            <div className="readonly-banner">
              <Lock size={14} /> Read-Only Mode ({role})
            </div>
          )}
        </header>

        <div className="placeholder-card">
          <h3>Inventory Module Placeholder</h3>
          <p>Real-time stock balance tracking, physical warehouse stock counts, reserved stock allocations, and stock ledgers will be managed here.</p>
        </div>
      </main>
    </div>
  );
}
