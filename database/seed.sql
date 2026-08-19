-- Seed data for Shiv Furniture Works - Mini ERP (Authentication Layer)
-- Target DBMS: MySQL 8.0+

USE `shiv_erp`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `password_reset_tokens`;
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. SEED ROLES
INSERT INTO `roles` (`id`, `role_name`, `description`) VALUES
(1, 'Admin', 'System Administrator with full permissions'),
(2, 'Sales User', 'Sales Representative with sales order access'),
(3, 'Purchase User', 'Procurement Agent with purchase order access'),
(4, 'Manufacturing User', 'Manufacturing Operator with work order & MO access'),
(5, 'Inventory Manager', 'Warehouse manager tracking stock and movement'),
(6, 'Business Owner', 'Dashboard access and product policy monitoring');

-- 2. SEED USERS
-- All passwords are pre-hashed using bcrypt with: Admin123!
-- Bcrypt Hash: $2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu
INSERT INTO `users` (`id`, `full_name`, `login_id`, `email`, `password_hash`, `role_id`, `department`, `status`) VALUES
(1, 'Shiv Admin', 'admin', 'admin@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 1, 'IT Administration', 'Active'),
(2, 'Sales Executive', 'sales', 'sales@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 2, 'Sales & Marketing', 'Active'),
(3, 'Procurement Officer', 'purchase', 'purchase@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 3, 'Procurement & Logistics', 'Active'),
(4, 'Production Supervisor', 'manufacturing', 'mfg@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 4, 'Manufacturing Operations', 'Active'),
(5, 'Warehouse Manager', 'inventory', 'inventory@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 5, 'Inventory Control', 'Active'),
(6, 'Shiv Kumar', 'owner', 'owner@shivfurniture.com', '$2b$10$gkLmLp1HTWMsy/LVyeNLa..xoB/XP3.f/bQM6metM0q92CXtG3HOu', 6, 'Executive Management', 'Active');

-- 3. SEED SYSTEM INITIAL AUDIT LOGS
INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`) VALUES
(1, 'SYSTEM_INITIALIZATION', 'SYSTEM', NULL, NULL, 'ERP Auth System initialized with roles and user credentials.');
