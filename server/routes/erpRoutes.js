const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const erpController = require('../controllers/erpController');
const productController = require('../controllers/productController');
const inventoryController = require('../controllers/inventoryController');
const salesController = require('../controllers/salesController');

// All routes require JWT authentication
router.use(protect);

// 1. Products Module Routes (All roles can view, add, and edit products per requirement PDF)
router.route('/products')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), productController.getAllProducts)
  .post(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), productController.createProduct);

router.route('/products/:id')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), productController.getProductById)
  .put(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), productController.updateProduct)
  .delete(requireRole('Admin', 'InventoryManager'), productController.deleteProduct);

// Helper Vendors Route for Product Form Vendor Dropdown
router.route('/vendors')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), productController.getAllVendors);

// 2. Sales Module Routes (Phase 5)
router.route('/sales')
  .get(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.getSalesOrders)
  .post(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.createSalesOrder);

router.route('/sales/:id')
  .get(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.getSalesOrderDetails);

router.route('/sales/:id/confirm')
  .post(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.confirmSalesOrder);

router.route('/sales/:id/deliver')
  .post(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.deliverSalesOrder);

router.route('/sales/:id/cancel')
  .post(requireRole('Admin', 'SalesUser', 'BusinessOwner'), salesController.cancelSalesOrder);

// 3. Purchase Module Routes
router.route('/purchase')
  .get(requireRole('Admin', 'PurchaseUser', 'BusinessOwner'), erpController.getPurchase)
  .post(requireRole('Admin', 'PurchaseUser'), erpController.createPurchase)
  .put(requireRole('Admin', 'PurchaseUser'), erpController.updatePurchase)
  .delete(requireRole('Admin', 'PurchaseUser'), erpController.deletePurchase);

// 4. Manufacturing Module Routes
router.route('/manufacturing')
  .get(requireRole('Admin', 'ManufacturingUser', 'BusinessOwner'), erpController.getManufacturing)
  .post(requireRole('Admin', 'ManufacturingUser'), erpController.createManufacturing)
  .put(requireRole('Admin', 'ManufacturingUser'), erpController.updateManufacturing)
  .delete(requireRole('Admin', 'ManufacturingUser'), erpController.deleteManufacturing);

// 5. Inventory Module Routes
router.route('/inventory')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner'), inventoryController.getInventoryOverview);

router.route('/inventory/adjustment')
  .post(requireRole('Admin', 'InventoryManager'), inventoryController.createManualAdjustment);

router.route('/inventory/:productId/ledger')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner'), inventoryController.getProductLedger);

// 6. Audit Logs Routes
router.route('/audit-logs')
  .get(requireRole('Admin'), erpController.getAuditLogs);

module.exports = router;
