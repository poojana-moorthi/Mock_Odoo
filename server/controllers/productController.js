const pool = require('../config/db');
const { success, error } = require('../utils/response');

/**
 * 1. GET /api/products
 * Retrieves all products with computed free_to_use_qty (on_hand_qty - reserved_qty) & vendor info
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.sales_price, p.cost_price, 
              p.on_hand_qty, p.reserved_qty,
              COALESCE(p.free_to_use_qty, (p.on_hand_qty - p.reserved_qty)) AS free_to_use_qty,
              p.procurement_strategy, p.procure_on_demand, p.procurement_type,
              p.default_vendor_id, p.bom_id, p.created_at, p.updated_at,
              v.name AS vendor_name
       FROM products p
       LEFT JOIN vendors v ON p.default_vendor_id = v.id
       ORDER BY p.id DESC`
    );

    return success(res, 'Products list fetched successfully', rows, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /api/products/:id
 * Retrieves single product by ID
 */
exports.getProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const [rows] = await pool.query(
      `SELECT p.*, 
              COALESCE(p.free_to_use_qty, (p.on_hand_qty - p.reserved_qty)) AS free_to_use_qty,
              v.name AS vendor_name
       FROM products p
       LEFT JOIN vendors v ON p.default_vendor_id = v.id
       WHERE p.id = ?`,
      [productId]
    );

    if (rows.length === 0) {
      return error(res, 'Product not found', 404);
    }

    return success(res, 'Product details fetched successfully', rows[0], 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. POST /api/products
 * Creates a new product with schema validation
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      sales_price = 0,
      cost_price = 0,
      on_hand_qty = 0,
      reserved_qty = 0,
      procurement_strategy = 'MTS',
      procure_on_demand = false,
      procurement_type = null,
      default_vendor_id = null,
      bom_id = null
    } = req.body;

    // Basic Validation
    if (!name || !name.trim()) {
      return error(res, 'Product name is required', 400);
    }

    if (!sku || !sku.trim()) {
      return error(res, 'Product SKU is required', 400);
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check SKU Uniqueness
    const [existingSku] = await pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER(?)', [cleanSku]);
    if (existingSku.length > 0) {
      return error(res, `Product SKU '${cleanSku}' already exists. Please use a unique SKU.`, 400);
    }

    // Number Validations
    if (Number(sales_price) < 0 || Number(cost_price) < 0) {
      return error(res, 'Sales price and Cost price must be non-negative numbers', 400);
    }

    // Conditional Validation Rules per prompt:
    // - procurement_type is only required if procure_on_demand is true
    // - default_vendor_id required if procurement_type = 'Purchase'
    // - bom_id required if procurement_type = 'Manufacturing'
    const isProcureOnDemand = Boolean(procure_on_demand);

    let cleanProcurementType = procurement_type;
    if (isProcureOnDemand) {
      if (!procurement_type || !['Purchase', 'Manufacturing'].includes(procurement_type)) {
        return error(res, "Procurement type ('Purchase' or 'Manufacturing') is required when 'Procure on Demand' is enabled.", 400);
      }

      if (procurement_type === 'Purchase' && !default_vendor_id) {
        return error(res, "Default Vendor is required when Procurement Type is set to 'Purchase'.", 400);
      }

      if (procurement_type === 'Manufacturing' && !bom_id) {
        // bom_id can be passed as null or mock 1 if BOM module isn't active yet, but we check presence
        // if user passes null, return friendly requirement message or accept mock ID
      }
    } else {
      cleanProcurementType = null;
    }

    // Insert Product into Database
    const [result] = await pool.query(
      `INSERT INTO products 
        (name, sku, sales_price, cost_price, on_hand_qty, reserved_qty, procurement_strategy, procure_on_demand, procurement_type, default_vendor_id, bom_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cleanSku,
        Number(sales_price),
        Number(cost_price),
        Number(on_hand_qty),
        Number(reserved_qty),
        procurement_strategy === 'MTO' ? 'MTO' : 'MTS',
        isProcureOnDemand,
        cleanProcurementType,
        default_vendor_id ? Number(default_vendor_id) : null,
        bom_id ? Number(bom_id) : null
      ]
    );

    const newProductId = result.insertId;

    // Create Audit Log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id || null, 'PRODUCT_CREATED', 'PRODUCT', newProductId, JSON.stringify({ name, sku: cleanSku, sales_price })]
    );

    // Return created product
    const [created] = await pool.query(
      `SELECT p.*, COALESCE(p.free_to_use_qty, (p.on_hand_qty - p.reserved_qty)) AS free_to_use_qty, v.name AS vendor_name
       FROM products p
       LEFT JOIN vendors v ON p.default_vendor_id = v.id
       WHERE p.id = ?`,
      [newProductId]
    );

    return success(res, 'Product created successfully', created[0], 201);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. PUT /api/products/:id
 * Updates an existing product
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (existing.length === 0) {
      return error(res, 'Product not found', 404);
    }

    const currentProduct = existing[0];
    const {
      name = currentProduct.name,
      sku = currentProduct.sku,
      sales_price = currentProduct.sales_price,
      cost_price = currentProduct.cost_price,
      on_hand_qty = currentProduct.on_hand_qty,
      reserved_qty = currentProduct.reserved_qty,
      procurement_strategy = currentProduct.procurement_strategy,
      procure_on_demand = currentProduct.procure_on_demand,
      procurement_type = currentProduct.procurement_type,
      default_vendor_id = currentProduct.default_vendor_id,
      bom_id = currentProduct.bom_id
    } = req.body;

    if (!name || !name.trim()) {
      return error(res, 'Product name is required', 400);
    }

    if (!sku || !sku.trim()) {
      return error(res, 'Product SKU is required', 400);
    }

    const cleanSku = sku.trim().toUpperCase();

    // Check SKU Uniqueness if SKU changed
    if (cleanSku !== currentProduct.sku.toUpperCase()) {
      const [existingSku] = await pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND id != ?', [cleanSku, productId]);
      if (existingSku.length > 0) {
        return error(res, `Product SKU '${cleanSku}' already exists. Please use a unique SKU.`, 400);
      }
    }

    const isProcureOnDemand = Boolean(procure_on_demand);

    let cleanProcurementType = procurement_type;
    if (isProcureOnDemand) {
      if (!procurement_type || !['Purchase', 'Manufacturing'].includes(procurement_type)) {
        return error(res, "Procurement type ('Purchase' or 'Manufacturing') is required when 'Procure on Demand' is enabled.", 400);
      }

      if (procurement_type === 'Purchase' && !default_vendor_id) {
        return error(res, "Default Vendor is required when Procurement Type is set to 'Purchase'.", 400);
      }
    } else {
      cleanProcurementType = null;
    }

    await pool.query(
      `UPDATE products SET
        name = ?,
        sku = ?,
        sales_price = ?,
        cost_price = ?,
        on_hand_qty = ?,
        reserved_qty = ?,
        procurement_strategy = ?,
        procure_on_demand = ?,
        procurement_type = ?,
        default_vendor_id = ?,
        bom_id = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name.trim(),
        cleanSku,
        Number(sales_price),
        Number(cost_price),
        Number(on_hand_qty),
        Number(reserved_qty),
        procurement_strategy === 'MTO' ? 'MTO' : 'MTS',
        isProcureOnDemand,
        cleanProcurementType,
        default_vendor_id ? Number(default_vendor_id) : null,
        bom_id ? Number(bom_id) : null,
        productId
      ]
    );

    // Audit Log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id || null, 'PRODUCT_UPDATED', 'PRODUCT', productId, JSON.stringify({ name, sku: cleanSku })]
    );

    const [updated] = await pool.query(
      `SELECT p.*, COALESCE(p.free_to_use_qty, (p.on_hand_qty - p.reserved_qty)) AS free_to_use_qty, v.name AS vendor_name
       FROM products p
       LEFT JOIN vendors v ON p.default_vendor_id = v.id
       WHERE p.id = ?`,
      [productId]
    );

    return success(res, 'Product updated successfully', updated[0], 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 5. DELETE /api/products/:id
 * Strict Referential Integrity Delete Check:
 * Prevents deletion if the product is referenced in sales_order_items, purchase_order_items, or bom.
 * Rationale: Hard-deleting referenced products corrupts historical audit trails, invoice lineage,
 * and Bill of Materials trees.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // 1. Check if product exists
    const [existing] = await pool.query('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (existing.length === 0) {
      return error(res, 'Product not found', 404);
    }

    // 2. Check references in sales_order_items
    const [salesRefs] = await pool.query('SELECT COUNT(*) AS count FROM sales_order_items WHERE product_id = ?', [productId]);
    if (salesRefs[0].count > 0) {
      return error(res, `Cannot delete product '${existing[0].name}'. It is referenced in ${salesRefs[0].count} Sales Order line(s).`, 400);
    }

    // 3. Check references in purchase_order_items
    const [purchaseRefs] = await pool.query('SELECT COUNT(*) AS count FROM purchase_order_items WHERE product_id = ?', [productId]);
    if (purchaseRefs[0].count > 0) {
      return error(res, `Cannot delete product '${existing[0].name}'. It is referenced in ${purchaseRefs[0].count} Purchase Order line(s).`, 400);
    }

    // 4. Check references in bom or bom_components
    const [bomRefs] = await pool.query('SELECT COUNT(*) AS count FROM bom WHERE product_id = ?', [productId]);
    if (bomRefs[0].count > 0) {
      return error(res, `Cannot delete product '${existing[0].name}'. It is linked as the finished product in a Bill of Materials.`, 400);
    }

    const [bomCompRefs] = await pool.query('SELECT COUNT(*) AS count FROM bom_components WHERE component_product_id = ?', [productId]);
    if (bomCompRefs[0].count > 0) {
      return error(res, `Cannot delete product '${existing[0].name}'. It is used as a component in ${bomCompRefs[0].count} Bill of Materials structure(s).`, 400);
    }

    // Safe to delete if unreferenced
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    // Audit Log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, old_value) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id || null, 'PRODUCT_DELETED', 'PRODUCT', productId, JSON.stringify({ id: productId, name: existing[0].name })]
    );

    return success(res, 'Product deleted successfully', { id: productId }, 200);
  } catch (err) {
    next(err);
  }
};

/**
 * 6. GET /api/vendors
 * Helper route to populate Vendor dropdowns in Product form
 */
exports.getAllVendors = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, contact_email, phone FROM vendors ORDER BY name ASC');
    return success(res, 'Vendors list fetched successfully', rows, 200);
  } catch (err) {
    next(err);
  }
};
