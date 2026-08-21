const { success } = require('../utils/response');

const createPlaceholderHandler = (moduleName) => {
  return async (req, res, next) => {
    try {
      return success(res, `Access granted to ${moduleName} module API endpoint`, {
        module: moduleName,
        method: req.method,
        path: req.originalUrl,
        user: {
          id: req.user.id,
          name: req.user.full_name,
          email: req.user.email,
          role: req.user.role_name
        }
      }, 200);
    } catch (err) {
      next(err);
    }
  };
};

exports.getProducts = createPlaceholderHandler('Products');
exports.createProduct = createPlaceholderHandler('Products (Create)');
exports.updateProduct = createPlaceholderHandler('Products (Update)');
exports.deleteProduct = createPlaceholderHandler('Products (Delete)');

exports.getSales = createPlaceholderHandler('Sales');
exports.createSale = createPlaceholderHandler('Sales (Create)');
exports.updateSale = createPlaceholderHandler('Sales (Update)');
exports.deleteSale = createPlaceholderHandler('Sales (Delete)');

exports.getPurchase = createPlaceholderHandler('Purchase');
exports.createPurchase = createPlaceholderHandler('Purchase (Create)');
exports.updatePurchase = createPlaceholderHandler('Purchase (Update)');
exports.deletePurchase = createPlaceholderHandler('Purchase (Delete)');

exports.getManufacturing = createPlaceholderHandler('Manufacturing');
exports.createManufacturing = createPlaceholderHandler('Manufacturing (Create)');
exports.updateManufacturing = createPlaceholderHandler('Manufacturing (Update)');
exports.deleteManufacturing = createPlaceholderHandler('Manufacturing (Delete)');

exports.getInventory = createPlaceholderHandler('Inventory');
exports.createInventory = createPlaceholderHandler('Inventory (Create)');
exports.updateInventory = createPlaceholderHandler('Inventory (Update)');
exports.deleteInventory = createPlaceholderHandler('Inventory (Delete)');

exports.getAuditLogs = createPlaceholderHandler('Audit Logs');
