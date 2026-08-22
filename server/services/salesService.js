const pool = require('../config/db');
const inventoryService = require('./inventoryService');

/**
 * Get all sales orders with item counts and total amount
 */
async function getAllSalesOrders() {
  const [rows] = await pool.query(`
    SELECT 
      so.id,
      so.customer_name,
      so.customer_contact,
      so.status,
      so.created_by,
      u.full_name AS created_by_name,
      so.created_at,
      so.updated_at,
      COUNT(soi.id) AS total_items,
      COALESCE(SUM(soi.quantity * soi.unit_price), 0) AS total_amount
    FROM sales_orders so
    LEFT JOIN users u ON so.created_by = u.id
    LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
    GROUP BY so.id
    ORDER BY so.created_at DESC
  `);
  return rows;
}

/**
 * Get single sales order by ID with all item details & product info
 */
async function getSalesOrderById(orderId) {
  const [orders] = await pool.query(`
    SELECT 
      so.id,
      so.customer_name,
      so.customer_contact,
      so.status,
      so.created_by,
      u.full_name AS created_by_name,
      so.created_at,
      so.updated_at
    FROM sales_orders so
    LEFT JOIN users u ON so.created_by = u.id
    WHERE so.id = ?
  `, [orderId]);

  if (orders.length === 0) return null;
  const order = orders[0];

  const [items] = await pool.query(`
    SELECT 
      soi.id,
      soi.sales_order_id,
      soi.product_id,
      p.name AS product_name,
      p.sku AS product_sku,
      p.on_hand_qty,
      p.reserved_qty,
      (p.on_hand_qty - p.reserved_qty) AS free_to_use_qty,
      p.procurement_strategy,
      soi.quantity,
      soi.delivered_qty,
      soi.unit_price,
      (soi.quantity * soi.unit_price) AS line_total
    FROM sales_order_items soi
    JOIN products p ON soi.product_id = p.id
    WHERE soi.sales_order_id = ?
  `, [orderId]);

  order.items = items;
  order.total_amount = items.reduce((sum, item) => sum + Number(item.line_total), 0);
  return order;
}

/**
 * Create a new Sales Order with product items in Draft state
 */
