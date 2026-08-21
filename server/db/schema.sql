-- =============================================================================
-- SHIV FURNITURE WORKS - MINI ERP DATABASE SCHEMA
-- Target Database: MySQL 8.0+
-- File: schema.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `shiv_erp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `shiv_erp`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. ROLES TABLE (Supports existing RBAC system)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `role_name`, `description`) VALUES
(1, 'Admin', 'Full administrative access to all modules and audit logs'),
(2, 'SalesUser', 'Access to manage customer orders and sales workflows'),
(3, 'PurchaseUser', 'Access to purchase orders and vendor replenishment'),
(4, 'ManufacturingUser', 'Access to BoMs, manufacturing orders and work center execution'),
(5, 'InventoryManager', 'Access to product stock, warehouse movement, and stock ledgers'),
(6, 'BusinessOwner', 'Executive monitoring across products, sales, and operations')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE (Adapted to existing authController schema & ENUM requirements)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `login_id` VARCHAR(100) NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NULL,
  `role` ENUM('Admin', 'SalesUser', 'PurchaseUser', 'ManufacturingUser', 'InventoryManager', 'BusinessOwner') NOT NULL DEFAULT 'SalesUser',
  `department` VARCHAR(100) NULL,
  `status` VARCHAR(20) DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. VENDORS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `vendors`;
CREATE TABLE `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `contact_email` VARCHAR(150) NULL,
  `phone` VARCHAR(30) NULL,
  `address` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vendors_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE (with VIRTUAL generated column for free_to_use_qty)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `sales_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `on_hand_qty` INT NOT NULL DEFAULT 0,
  `reserved_qty` INT NOT NULL DEFAULT 0,
  -- Virtual Generated Column: automatically computes (on_hand_qty - reserved_qty)
  `free_to_use_qty` INT GENERATED ALWAYS AS (`on_hand_qty` - `reserved_qty`) VIRTUAL,
  `procurement_strategy` ENUM('MTS', 'MTO') NOT NULL DEFAULT 'MTS',
  `procure_on_demand` BOOLEAN NOT NULL DEFAULT FALSE,
  `procurement_type` ENUM('Purchase', 'Manufacturing') NULL,
  `default_vendor_id` INT NULL,
  `bom_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_vendor` FOREIGN KEY (`default_vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL,
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_strategy` (`procurement_strategy`),
  INDEX `idx_products_type` (`procurement_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. BILL OF MATERIALS (BOM) TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bom`;
CREATE TABLE `bom` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bom_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_bom_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred Circular FK from products.bom_id to bom.id
ALTER TABLE `products` 
ADD CONSTRAINT `fk_products_bom` FOREIGN KEY (`bom_id`) REFERENCES `bom` (`id`) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 6. BOM COMPONENTS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bom_components`;
CREATE TABLE `bom_components` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bom_id` INT NOT NULL,
  `component_product_id` INT NOT NULL,
  `quantity_required` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_bom_components_bom` FOREIGN KEY (`bom_id`) REFERENCES `bom` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_components_product` FOREIGN KEY (`component_product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_bom_comp_bom_id` (`bom_id`),
  INDEX `idx_bom_comp_product_id` (`component_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. WORK CENTERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `work_centers`;
CREATE TABLE `work_centers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. BOM OPERATIONS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bom_operations`;
CREATE TABLE `bom_operations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bom_id` INT NOT NULL,
  `operation_name` VARCHAR(100) NOT NULL,
  `work_center_id` INT NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 0,
  `sequence_order` INT NOT NULL DEFAULT 1,
  CONSTRAINT `fk_bom_ops_bom` FOREIGN KEY (`bom_id`) REFERENCES `bom` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_ops_work_center` FOREIGN KEY (`work_center_id`) REFERENCES `work_centers` (`id`) ON DELETE RESTRICT,
  INDEX `idx_bom_ops_bom_id` (`bom_id`),
  INDEX `idx_bom_ops_wc_id` (`work_center_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. SALES ORDERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `sales_orders`;
CREATE TABLE `sales_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_contact` VARCHAR(100) NULL,
  `status` ENUM('Draft', 'Confirmed', 'PartiallyDelivered', 'FullyDelivered', 'Cancelled') NOT NULL DEFAULT 'Draft',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sales_orders_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_so_status` (`status`),
  INDEX `idx_so_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. SALES ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `sales_order_items`;
