const pool = require('../config/db');

/**
 * Record a physical stock movement and update product on_hand_qty in a database transaction.
 * 
 * @param {Object} params
 * @param {number} params.productId - ID of the product
 * @param {'SalesDelivery'|'PurchaseReceipt'|'ManufacturingConsume'|'ManufacturingProduce'|'ManualAdjustment'} params.movementType - Category of stock movement
 * @param {number} params.quantityChange - Signed integer (negative for outflow, positive for inflow)
 * @param {string} params.referenceType - Reference entity name (e.g., 'SalesOrder', 'PurchaseOrder', 'ManufacturingOrder', 'ManualAdjustment')
 * @param {number} params.referenceId - ID of reference entity
 * @param {Object} [existingConnection] - Optional existing DB transaction connection
 */
async function recordStockMovement({ productId, movementType, quantityChange, referenceType, referenceId }, existingConnection = null) {
  const connection = existingConnection || (await pool.getConnection());
  const isSelfManagedTx = !existingConnection;

  try {
    if (isSelfManagedTx) {
      await connection.beginTransaction();
    }

    // 1. Verify product exists
    const [products] = await connection.query('SELECT id, name, on_hand_qty, reserved_qty FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (products.length === 0) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const product = products[0];

    // Optional check: warn or throw if stock would drop below 0 on outbound movement
    const newOnHandQty = Number(product.on_hand_qty) + Number(quantityChange);
    if (newOnHandQty < 0) {
      throw new Error(`Insufficient stock for product '${product.name}' (ID: ${productId}). On-hand: ${product.on_hand_qty}, Requested change: ${quantityChange}`);
    }

    // 2. Insert Stock Ledger Entry
    const [ledgerResult] = await connection.query(
      `INSERT INTO stock_ledger (product_id, movement_type, quantity_change, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [productId, movementType, quantityChange, referenceType || 'ManualAdjustment', referenceId || 0]
    );

    // 3. Update Product on_hand_qty
    await connection.query(
      `UPDATE products SET on_hand_qty = on_hand_qty + ?, updated_at = NOW() WHERE id = ?`,
      [quantityChange, productId]
    );

    if (isSelfManagedTx) {
      await connection.commit();
    }

    return {
      success: true,
      ledgerId: ledgerResult.insertId,
      productId,
      oldOnHandQty: product.on_hand_qty,
      newOnHandQty,
      quantityChange
    };
  } catch (error) {
    if (isSelfManagedTx) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (isSelfManagedTx) {
      connection.release();
    }
  }
}

/**
 * Increment reserved_qty on a product (for order confirmations).
 */
async function reserveStock({ productId, quantity }, existingConnection = null) {
  const connection = existingConnection || (await pool.getConnection());
  const isSelfManagedTx = !existingConnection;

  try {
    if (isSelfManagedTx) {
      await connection.beginTransaction();
    }

    const [products] = await connection.query('SELECT id, name, reserved_qty FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (products.length === 0) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    await connection.query(
      `UPDATE products SET reserved_qty = reserved_qty + ?, updated_at = NOW() WHERE id = ?`,
      [quantity, productId]
    );

    if (isSelfManagedTx) {
      await connection.commit();
    }

    return { success: true, productId, reservedAdded: quantity };
  } catch (error) {
    if (isSelfManagedTx) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (isSelfManagedTx) {
      connection.release();
    }
  }
}

/**
 * Decrement reserved_qty on a product (for order cancellations or completed consumption).
 */
async function releaseReservedStock({ productId, quantity }, existingConnection = null) {
  const connection = existingConnection || (await pool.getConnection());
  const isSelfManagedTx = !existingConnection;

  try {
    if (isSelfManagedTx) {
      await connection.beginTransaction();
    }

    const [products] = await connection.query('SELECT id, name, reserved_qty FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (products.length === 0) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    await connection.query(
      `UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - ?), updated_at = NOW() WHERE id = ?`,
      [quantity, productId]
    );

    if (isSelfManagedTx) {
      await connection.commit();
    }

    return { success: true, productId, reservedReleased: quantity };
  } catch (error) {
    if (isSelfManagedTx) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (isSelfManagedTx) {
      connection.release();
    }
  }
}

module.exports = {
  recordStockMovement,
  reserveStock,
  releaseReservedStock
};