async function createSalesOrder({ customer_name, customer_contact, items, created_by }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO sales_orders (customer_name, customer_contact, status, created_by) VALUES (?, ?, 'Draft', ?)`,
      [customer_name, customer_contact || null, created_by]
    );

    const salesOrderId = orderResult.insertId;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid product or quantity in sales order items');
      }

      // Fetch sales price if unit_price not provided
      let unitPrice = item.unit_price;
      if (unitPrice === undefined || unitPrice === null) {
        const [prodRows] = await connection.query(`SELECT sales_price FROM products WHERE id = ?`, [item.product_id]);
        if (prodRows.length === 0) throw new Error(`Product ID #${item.product_id} not found`);
        unitPrice = prodRows[0].sales_price;
      }

      await connection.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, delivered_qty, unit_price) VALUES (?, ?, ?, 0, ?)`,
        [salesOrderId, item.product_id, item.quantity, unitPrice]
      );
    }

    // Record audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, 'CREATE_SALES_ORDER', 'sales_orders', ?, ?)`,
      [created_by, salesOrderId, JSON.stringify({ salesOrderId, customer_name, itemCount: items.length })]
    );

    await connection.commit();
    return getSalesOrderById(salesOrderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Confirm a Sales Order: Checks stock availability & reserves stock
 */
async function confirmSalesOrder(orderId, userId) {
  const order = await getSalesOrderById(orderId);
  if (!order) throw new Error('Sales order not found');
  if (order.status !== 'Draft') throw new Error(`Cannot confirm order in '${order.status}' state`);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Reserve stock for each item in the order
    for (const item of order.items) {
      await inventoryService.reserveStock(item.product_id, item.quantity, connection);
    }

    // 2. Update order status to Confirmed
    await connection.query(
      `UPDATE sales_orders SET status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    // 3. Record audit log
    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, 'CONFIRM_SALES_ORDER', 'sales_orders', ?, ?)`,
      [userId, orderId, JSON.stringify({ salesOrderId: orderId, previousStatus: 'Draft', newStatus: 'Confirmed' })]
    );

    await connection.commit();
    return getSalesOrderById(orderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Deliver items for a Sales Order: Reduces stock & updates status
 */
async function deliverSalesOrder(orderId, deliveries, userId) {
  const order = await getSalesOrderById(orderId);
  if (!order) throw new Error('Sales order not found');
  if (order.status !== 'Confirmed' && order.status !== 'PartiallyDelivered') {
    throw new Error(`Cannot deliver order in '${order.status}' state`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const d of deliveries) {
      const item = order.items.find(i => i.id === d.item_id || i.product_id === d.product_id);
      if (!item) continue;

      const qtyToDeliver = Number(d.deliver_qty || 0);
      if (qtyToDeliver <= 0) continue;

      const remainingToDeliver = item.quantity - item.delivered_qty;
      if (qtyToDeliver > remainingToDeliver) {
        throw new Error(`Cannot deliver ${qtyToDeliver} units for ${item.product_name}. Max remaining is ${remainingToDeliver}`);
      }

      // Record stock outflow in stock ledger and update on_hand_qty & reserved_qty
      await inventoryService.recordStockMovement({
        productId: item.product_id,
        movementType: 'SalesDelivery',
        quantityChange: -qtyToDeliver,
        referenceType: 'sales_orders',
        referenceId: orderId,
        connection
      });

      // Update delivered_qty in sales_order_items
      await connection.query(
        `UPDATE sales_order_items SET delivered_qty = delivered_qty + ? WHERE id = ?`,
        [qtyToDeliver, item.id]
      );
    }

    // Determine new status based on all items
    const [updatedItems] = await connection.query(
      `SELECT quantity, delivered_qty FROM sales_order_items WHERE sales_order_id = ?`,
      [orderId]
    );

    const totalOrdered = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalDelivered = updatedItems.reduce((sum, i) => sum + i.delivered_qty, 0);

    let newStatus = 'Confirmed';
    if (totalDelivered >= totalOrdered) {
      newStatus = 'FullyDelivered';
    } else if (totalDelivered > 0) {
      newStatus = 'PartiallyDelivered';
    }

    await connection.query(
      `UPDATE sales_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, orderId]
    );

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, 'DELIVER_SALES_ORDER', 'sales_orders', ?, ?)`,
      [userId, orderId, JSON.stringify({ salesOrderId: orderId, totalDelivered, newStatus })]
    );

    await connection.commit();
    return getSalesOrderById(orderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Cancel a Sales Order & release reserved stock
 */
async function cancelSalesOrder(orderId, userId) {
  const order = await getSalesOrderById(orderId);
  if (!order) throw new Error('Sales order not found');
  if (order.status === 'FullyDelivered' || order.status === 'Cancelled') {
    throw new Error(`Cannot cancel order in '${order.status}' state`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Release reserved stock if confirmed
    if (order.status === 'Confirmed' || order.status === 'PartiallyDelivered') {
      for (const item of order.items) {
        const unfulfilledQty = item.quantity - item.delivered_qty;
        if (unfulfilledQty > 0) {
          await inventoryService.releaseReservedStock(item.product_id, unfulfilledQty, connection);
        }
      }
    }

    await connection.query(
      `UPDATE sales_orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, new_value) VALUES (?, 'CANCEL_SALES_ORDER', 'sales_orders', ?, ?)`,
      [userId, orderId, JSON.stringify({ salesOrderId: orderId, previousStatus: order.status })]
    );

    await connection.commit();
    return getSalesOrderById(orderId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  confirmSalesOrder,
  deliverSalesOrder,
  cancelSalesOrder
};
