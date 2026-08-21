-- Migration 003: Seed Default Users and Field Permissions
-- Password for all seed users: Admin123!
-- Bcrypt Hash: $2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Insert Default Users (role_id 1=Admin, 2=SalesUser, 3=PurchaseUser, 4=ManufacturingUser, 5=InventoryManager, 6=BusinessOwner)
INSERT INTO `users` (`id`, `full_name`, `login_id`, `email`, `password_hash`, `role_id`, `department`, `status`) VALUES
(1, 'Shiv Admin', 'admin@shivfurniture.com', 'admin@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 1, 'IT Administration', 'Active'),
(2, 'Sales Executive', 'sales@shivfurniture.com', 'sales@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 2, 'Sales & Marketing', 'Active'),
(3, 'Procurement Officer', 'purchase@shivfurniture.com', 'purchase@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 3, 'Procurement & Logistics', 'Active'),
(4, 'Production Supervisor', 'mfg@shivfurniture.com', 'mfg@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 4, 'Manufacturing Operations', 'Active'),
(5, 'Warehouse Manager', 'inventory@shivfurniture.com', 'inventory@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 5, 'Inventory Control', 'Active'),
(6, 'Shiv Kumar', 'owner@shivfurniture.com', 'owner@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 6, 'Executive Management', 'Active')
ON DUPLICATE KEY UPDATE 
  `full_name` = VALUES(`full_name`),
  `password_hash` = VALUES(`password_hash`),
  `role_id` = VALUES(`role_id`),
  `department` = VALUES(`department`),
  `status` = 'Active';

-- 2. Seed Default Field Permissions for all 6 users from permission_templates
-- Admin (User ID 1)
INSERT INTO `user_field_permissions` (`user_id`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`)
SELECT 1, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`
FROM `permission_templates` WHERE `role` = 'Admin'
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

-- Non-Admin Users (User IDs 2, 3, 4, 5, 6)
INSERT INTO `user_field_permissions` (`user_id`, `module`, `field_name`, `can_create`, `can_view`, `can_edit`, `can_delete`)
SELECT u.id, pt.`module`, pt.`field_name`, pt.`can_create`, pt.`can_view`, pt.`can_edit`, pt.`can_delete`
FROM `users` u
CROSS JOIN `permission_templates` pt
WHERE u.id IN (2, 3, 4, 5, 6) AND pt.`role` = 'User'
ON DUPLICATE KEY UPDATE `can_create`=VALUES(`can_create`), `can_view`=VALUES(`can_view`), `can_edit`=VALUES(`can_edit`), `can_delete`=VALUES(`can_delete`);

SET FOREIGN_KEY_CHECKS = 1;
