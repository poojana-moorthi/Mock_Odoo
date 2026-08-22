const pool = require('../config/db');
const { success, error } = require('../utils/response');
const { recordStockMovement } = require('../services/inventoryService');

/**
 * GET /api/inventory
 * List all products with stock quantities and their last 5 stock ledger entries.
 */
exports.getInventoryOverview = async (req, res, next) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        id, 
        name, 
        sku, 
        sales_price, 
        cost_price, 
        on_hand_qty, 
        reserved_qty, 
        (on_hand_qty - reserved_qty) AS free_to_use_qty,
        procurement_strategy,
        procure_on_demand,
        created_at,
        updated_at
      FROM products
      ORDER BY name ASC
    `);

    // Fetch last 5 ledger entries for each product
    const [recentLedgerRows] = await pool.query(`
      SELECT 
        sl.id,
        sl.product_id,
        sl.movement_type,
        sl.quantity_change,
        sl.reference_type,
        sl.reference_id,
        sl.created_at
      FROM stock_ledger sl
      ORDER BY sl.created_at DESC, sl.id DESC
    `);

    // Group ledger entries by product_id
    const ledgerByProduct = {};
    for (const row of recentLedgerRows) {
      if (!ledgerByProduct[row.product_id]) {
        ledgerByProduct[row.product_id] = [];
      }
      if (ledgerByProduct[row.product_id].length < 5) {
        ledgerByProduct[row.product_id].push(row);
      }
    }

    const inventoryData = products.map(p => ({
      ...p,
      recent_ledger: ledgerByProduct[p.id] || []
    }));

    return success(res, 'Inventory overview retrieved successfully', inventoryData);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/inventory/:productId/ledger
 * Full stock ledger history for a single product, paginated, newest first.
 */
exports.getProductLedger = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = (page - 1) * limit;

    if (isNaN(productId)) {
      return error(res, 'Invalid product ID parameter', 400);
    }

    // Verify product
    const [products] = await pool.query('SELECT id, name, sku, on_hand_qty, reserved_qty FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return error(res, 'Product not found', 404);
    }

    const product = products[0];

    // Total count query
    const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM stock_ledger WHERE product_id = ?', [productId]);
    const totalItems = countRows[0].total;

    // Paginated history
    const [ledgerRows] = await pool.query(`
      SELECT 
        id,
        product_id,
        movement_type,
        quantity_change,
        reference_type,
        reference_id,
        created_at
      FROM stock_ledger
      WHERE product_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `, [productId, limit, offset]);

    return success(res, 'Product stock ledger history retrieved', {
      product,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1
      },
      ledger: ledgerRows
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/inventory/adjustment
 * Record a manual stock adjustment for a product.
 */
exports.createManualAdjustment = async (req, res, next) => {
  try {
    const { productId, quantityChange, reason } = req.body;

    if (!productId || quantityChange === undefined || isNaN(Number(quantityChange))) {
      return error(res, 'productId and a numeric quantityChange are required', 400);
    }

    const qty = Number(quantityChange);
    if (qty === 0) {
      return error(res, 'quantityChange cannot be zero', 400);
    }

    const userId = req.user ? req.user.id : null;

    const result = await recordStockMovement({
      productId: parseInt(productId, 10),
      movementType: 'ManualAdjustment',
      quantityChange: qty,
      referenceType: 'ManualAdjustment',
      referenceId: userId || 0
    });

    // Optionally insert into audit_logs if needed
    if (userId) {
      try {
        await pool.query(
          `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, old_value, new_value)
           VALUES (?, 'ManualStockAdjustment', 'Product', ?, ?, ?)`,
          [
            userId,
            productId,
            JSON.stringify({ on_hand_qty: result.oldOnHandQty }),
            JSON.stringify({ on_hand_qty: result.newOnHandQty, change: qty, reason: reason || 'Manual Correction' })
          ]
        );
      } catch (auditErr) {
        console.warn('Failed to insert audit log for stock adjustment:', auditErr.message);
      }
    }

    return success(res, `Stock adjusted successfully for product ID ${productId}`, result, 201);
  } catch (err) {
    if (err.message && err.message.includes('Insufficient stock')) {
      return error(res, err.message, 400);
    }
    next(err);
  }
};
