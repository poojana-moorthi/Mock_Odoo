import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Factory, Lock } from 'lucide-react';

export default function ManufacturingPage() {
  const { role, canWrite } = useAuth();

  return (
    <div className="erp-page-layout">
      <Sidebar />
      <main className="erp-page-content">
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Manufacturing</span>
            <h1 className="page-title">
              <Factory size={24} className="title-icon" /> Manufacturing Orders & BoM
            </h1>
          </div>
          {!canWrite() && (
            <div className="readonly-banner">
              <Lock size={14} /> Read-Only Mode ({role})
            </div>
          )}
        </header>

        <div className="placeholder-card">
          <h3>Manufacturing Module Placeholder</h3>
          <p>Bill of Materials (BoM), Manufacturing Orders (MO), Work Center execution (Assembly, Painting, Packing), component consumption, and finished goods production will be managed here.</p>
        </div>
      </main>
    </div>
  );
}
