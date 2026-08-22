const pool = require('../config/db');

/**
 * Record a transaction-safe stock movement in stock_ledger and update product quantities
 */
async function recordStockMovement({
  productId,
  movementType,
  quantityChange,
  referenceType,
  referenceId,
  connection: existingConnection = null
}) {
  const connection = existingConnection || (await pool.getConnection());
  const isSelfManagedTx = !existingConnection;

  try {
    if (isSelfManagedTx) {
      await connection.beginTransaction();
    }

    const [products] = await connection.query('SELECT id, name, on_hand_qty, reserved_qty FROM products WHERE id = ? FOR UPDATE', [productId]);
    if (products.length === 0) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    const product = products[0];

    // Check if outflow movement would cause negative stock
    if (quantityChange < 0 && Math.abs(quantityChange) > product.on_hand_qty) {
      console.warn(`[Inventory Warning] Outflow of ${Math.abs(quantityChange)} units exceeds on-hand stock (${product.on_hand_qty}) for Product #${productId}`);
    }

    // Insert into stock_ledger
    await connection.query(
      `INSERT INTO stock_ledger (product_id, movement_type, quantity_change, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)`,
      [productId, movementType, quantityChange, referenceType, referenceId]
    );

    // Update on_hand_qty and adjust reserved_qty for sales delivery
    if (movementType === 'SalesDelivery') {
      await connection.query(
        `UPDATE products SET 
          on_hand_qty = GREATEST(0, on_hand_qty + ?),
          reserved_qty = GREATEST(0, reserved_qty + ?),
          updated_at = NOW() 
         WHERE id = ?`,
        [quantityChange, quantityChange, productId]
      );
    } else {
      await connection.query(
        `UPDATE products SET on_hand_qty = GREATEST(0, on_hand_qty + ?), updated_at = NOW() WHERE id = ?`,
        [quantityChange, productId]
      );
    }

    if (isSelfManagedTx) {
      await connection.commit();
    }

    return { success: true, productId, newOnHand: product.on_hand_qty + quantityChange };
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
 * Supports both ({ productId, quantity }, connection) and (productId, quantity, connection)
 */
async function reserveStock(param1, param2, param3) {
  let productId, quantity, existingConnection;
  if (typeof param1 === 'object' && param1 !== null) {
    productId = param1.productId;
    quantity = param1.quantity;
    existingConnection = param2;
  } else {
    productId = param1;
    quantity = param2;
    existingConnection = param3;
  }

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
 * Decrement reserved_qty on a product (for order cancellations).
 * Supports both ({ productId, quantity }, connection) and (productId, quantity, connection)
 */
async function releaseReservedStock(param1, param2, param3) {
  let productId, quantity, existingConnection;
  if (typeof param1 === 'object' && param1 !== null) {
    productId = param1.productId;
    quantity = param1.quantity;
    existingConnection = param2;
  } else {
    productId = param1;
    quantity = param2;
    existingConnection = param3;
  }

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
