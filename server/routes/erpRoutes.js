const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const erpController = require('../controllers/erpController');

// All routes require JWT authentication
router.use(protect);

// 1. Products Module Routes
// Admin, InventoryManager, BusinessOwner, SalesUser, PurchaseUser, ManufacturingUser (BusinessOwner is read-only via middleware)
router.route('/products')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner', 'SalesUser', 'PurchaseUser', 'ManufacturingUser'), erpController.getProducts)
  .post(requireRole('Admin', 'InventoryManager'), erpController.createProduct)
  .put(requireRole('Admin', 'InventoryManager'), erpController.updateProduct)
  .delete(requireRole('Admin', 'InventoryManager'), erpController.deleteProduct);

// 2. Sales Module Routes
// Admin, SalesUser, BusinessOwner (read-only for BusinessOwner)
router.route('/sales')
  .get(requireRole('Admin', 'SalesUser', 'BusinessOwner'), erpController.getSales)
  .post(requireRole('Admin', 'SalesUser'), erpController.createSale)
  .put(requireRole('Admin', 'SalesUser'), erpController.updateSale)
  .delete(requireRole('Admin', 'SalesUser'), erpController.deleteSale);

// 3. Purchase Module Routes
// Admin, PurchaseUser, BusinessOwner (read-only for BusinessOwner)
router.route('/purchase')
  .get(requireRole('Admin', 'PurchaseUser', 'BusinessOwner'), erpController.getPurchase)
  .post(requireRole('Admin', 'PurchaseUser'), erpController.createPurchase)
  .put(requireRole('Admin', 'PurchaseUser'), erpController.updatePurchase)
  .delete(requireRole('Admin', 'PurchaseUser'), erpController.deletePurchase);

// 4. Manufacturing Module Routes
// Admin, ManufacturingUser, BusinessOwner (read-only for BusinessOwner)
router.route('/manufacturing')
  .get(requireRole('Admin', 'ManufacturingUser', 'BusinessOwner'), erpController.getManufacturing)
  .post(requireRole('Admin', 'ManufacturingUser'), erpController.createManufacturing)
  .put(requireRole('Admin', 'ManufacturingUser'), erpController.updateManufacturing)
  .delete(requireRole('Admin', 'ManufacturingUser'), erpController.deleteManufacturing);

// 5. Inventory Module Routes
// Admin, InventoryManager, BusinessOwner (read-only for BusinessOwner)
router.route('/inventory')
  .get(requireRole('Admin', 'InventoryManager', 'BusinessOwner'), erpController.getInventory)
  .post(requireRole('Admin', 'InventoryManager'), erpController.createInventory)
  .put(requireRole('Admin', 'InventoryManager'), erpController.updateInventory)
  .delete(requireRole('Admin', 'InventoryManager'), erpController.deleteInventory);

// 6. Audit Logs Routes
// Admin ONLY
router.route('/audit-logs')
  .get(requireRole('Admin'), erpController.getAuditLogs);

module.exports = router;
