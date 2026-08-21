-- =============================================================================
-- SHIV FURNITURE WORKS - FIELD-LEVEL PERMISSIONS SCHEMA & SEED DATA
-- Migration: 002_permission_system.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. PERMISSION TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS `permission_templates` (
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

-- 2. USER FIELD PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS `user_field_permissions` (
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

-- -----------------------------------------------------------------------------
-- SEED DEFAULT ROLE TEMPLATES (Admin & User per-field defaults)
-- -----------------------------------------------------------------------------

-- --- A. SALES MODULE ---
-- Admin Template for Sales
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
('Admin', 'Sales', 'creation_date', true, true, false, false)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- User Template for Sales
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('User', 'Sales', 'customer', true, true, true, true),
('User', 'Sales', 'customer_address', true, true, true, true),
('User', 'Sales', 'sales_person', true, true, true, true),
('User', 'Sales', 'product', true, true, true, true),
('User', 'Sales', 'ordered_quantity', true, true, true, true),
('User', 'Sales', 'delivered_quantity', true, true, true, true),
('User', 'Sales', 'sales_price', true, true, true, true),
('User', 'Sales', 'status', true, true, true, false),            -- Delete=false for User
('User', 'Sales', 'total', true, true, false, true),             -- Edit=false (Recomputed)
('User', 'Sales', 'creation_date', false, true, false, false)    -- Auto creation, immutable
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);


-- --- B. PURCHASE MODULE ---
-- Admin Template for Purchase
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('Admin', 'Purchase', 'vendor', true, true, true, true),
('Admin', 'Purchase', 'vendor_address', true, true, true, true),
('Admin', 'Purchase', 'responsible_person', true, true, true, true),
('Admin', 'Purchase', 'product', true, true, true, true),
('Admin', 'Purchase', 'ordered_quantity', true, true, true, true),
('Admin', 'Purchase', 'received_quantity', true, true, true, true),
('Admin', 'Purchase', 'cost_price', true, true, true, true),
('Admin', 'Purchase', 'total', true, true, true, true),
('Admin', 'Purchase', 'creation_date', true, true, false, false)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- User Template for Purchase
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('User', 'Purchase', 'vendor', true, true, true, true),
('User', 'Purchase', 'vendor_address', true, true, true, true),
('User', 'Purchase', 'responsible_person', true, true, true, true),
('User', 'Purchase', 'product', true, true, true, true),
('User', 'Purchase', 'ordered_quantity', true, true, true, true),
('User', 'Purchase', 'received_quantity', true, true, true, true),
('User', 'Purchase', 'cost_price', true, true, true, true),
('User', 'Purchase', 'total', true, true, false, true),          -- Edit=false (Auto Recomputed)
('User', 'Purchase', 'creation_date', false, true, false, false)  -- Auto creation, immutable
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);


-- --- C. MANUFACTURING MODULE ---
-- Admin Template for Manufacturing
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('Admin', 'Manufacturing', 'product_to_manufacture', true, true, true, true),
('Admin', 'Manufacturing', 'product_quantity', true, true, true, true),
('Admin', 'Manufacturing', 'bom', true, true, true, true),
('Admin', 'Manufacturing', 'responsible_person', true, true, true, true),
('Admin', 'Manufacturing', 'finished_quantity', true, true, true, true),
('Admin', 'Manufacturing', 'creation_date', true, true, false, false)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- User Template for Manufacturing
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('User', 'Manufacturing', 'product_to_manufacture', true, true, true, true),
('User', 'Manufacturing', 'product_quantity', true, true, true, true),
('User', 'Manufacturing', 'bom', true, true, true, true),
('User', 'Manufacturing', 'responsible_person', true, true, true, true),
('User', 'Manufacturing', 'finished_quantity', true, true, true, true),
('User', 'Manufacturing', 'creation_date', false, true, false, false) -- Auto creation, immutable
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);


-- --- D. PRODUCT MODULE ---
-- Admin Template for Product
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('Admin', 'Product', 'product', true, true, true, true),
('Admin', 'Product', 'sales_price', true, true, true, true),
('Admin', 'Product', 'cost_price', true, true, true, true),
('Admin', 'Product', 'on_hand_qty', true, true, true, true),
('Admin', 'Product', 'free_to_use_qty', false, true, false, false), -- Virtual computed
('Admin', 'Product', 'procure_on_demand', true, true, true, true),
('Admin', 'Product', 'procurement_method', true, true, true, true),
('Admin', 'Product', 'vendor', true, true, true, true),
('Admin', 'Product', 'bill_of_materials', true, true, true, true)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- User Template for Product
INSERT INTO `permission_templates` (`role`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`) VALUES
('User', 'Product', 'product', true, true, true, true),
('User', 'Product', 'sales_price', true, true, true, true),
('User', 'Product', 'cost_price', true, true, true, true),
('User', 'Product', 'on_hand_qty', false, true, false, false),            -- View only (managed via stock ledger)
('User', 'Product', 'free_to_use_qty', false, true, false, false),        -- View only (computed)
('User', 'Product', 'procure_on_demand', false, true, true, true),        -- Create=false (Admin sets on creation)
('User', 'Product', 'procurement_method', false, true, true, true),       -- Create=false (Admin sets on creation)
('User', 'Product', 'vendor', true, true, true, true),
('User', 'Product', 'bill_of_materials', true, true, true, true)
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

SET FOREIGN_KEY_CHECKS = 1;
