import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle,
  X,
  Trash2,
  Lock,
  Package,
  ArrowRight,
  Info,
  DollarSign
} from 'lucide-react';

export default function SalesPage() {
  const { role, canWrite } = useAuth();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Creating Sales Order
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [lineItems, setLineItems] = useState([
    { product_id: '', quantity: 1, unit_price: 0, available_stock: 0, subtotal: 0 }
  ]);

  // Deliveries State for Delivery Modal
  const [deliveryQuantities, setDeliveryQuantities] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.get('/api/sales');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      if (response.data?.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products list:', err);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/sales/${orderId}`);
      if (response.data?.success) {
        setSelectedOrder(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load order details');
    }
  };

  const handleOpenCreateModal = () => {
    setCustomerName('');
    setCustomerContact('');
    setLineItems([{ product_id: '', quantity: 1, unit_price: 0, available_stock: 0, subtotal: 0 }]);
    setErrorMsg('');
    setShowCreateModal(true);
  };

  const handleProductSelect = (index, productId) => {
    const selectedProd = products.find(p => p.id === Number(productId));
    const newItems = [...lineItems];
    if (selectedProd) {
      const freeQty = (selectedProd.free_to_use_qty !== undefined && selectedProd.free_to_use_qty !== null) 
        ? selectedProd.free_to_use_qty 
        : (selectedProd.on_hand_qty - selectedProd.reserved_qty);

      newItems[index] = {
        ...newItems[index],
        product_id: Number(productId),
        unit_price: Number(selectedProd.sales_price),
        available_stock: freeQty,
        subtotal: newItems[index].quantity * Number(selectedProd.sales_price)
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        product_id: '',
        unit_price: 0,
        available_stock: 0,
        subtotal: 0
      };
    }
    setLineItems(newItems);
  };

  const handleQuantityChange = (index, qtyStr) => {
    const qty = Math.max(1, Number(qtyStr) || 1);
    const newItems = [...lineItems];
    newItems[index].quantity = qty;
    newItems[index].subtotal = qty * newItems[index].unit_price;
    setLineItems(newItems);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { product_id: '', quantity: 1, unit_price: 0, available_stock: 0, subtotal: 0 }
    ]);
  };

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return;
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const itemsToSubmit = lineItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const response = await axios.post('/api/sales', {
        customer_name: customerName,
        customer_contact: customerContact,
        items: itemsToSubmit
      });

      if (response.data?.success) {
        showSuccess(`Sales Order #${response.data.data.id} created successfully for ${customerName}`);
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Create sales order error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create sales order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await axios.post(`/api/sales/${orderId}/confirm`);
      if (response.data?.success) {
        showSuccess(`Sales Order #${orderId} confirmed and stock reserved!`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          fetchOrderDetails(orderId);
        }
      }
    } catch (err) {
      console.error('Confirm order error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to confirm order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeliverModal = (order) => {
    setSelectedOrder(order);
    const initialDeliveries = {};
    order.items?.forEach(item => {
      const remaining = item.quantity - item.delivered_qty;
      initialDeliveries[item.id] = remaining > 0 ? remaining : 0;
    });
    setDeliveryQuantities(initialDeliveries);
    setShowDeliverModal(true);
  };

  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const deliveries = Object.entries(deliveryQuantities).map(([itemId, qty]) => ({
        item_id: Number(itemId),
        deliver_qty: Number(qty)
      })).filter(d => d.deliver_qty > 0);

      if (deliveries.length === 0) {
        setErrorMsg('Please specify at least 1 unit to deliver.');
        setSubmitting(false);
        return;
      }

      const response = await axios.post(`/api/sales/${selectedOrder.id}/deliver`, { deliveries });
      if (response.data?.success) {
        showSuccess(`Delivery processed for Sales Order #${selectedOrder.id}`);
        setShowDeliverModal(false);
        fetchOrders();
        fetchOrderDetails(selectedOrder.id);
      }
    } catch (err) {
      console.error('Delivery error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to process delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel Sales Order #${orderId}? Reserved stock will be released.`);
    if (!confirmCancel) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await axios.post(`/api/sales/${orderId}/cancel`);
      if (response.data?.success) {
        showSuccess(`Sales Order #${orderId} cancelled and reserved stock released.`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          fetchOrderDetails(orderId);
        }
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    await fetchOrderDetails(orderId);
    setShowDetailModal(true);
  };

  const orderTotalAmount = lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const filteredOrders = orders.filter(o =>
    (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.id && String(o.id).includes(searchQuery)) ||
    (o.status && o.status.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSalesCount = orders.length;
  const draftCount = orders.filter(o => o.status === 'Draft').length;
  const confirmedCount = orders.filter(o => o.status === 'Confirmed' || o.status === 'PartiallyDelivered').length;
  const deliveredCount = orders.filter(o => o.status === 'FullyDelivered').length;

  return (
    <div className="erp-page-layout">
      <Sidebar />

      <main className="erp-page-content">
        {/* Header Bar */}
        <header className="page-header">
          <div>
            <span className="page-breadcrumb">Modules / Sales Management</span>
            <h1 className="page-title">
              <ShoppingCart size={24} className="title-icon" /> Sales Orders & Customer Demand
            </h1>
          </div>

          <div className="header-actions-group">
            {!canWrite() ? (
              <div className="readonly-banner">
                <Lock size={14} /> Read-Only Mode ({role})
              </div>
            ) : (
              <button className="btn-primary" onClick={handleOpenCreateModal}>
                <Plus size={16} /> Create Sales Order
              </button>
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

        {/* Sales KPI Summary Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="panel-card" style={{ borderLeft: '4px solid #4f46e5' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TOTAL ORDERS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>{totalSalesCount}</div>
          </div>
          <div className="panel-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DRAFT ORDERS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>{draftCount}</div>
          </div>
          <div className="panel-card" style={{ borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>CONFIRMED / IN-FLIGHT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>{confirmedCount}</div>
          </div>
          <div className="panel-card" style={{ borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>DELIVERED ORDERS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{deliveredCount}</div>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="toolbar-card">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Customer Name, Order ID, or Status (Draft, Confirmed...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-control"
            />
          </div>
          <span className="count-badge">{filteredOrders.length} Sales Orders</span>
        </div>

        {/* Sales Orders Data Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-spinner-box">
              <div className="spinner"></div>
              <span>Loading sales orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state-box">
              <ShoppingCart size={42} className="empty-icon" />
              <h3>No Sales Orders Found</h3>
              <p>Create a new customer order to start managing sales demand and inventory reservations.</p>
              {canWrite() && (
                <button className="btn-primary" onClick={handleOpenCreateModal} style={{ marginTop: '1rem' }}>
                  <Plus size={16} /> Create Sales Order
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="erp-data-table">
                <thead>
                  <tr>
                    <th>SO ID</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th style={{ textAlign: 'center' }}>Total Items</th>
                    <th>Order Total (₹)</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Order Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td className="font-mono font-bold text-dark">SO-{String(o.id).padStart(4, '0')}</td>
                      <td className="font-bold text-dark">{o.customer_name}</td>
                      <td className="text-muted">{o.customer_contact || 'N/A'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="qty-pill on-hand">{o.total_items || 0}</span>
                      </td>
                      <td className="font-semibold text-emerald">₹{Number(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge status-${(o.status || 'Draft').toLowerCase()}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-muted font-mono" style={{ fontSize: '0.8rem' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => handleViewDetails(o.id)}
                            title="View Order Details"
                          >
                            <Eye size={15} />
                          </button>

                          {o.status === 'Draft' && canWrite() && (
                            <button
                              className="action-btn success"
                              onClick={() => handleConfirmOrder(o.id)}
                              title="Confirm Order & Reserve Stock"
                              disabled={submitting}
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {(o.status === 'Confirmed' || o.status === 'PartiallyDelivered') && canWrite() && (
                            <button
                              className="action-btn info"
                              onClick={async () => {
                                await fetchOrderDetails(o.id);
                                handleOpenDeliverModal(o);
                              }}
                              title="Process Delivery"
                              style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
                            >
                              <Truck size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal 1: Create Sales Order Modal with Line Items */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-card wide">
              <div className="modal-header">
                <h3>
                  <ShoppingCart size={20} className="modal-header-icon" />
                  Create New Sales Order
                </h3>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateOrderSubmit} className="modal-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label required">Customer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Royal Interiors Pvt Ltd"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Contact / Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 98765 43210"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Order Line Items</h4>
                    <button type="button" className="btn-secondary sm" onClick={handleAddLineItem}>
                      <Plus size={14} /> Add Product Line
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {lineItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Select Product</label>
                          <select
                            className="form-control"
                            value={item.product_id}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            required
                          >
                            <option value="">Choose product from catalog...</option>
                            {products.map(p => {
                              const free = (p.free_to_use_qty !== undefined && p.free_to_use_qty !== null) ? p.free_to_use_qty : (p.on_hand_qty - p.reserved_qty);
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.name} (SKU: {p.sku}) — Available Stock: {free} ({p.procurement_strategy})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Quantity</label>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Unit Price (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={item.unit_price}
                            onChange={(e) => {
                              const price = Number(e.target.value) || 0;
                              const newItems = [...lineItems];
                              newItems[idx].unit_price = price;
                              newItems[idx].subtotal = newItems[idx].quantity * price;
                              setLineItems(newItems);
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Subtotal</label>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', paddingTop: '0.4rem' }}>
                            ₹{Number(item.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div style={{ paddingTop: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            disabled={lineItems.length <= 1}
                            style={{ background: 'transparent', border: 'none', color: lineItems.length <= 1 ? '#cbd5e1' : '#f87171', cursor: lineItems.length <= 1 ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '1rem 1.25rem', borderRadius: '10px', marginTop: '1.25rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Total Sales Order Amount:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
                    ₹{Number(orderTotalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creating Order...' : 'Create Sales Order (Draft)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: View Order Details & Workflow */}
        {showDetailModal && selectedOrder && (
          <div className="modal-backdrop">
            <div className="modal-card wide">
              <div className="modal-header">
                <h3>
                  <ShoppingCart size={20} className="modal-header-icon" />
                  Sales Order #SO-{String(selectedOrder.id).padStart(4, '0')} Details
                </h3>
                <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '1.5rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CUSTOMER</span>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrder.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customer_contact || 'No contact specified'}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ORDER STATUS</span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className={`status-badge status-${(selectedOrder.status || 'Draft').toLowerCase()}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CREATED BY</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>{selectedOrder.created_by_name || 'Sales Staff'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Order Line Items</h4>
                
                <table className="erp-data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'center' }}>Ordered Qty</th>
                      <th style={{ textAlign: 'center' }}>Delivered Qty</th>
                      <th style={{ textAlign: 'center' }}>Available Stock</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td className="font-bold text-dark">{item.product_name}</td>
                        <td className="font-mono text-muted">{item.product_sku}</td>
                        <td style={{ textAlign: 'center' }}><span className="qty-pill on-hand">{item.quantity}</span></td>
                        <td style={{ textAlign: 'center' }}><span className="qty-pill reserved">{item.delivered_qty}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`qty-pill free ${item.free_to_use_qty < item.quantity ? 'negative' : 'positive'}`}>
                            {item.free_to_use_qty}
                          </span>
                        </td>
                        <td>₹{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          ₹{Number(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    Total Order Value: <span style={{ color: '#059669' }}>₹{Number(selectedOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {selectedOrder.status === 'Draft' && canWrite() && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleConfirmOrder(selectedOrder.id)}
                      disabled={submitting}
                      style={{ background: '#059669', borderColor: '#059669' }}
                    >
                      <CheckCircle2 size={16} /> Confirm Order & Reserve Stock
                    </button>
                  )}

                  {(selectedOrder.status === 'Confirmed' || selectedOrder.status === 'PartiallyDelivered') && canWrite() && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenDeliverModal(selectedOrder);
                      }}
                      disabled={submitting}
                    >
                      <Truck size={16} /> Deliver Items
                    </button>
                  )}

                  {selectedOrder.status !== 'FullyDelivered' && selectedOrder.status !== 'Cancelled' && canWrite() && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={submitting}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <XCircle size={16} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Process Delivery Modal */}
        {showDeliverModal && selectedOrder && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <Truck size={20} className="modal-header-icon" />
                  Process Delivery for Order #SO-{String(selectedOrder.id).padStart(4, '0')}
                </h3>
                <button className="btn-close" onClick={() => setShowDeliverModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDeliverSubmit} className="modal-form">
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                  Enter the quantities of items being dispatched. Delivering items will deduct from physical on-hand stock and update the stock ledger.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedOrder.items?.map(item => {
                    const remaining = item.quantity - item.delivered_qty;
                    return (
                      <div key={item.id} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.product_name} (SKU: {item.product_sku})</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '0.75rem' }}>
                          Ordered: {item.quantity} | Already Delivered: {item.delivered_qty} | Remaining: <strong style={{ color: '#3730a3' }}>{remaining}</strong>
                        </div>

                        {remaining > 0 ? (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Dispatch Quantity</label>
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              className="form-control"
                              value={deliveryQuantities[item.id] || 0}
                              onChange={(e) => setDeliveryQuantities({
                                ...deliveryQuantities,
                                [item.id]: Math.min(remaining, Math.max(0, Number(e.target.value) || 0))
                              })}
                            />
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                            ✓ Fully Delivered
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowDeliverModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Processing Delivery...' : 'Confirm Dispatch & Update Stock'}
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
