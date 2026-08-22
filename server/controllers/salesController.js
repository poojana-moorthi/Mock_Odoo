const salesService = require('../services/salesService');
const { success, error } = require('../utils/response');

/**
 * GET /api/sales
 */
async function getSalesOrders(req, res, next) {
  try {
    const orders = await salesService.getAllSalesOrders();
    return success(res, 'Sales orders retrieved successfully', orders);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/:id
 */
async function getSalesOrderDetails(req, res, next) {
  try {
    const order = await salesService.getSalesOrderById(req.params.id);
    if (!order) {
      return error(res, 'Sales order not found', 404);
    }
    return success(res, 'Sales order details retrieved', order);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sales
 */
async function createSalesOrder(req, res, next) {
  try {
    const { customer_name, customer_contact, items } = req.body;
    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return error(res, 'Customer name and at least one product item are required', 400);
    }

    const createdBy = req.user?.id || 1;
    const newOrder = await salesService.createSalesOrder({
      customer_name,
      customer_contact,
      items,
      created_by: createdBy
    });

    return success(res, 'Sales order created successfully', newOrder, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sales/:id/confirm
 */
async function confirmSalesOrder(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.user?.id || 1;
    const updatedOrder = await salesService.confirmSalesOrder(orderId, userId);
    return success(res, 'Sales order confirmed and stock reserved', updatedOrder);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sales/:id/deliver
 */
async function deliverSalesOrder(req, res, next) {
  try {
    const orderId = req.params.id;
    const { deliveries } = req.body; // array of { item_id/product_id, deliver_qty }
    if (!Array.isArray(deliveries) || deliveries.length === 0) {
      return error(res, 'Deliveries items array is required', 400);
    }

    const userId = req.user?.id || 1;
    const updatedOrder = await salesService.deliverSalesOrder(orderId, deliveries, userId);
    return success(res, 'Sales order delivery processed and inventory updated', updatedOrder);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sales/:id/cancel
 */
async function cancelSalesOrder(req, res, next) {
  try {
    const orderId = req.params.id;
    const userId = req.user?.id || 1;
    const updatedOrder = await salesService.cancelSalesOrder(orderId, userId);
    return success(res, 'Sales order cancelled and reserved stock released', updatedOrder);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSalesOrders,
  getSalesOrderDetails,
  createSalesOrder,
  confirmSalesOrder,
  deliverSalesOrder,
  cancelSalesOrder
};
