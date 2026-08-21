import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ShoppingBag,
  DollarSign,
  Info
} from 'lucide-react';

export default function ProductsPage() {
  const { role, canWrite } = useAuth();

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    sales_price: 0,
    cost_price: 0,
    on_hand_qty: 0,
    reserved_qty: 0,
    procurement_strategy: 'MTS',
    procure_on_demand: false,
    procurement_type: '',
    default_vendor_id: '',
    bom_id: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get('/api/products');
      if (response.data?.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load products list from server');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/api/vendors');
      if (response.data?.success) {
        setVendors(response.data.data);
      }
    } catch (err) {
      console.log('Vendors list fetch error:', err.message);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      name: '',
      sku: '',
      sales_price: 0,
      cost_price: 0,
      on_hand_qty: 0,
      reserved_qty: 0,
      procurement_strategy: 'MTS',
      procure_on_demand: false,
      procurement_type: '',
      default_vendor_id: '',
      bom_id: ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProductId(prod.id);
    setFormData({
      name: prod.name || '',
      sku: prod.sku || '',
      sales_price: prod.sales_price || 0,
      cost_price: prod.cost_price || 0,
      on_hand_qty: prod.on_hand_qty || 0,
      reserved_qty: prod.reserved_qty || 0,
      procurement_strategy: prod.procurement_strategy || 'MTS',
      procure_on_demand: Boolean(prod.procure_on_demand),
      procurement_type: prod.procurement_type || '',
      default_vendor_id: prod.default_vendor_id || '',
      bom_id: prod.bom_id || ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku,
        sales_price: Number(formData.sales_price),
        cost_price: Number(formData.cost_price),
        on_hand_qty: Number(formData.on_hand_qty),
        reserved_qty: Number(formData.reserved_qty),
        procurement_strategy: formData.procurement_strategy,
        procure_on_demand: formData.procure_on_demand,
        procurement_type: formData.procure_on_demand ? formData.procurement_type : null,
        default_vendor_id: (formData.procure_on_demand && formData.procurement_type === 'Purchase') ? (formData.default_vendor_id || null) : null,
        bom_id: (formData.procure_on_demand && formData.procurement_type === 'Manufacturing') ? (formData.bom_id || null) : null
      };

      if (editingProductId) {
        const response = await axios.put(`/api/products/${editingProductId}`, payload);
        if (response.data?.success) {
          showSuccess(`Product '${payload.name}' updated successfully`);
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const response = await axios.post('/api/products', payload);
        if (response.data?.success) {
          showSuccess(`Product '${payload.name}' created successfully`);
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      console.error('Save product error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save product. Please check form values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (prod) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete product '${prod.name}' (SKU: ${prod.sku})?`);
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/products/${prod.id}`);
      if (response.data?.success) {
        showSuccess(`Product '${prod.name}' deleted successfully`);
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete product error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const filteredProducts = products.filter(p =>
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.procurement_strategy && p.procurement_strategy.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="erp-page-layout">
      <Sidebar />

      <main className="erp-page-content">
        {/* Header Bar */}
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Product Management</span>
            <h1 className="page-title">
              <Package size={24} className="title-icon" /> Products & Procurement Setup
            </h1>
          </div>

          <div className="header-actions-group">
            {!canWrite() ? (
              <div className="readonly-banner">
                <Lock size={14} /> Read-Only Mode ({role})
              </div>
            ) : (
              <button className="btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>
        </header>

        {/* Global Toast Alerts */}
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

        {/* Search Toolbar */}
        <div className="toolbar-card">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products by Name, SKU, or Strategy (MTS/MTO)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-control"
            />
          </div>
          <span className="count-badge">{filteredProducts.length} Products</span>
        </div>

        {/* Products Table Card */}
        <div className="table-card">
          {loading ? (
            <div className="loading-spinner-box">
              <div className="spinner"></div>
              <span>Loading products catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state-box">
              <Package size={42} className="empty-icon" />
              <h3>No Products Found</h3>
              <p>Get started by adding your first product catalog entry or adjust your search filter.</p>
              {canWrite() && (
                <button className="btn-primary" onClick={handleOpenAddModal} style={{ marginTop: '1rem' }}>
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="erp-data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Sales Price</th>
                    <th>Cost Price</th>
                    <th style={{ textAlign: 'center' }}>On-Hand Qty</th>
                    <th style={{ textAlign: 'center' }}>Reserved Qty</th>
                    <th style={{ textAlign: 'center' }}>Free-to-Use Qty</th>
                    <th style={{ textAlign: 'center' }}>Strategy</th>
                    <th>Procurement</th>
                    {canWrite() && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const freeQty = (p.free_to_use_qty !== undefined && p.free_to_use_qty !== null) 
                      ? p.free_to_use_qty 
                      : (p.on_hand_qty - p.reserved_qty);

                    return (
                      <tr key={p.id}>
                        <td className="font-bold text-dark">{p.name}</td>
                        <td className="font-mono text-muted">{p.sku}</td>
                        <td className="font-semibold text-emerald">₹{Number(p.sales_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="font-semibold text-muted">₹{Number(p.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-pill on-hand">{p.on_hand_qty}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-pill reserved">{p.reserved_qty}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`qty-pill free ${freeQty < 0 ? 'negative' : 'positive'}`}>
                            {freeQty}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`strategy-badge strategy-${(p.procurement_strategy || 'MTS').toLowerCase()}`}>
                            {p.procurement_strategy || 'MTS'}
                          </span>
                        </td>
                        <td>
                          {p.procure_on_demand ? (
                            <span className="procure-tag demand">
                              Demand ({p.procurement_type || 'Custom'})
                            </span>
                          ) : (
                            <span className="procure-tag stock">Stock Replenishment</span>
                          )}
                        </td>
                        {canWrite() && (
                          <td style={{ textAlign: 'right' }}>
                            <div className="table-actions">
                              <button
                                className="action-btn edit"
                                onClick={() => handleOpenEditModal(p)}
                                title="Edit Product"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleDelete(p)}
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Dialog for Add / Edit Product */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <Package size={20} className="modal-header-icon" />
                  {editingProductId ? 'Edit Product Catalog' : 'Add New Product'}
                </h3>
                <button className="btn-close" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label required">Product Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Executive Wooden Chair"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">SKU Code</label>
                    <input
                      type="text"
                      className="form-control font-mono"
                      placeholder="e.g. EWC-101"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Sales Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={formData.sales_price}
                      onChange={(e) => setFormData({ ...formData, sales_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">On-Hand Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.on_hand_qty}
                      onChange={(e) => setFormData({ ...formData, on_hand_qty: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reserved Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.reserved_qty}
                      onChange={(e) => setFormData({ ...formData, reserved_qty: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Procurement Strategy</label>
                    <select
                      className="form-control"
                      value={formData.procurement_strategy}
                      onChange={(e) => setFormData({ ...formData, procurement_strategy: e.target.value })}
                    >
                      <option value="MTS">MTS (Make-to-Stock)</option>
                      <option value="MTO">MTO (Make-to-Order)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
                    <label className="checkbox-toggle-label">
                      <input
                        type="checkbox"
                        checked={formData.procure_on_demand}
                        onChange={(e) => setFormData({ ...formData, procure_on_demand: e.target.checked })}
                      />
                      <span className="toggle-text">Procure on Demand (Triggered Rule)</span>
                    </label>
                  </div>
                </div>

                {/* Conditional Form Fields */}
                {formData.procure_on_demand && (
                  <div className="conditional-fields-box">
                    <div className="conditional-title">
                      <Info size={14} /> Procure on Demand Rules Setup
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label required">Procurement Type</label>
                        <select
                          className="form-control"
                          value={formData.procurement_type}
                          onChange={(e) => setFormData({ ...formData, procurement_type: e.target.value })}
                          required={formData.procure_on_demand}
                        >
                          <option value="">Select Procurement Type...</option>
                          <option value="Purchase">Purchase (Vendor Order)</option>
                          <option value="Manufacturing">Manufacturing (BoM Production)</option>
                        </select>
                      </div>

                      {formData.procurement_type === 'Purchase' && (
                        <div className="form-group">
                          <label className="form-label required">Default Vendor</label>
                          <select
                            className="form-control"
                            value={formData.default_vendor_id}
                            onChange={(e) => setFormData({ ...formData, default_vendor_id: e.target.value })}
                            required={formData.procurement_type === 'Purchase'}
                          >
                            <option value="">Select Vendor...</option>
                            {vendors.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {formData.procurement_type === 'Manufacturing' && (
                        <div className="form-group">
                          <label className="form-label">Bill of Materials (BoM)</label>
                          <select
                            className="form-control"
                            value={formData.bom_id}
                            onChange={(e) => setFormData({ ...formData, bom_id: e.target.value })}
                          >
                            <option value="">Default Assembly Structure (BoM)</option>
                            <option value="1" disabled>BoM #101 - Standard Assembly (BoM Module Setup)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
