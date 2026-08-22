import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  Archive,
  Search,
  Sliders,
  History,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from 'lucide-react';

export default function InventoryPage() {
  const { role, canWrite } = useAuth();

  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual Adjustment Modal State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState('');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  // Full Ledger History Modal State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerProduct, setLedgerProduct] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, totalPages: 1 });
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const fetchInventory = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get('/api/inventory');
      if (response.data?.success) {
        setInventoryList(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductLedger = async (productId, page = 1) => {
    setLoadingLedger(true);
    try {
      const response = await axios.get(`/api/inventory/${productId}/ledger?page=${page}&limit=10`);
      if (response.data?.success) {
        setLedgerProduct(response.data.data.product);
        setLedgerHistory(response.data.data.ledger);
        setLedgerPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error('Fetch ledger history error:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleOpenLedgerModal = (product) => {
    setLedgerProduct(product);
    setShowLedgerModal(true);
    fetchProductLedger(product.id, 1);
  };

  const handleOpenAdjustmentModal = (prod = null) => {
    if (prod) {
      setSelectedProductForAdj(prod.id.toString());
    } else if (inventoryList.length > 0) {
      setSelectedProductForAdj(inventoryList[0].id.toString());
    }
    setAdjQuantity('');
    setAdjReason('');
    setErrorMsg('');
    setShowAdjustmentModal(true);
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAdj(true);
    setErrorMsg('');

    try {
      const qtyNum = Number(adjQuantity);
      if (isNaN(qtyNum) || qtyNum === 0) {
        setErrorMsg('Please provide a non-zero integer adjustment quantity');
        setSubmittingAdj(false);
        return;
      }

      const response = await axios.post('/api/inventory/adjustment', {
        productId: Number(selectedProductForAdj),
        quantityChange: qtyNum,
        reason: adjReason
      });

      if (response.data?.success) {
        showSuccess(response.data.message || 'Stock adjustment recorded successfully');
        setShowAdjustmentModal(false);
        fetchInventory();
      }
    } catch (err) {
      console.error('Stock adjustment error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to record stock adjustment');
    } finally {
      setSubmittingAdj(false);
    }
  };

  const filteredInventory = inventoryList.filter(item =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute overall summary stats
  const totalOnHand = inventoryList.reduce((acc, i) => acc + (Number(i.on_hand_qty) || 0), 0);
  const totalReserved = inventoryList.reduce((acc, i) => acc + (Number(i.reserved_qty) || 0), 0);
  const totalFreeToUse = inventoryList.reduce((acc, i) => acc + (Number(i.free_to_use_qty) || 0), 0);

  const getMovementBadgeClass = (type) => {
    switch (type) {
      case 'PurchaseReceipt':
      case 'ManufacturingProduce':
        return 'movement-tag inflow';
      case 'SalesDelivery':
      case 'ManufacturingConsume':
        return 'movement-tag outflow';
      case 'ManualAdjustment':
      default:
        return 'movement-tag adjustment';
    }
  };

  return (
    <div className="erp-page-layout">
      <Sidebar />

      <main className="erp-page-content">
        {/* Header Bar */}
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Inventory Control</span>
            <h1 className="page-title">
              <Archive size={24} className="title-icon" /> Core Inventory & Stock Ledger
            </h1>
          </div>

          <div className="header-actions-group">
            <button className="btn-secondary" onClick={fetchInventory} title="Refresh Inventory Data">
              <RefreshCw size={15} /> Refresh
            </button>

            {canWrite() ? (
              <button className="btn-primary" onClick={() => handleOpenAdjustmentModal()}>
                <Sliders size={16} /> Manual Adjustment
              </button>
            ) : (
              <div className="readonly-banner">
                <Lock size={14} /> Read-Only Mode ({role})
              </div>
            )}
          </div>
        </header>

        {/* Global Toast Notifications */}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Inventory Summary Cards Grid */}
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="card-header-sm">
              <span className="card-label">Catalog Products</span>
              <Package size={18} className="card-icon blue" />
            </div>
            <div className="card-value">{inventoryList.length}</div>
            <div className="card-subtext">Active items in stock catalog</div>
          </div>

          <div className="summary-card">
            <div className="card-header-sm">
              <span className="card-label">Total On-Hand</span>
              <Layers size={18} className="card-icon emerald" />
            </div>
            <div className="card-value text-emerald">{totalOnHand}</div>
            <div className="card-subtext">Physical units currently in warehouse</div>
          </div>

          <div className="summary-card">
            <div className="card-header-sm">
              <span className="card-label">Total Reserved</span>
              <Archive size={18} className="card-icon amber" />
            </div>
            <div className="card-value text-amber">{totalReserved}</div>
            <div className="card-subtext">Allocated to confirmed orders/MOs</div>
          </div>

          <div className="summary-card">
            <div className="card-header-sm">
              <span className="card-label">Free-to-Use Stock</span>
              <CheckCircle2 size={18} className="card-icon violet" />
            </div>
            <div className="card-value text-violet">{totalFreeToUse}</div>
            <div className="card-subtext">Available for new sales allocation</div>
          </div>
        </div>

        {/* Toolbar & Filter Card */}
        <div className="toolbar-card">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search product stock by Name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-control"
            />
          </div>
          <span className="count-badge">{filteredInventory.length} Items Listed</span>
        </div>

        {/* Main Products Stock Ledger Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-spinner-box">
              <div className="spinner"></div>
              <span>Fetching real-time stock balances...</span>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="empty-state-box">
              <Archive size={42} className="empty-icon" />
              <h3>No Inventory Records Found</h3>
              <p>Try searching with another keyword or add products to the system first.</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="erp-data-table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th style={{ textAlign: 'center' }}>On Hand Qty</th>
                    <th style={{ textAlign: 'center' }}>Reserved Qty</th>
                    <th style={{ textAlign: 'center' }}>Free-to-Use Qty</th>
                    <th>Recent Stock Movement</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const freeQty = item.free_to_use_qty !== undefined ? item.free_to_use_qty : (item.on_hand_qty - item.reserved_qty);
                    const lastMovement = item.recent_ledger && item.recent_ledger.length > 0 ? item.recent_ledger[0] : null;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="font-bold text-dark">{item.name}</div>
                          <div className="font-mono text-muted text-xs">SKU: {item.sku}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-pill on-hand">{item.on_hand_qty}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-pill reserved">{item.reserved_qty}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`qty-pill free ${freeQty < 0 ? 'negative' : 'positive'}`}>
                            {freeQty}
                          </span>
                        </td>
                        <td>
                          {lastMovement ? (
                            <div className="last-movement-preview">
                              <span className={getMovementBadgeClass(lastMovement.movement_type)}>
                                {lastMovement.movement_type}
                              </span>
                              <span className={`change-pill ${lastMovement.quantity_change > 0 ? 'pos' : 'neg'}`}>
                                {lastMovement.quantity_change > 0 ? `+${lastMovement.quantity_change}` : lastMovement.quantity_change}
                              </span>
                              <span className="text-xs text-muted">
                                ({new Date(lastMovement.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted text-xs italic">No stock history recorded</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="action-btn info"
                              onClick={() => handleOpenLedgerModal(item)}
                              title="Full Ledger History"
                            >
                              <History size={15} /> Ledger
                            </button>

                            {canWrite() && (
                              <button
                                className="action-btn edit"
                                onClick={() => handleOpenAdjustmentModal(item)}
                                title="Manual Stock Adjustment"
                              >
                                <Sliders size={15} /> Adjust
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal 1: Manual Stock Adjustment Dialog */}
        {showAdjustmentModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <Sliders size={20} className="modal-header-icon" /> Manual Stock Adjustment
                </h3>
                <button className="btn-close" onClick={() => setShowAdjustmentModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label required">Target Product</label>
                  <select
                    className="form-control"
                    value={selectedProductForAdj}
                    onChange={(e) => setSelectedProductForAdj(e.target.value)}
                    required
                  >
                    <option value="">Select product to adjust...</option>
                    {inventoryList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku} | Current On-Hand: {p.on_hand_qty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Quantity Change (+Inflow / -Outflow)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-control"
                    placeholder="e.g. +10 for stock count correction, -3 for damaged item write-off"
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(e.target.value)}
                    required
                  />
                  <span className="text-xs text-muted" style={{ marginTop: '4px', display: 'block' }}>
                    Enter a positive integer to increase stock or a negative integer to decrease stock.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason / Notes</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="e.g. Physical inventory audit discrepancy correction"
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowAdjustmentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submittingAdj}>
                    {submittingAdj ? 'Recording...' : 'Submit Stock Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Stock Ledger Full Audit Trail Dialog */}
        {showLedgerModal && ledgerProduct && (
          <div className="modal-backdrop">
            <div className="modal-card wide">
              <div className="modal-header">
                <div>
                  <h3>
                    <History size={20} className="modal-header-icon" /> Stock Movement History
                  </h3>
                  <div className="text-muted text-sm">
                    Product: <strong>{ledgerProduct.name}</strong> (SKU: {ledgerProduct.sku}) | On-Hand: <strong>{ledgerProduct.on_hand_qty}</strong>
                  </div>
                </div>
                <button className="btn-close" onClick={() => setShowLedgerModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-scroll">
                {loadingLedger ? (
                  <div className="loading-spinner-box">
                    <div className="spinner"></div>
                    <span>Loading movement log...</span>
                  </div>
                ) : ledgerHistory.length === 0 ? (
                  <div className="empty-state-box">
                    <History size={36} className="empty-icon" />
                    <p>No stock movement entries recorded yet for this product.</p>
                  </div>
                ) : (
                  <div className="table-responsive-container">
                    <table className="erp-data-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Movement Type</th>
                          <th>Reference Entity</th>
                          <th style={{ textAlign: 'right' }}>Quantity Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerHistory.map(log => (
                          <tr key={log.id}>
                            <td className="text-muted font-mono text-xs">
                              {new Date(log.created_at).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className={getMovementBadgeClass(log.movement_type)}>
                                {log.movement_type}
                              </span>
                            </td>
                            <td className="font-mono text-sm">
                              {log.reference_type} #{log.reference_id}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className={`change-pill ${log.quantity_change > 0 ? 'pos' : 'neg'}`}>
                                {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {ledgerPagination.totalPages > 1 && (
                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">
                    Page {ledgerPagination.page} of {ledgerPagination.totalPages} ({ledgerPagination.total} entries)
                  </span>
                  <div className="pagination-buttons">
                    <button
                      className="btn-secondary sm"
                      disabled={ledgerPagination.page <= 1}
                      onClick={() => fetchProductLedger(ledgerProduct.id, ledgerPagination.page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="btn-secondary sm"
                      disabled={ledgerPagination.page >= ledgerPagination.totalPages}
                      onClick={() => fetchProductLedger(ledgerProduct.id, ledgerPagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