CREATE TABLE `sales_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `delivered_qty` INT NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_so_items_order` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_so_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_soi_order_id` (`sales_order_id`),
  INDEX `idx_soi_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. PURCHASE ORDERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` INT NOT NULL,
  `status` ENUM('Draft', 'Confirmed', 'PartiallyReceived', 'FullyReceived') NOT NULL DEFAULT 'Draft',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_po_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_po_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_po_vendor_id` (`vendor_id`),
  INDEX `idx_po_status` (`status`),
  INDEX `idx_po_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. PURCHASE ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `purchase_order_items`;
CREATE TABLE `purchase_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `received_qty` INT NOT NULL DEFAULT 0,
  `unit_cost` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  CONSTRAINT `fk_po_items_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_po_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_poi_order_id` (`purchase_order_id`),
  INDEX `idx_poi_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. MANUFACTURING ORDERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `manufacturing_orders`;
CREATE TABLE `manufacturing_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `bom_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `status` ENUM('Draft', 'InProgress', 'Done', 'Cancelled') NOT NULL DEFAULT 'Draft',
  `assignee_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mo_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mo_bom` FOREIGN KEY (`bom_id`) REFERENCES `bom` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mo_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_mo_product_id` (`product_id`),
  INDEX `idx_mo_bom_id` (`bom_id`),
  INDEX `idx_mo_status` (`status`),
  INDEX `idx_mo_assignee_id` (`assignee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. WORK ORDERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `manufacturing_order_id` INT NOT NULL,
  `operation_name` VARCHAR(100) NOT NULL,
  `work_center_id` INT NOT NULL,
  `status` ENUM('Pending', 'InProgress', 'Done') NOT NULL DEFAULT 'Pending',
  `assigned_to` INT NULL,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  CONSTRAINT `fk_wo_mo` FOREIGN KEY (`manufacturing_order_id`) REFERENCES `manufacturing_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wo_work_center` FOREIGN KEY (`work_center_id`) REFERENCES `work_centers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_wo_user` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_wo_mo_id` (`manufacturing_order_id`),
  INDEX `idx_wo_work_center_id` (`work_center_id`),
  INDEX `idx_wo_status` (`status`),
  INDEX `idx_wo_assigned_to` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. STOCK LEDGER TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `stock_ledger`;
CREATE TABLE `stock_ledger` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `movement_type` ENUM('SalesDelivery', 'PurchaseReceipt', 'ManufacturingConsume', 'ManufacturingProduce', 'ManualAdjustment') NOT NULL,
  `quantity_change` INT NOT NULL,
  `reference_type` VARCHAR(50) NOT NULL,
  `reference_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_stock_ledger_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  INDEX `idx_sl_product_id` (`product_id`),
  INDEX `idx_sl_movement_type` (`movement_type`),
  INDEX `idx_sl_ref` (`reference_type`, `reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `old_value` JSON NULL,
  `new_value` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_user_id` (`user_id`),
  INDEX `idx_audit_action` (`action_type`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. PERMISSION TEMPLATES TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `permission_templates`;
CREATE TABLE `permission_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('Admin', 'User') NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `field_name` VARCHAR(50) NOT NULL,
  `can_create` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_view` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_edit` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_delete` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_template_role_module_field` (`role`, `module`, `field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. USER FIELD PERMISSIONS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `user_field_permissions`;
CREATE TABLE `user_field_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `field_name` VARCHAR(50) NOT NULL,
  `can_create` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_view` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_edit` BOOLEAN NOT NULL DEFAULT TRUE,
  `can_delete` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ufp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_user_module_field` (`user_id`, `module`, `field_name`),
  INDEX `idx_ufp_user_module` (`user_id`, `module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Permission Templates
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('Admin', 'Sales', 'customer', true, true, true, true),
('Admin', 'Sales', 'customer_address', true, true, true, true),
('Admin', 'Sales', 'sales_person', true, true, true, true),
('Admin', 'Sales', 'product', true, true, true, true),
('Admin', 'Sales', 'ordered_quantity', true, true, true, true),
('Admin', 'Sales', 'delivered_quantity', true, true, true, true),
('Admin', 'Sales', 'sales_price', true, true, true, true),
('Admin', 'Sales', 'status', true, true, true, true),
('Admin', 'Sales', 'total', true, true, true, true),
('Admin', 'Sales', 'creation_date', true, true, false, false),
('User', 'Sales', 'customer', true, true, true, true),
('User', 'Sales', 'customer_address', true, true, true, true),
('User', 'Sales', 'sales_person', true, true, true, true),
('User', 'Sales', 'product', true, true, true, true),
('User', 'Sales', 'ordered_quantity', true, true, true, true),
('User', 'Sales', 'delivered_quantity', true, true, true, true),
('User', 'Sales', 'sales_price', true, true, true, true),
('User', 'Sales', 'status', true, true, true, false),
('User', 'Sales', 'total', true, true, false, true),
('User', 'Sales', 'creation_date', false, true, false, false),

('Admin', 'Purchase', 'vendor', true, true, true, true),
('Admin', 'Purchase', 'vendor_address', true, true, true, true),
('Admin', 'Purchase', 'responsible_person', true, true, true, true),
('Admin', 'Purchase', 'product', true, true, true, true),
('Admin', 'Purchase', 'ordered_quantity', true, true, true, true),
('Admin', 'Purchase', 'received_quantity', true, true, true, true),
('Admin', 'Purchase', 'cost_price', true, true, true, true),
('Admin', 'Purchase', 'total', true, true, true, true),
('Admin', 'Purchase', 'creation_date', true, true, false, false),
('User', 'Purchase', 'vendor', true, true, true, true),
('User', 'Purchase', 'vendor_address', true, true, true, true),
('User', 'Purchase', 'responsible_person', true, true, true, true),
('User', 'Purchase', 'product', true, true, true, true),
('User', 'Purchase', 'ordered_quantity', true, true, true, true),
('User', 'Purchase', 'received_quantity', true, true, true, true),
('User', 'Purchase', 'cost_price', true, true, true, true),
('User', 'Purchase', 'total', true, true, false, true),
('User', 'Purchase', 'creation_date', false, true, false, false),

('Admin', 'Manufacturing', 'product_to_manufacture', true, true, true, true),
('Admin', 'Manufacturing', 'product_quantity', true, true, true, true),
('Admin', 'Manufacturing', 'bom', true, true, true, true),
('Admin', 'Manufacturing', 'responsible_person', true, true, true, true),
('Admin', 'Manufacturing', 'finished_quantity', true, true, true, true),
('Admin', 'Manufacturing', 'creation_date', true, true, false, false),
('User', 'Manufacturing', 'product_to_manufacture', true, true, true, true),
('User', 'Manufacturing', 'product_quantity', true, true, true, true),
('User', 'Manufacturing', 'bom', true, true, true, true),
('User', 'Manufacturing', 'responsible_person', true, true, true, true),
('User', 'Manufacturing', 'finished_quantity', true, true, true, true),
('User', 'Manufacturing', 'creation_date', false, true, false, false),

('Admin', 'Product', 'product', true, true, true, true),
('Admin', 'Product', 'sales_price', true, true, true, true),
('Admin', 'Product', 'cost_price', true, true, true, true),
('Admin', 'Product', 'on_hand_qty', true, true, true, true),
('Admin', 'Product', 'free_to_use_qty', false, true, false, false),
('Admin', 'Product', 'procure_on_demand', true, true, true, true),
('Admin', 'Product', 'procurement_method', true, true, true, true),
('Admin', 'Product', 'vendor', true, true, true, true),
('Admin', 'Product', 'bill_of_materials', true, true, true, true),
('User', 'Product', 'product', true, true, true, true),
('User', 'Product', 'sales_price', true, true, true, true),
('User', 'Product', 'cost_price', true, true, true, true),
('User', 'Product', 'on_hand_qty', false, true, false, false),
('User', 'Product', 'free_to_use_qty', false, true, false, false),
('User', 'Product', 'procure_on_demand', false, true, true, true),
('User', 'Product', 'procurement_method', false, true, true, true),
('User', 'Product', 'vendor', true, true, true, true),
('User', 'Product', 'bill_of_materials', true, true, true, true)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

SET FOREIGN_KEY_CHECKS = 1;
