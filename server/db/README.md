# Shiv Furniture Works - Database Schema & Migrations Guide

## Architectural Overview

This database schema is designed for a modular **Mini ERP System** managing the complete business lifecycle from **Demand to Delivery**. The database runs on **MySQL 8.0+** with strict InnoDB foreign key constraints, index optimizations, and virtual generated columns.

---

## Migration Framework Strategy

We use **Sequential Raw SQL Migrations** located in `server/db/migrations/` managed by a Node.js runner (`server/db/migrate.js`).

### Why Sequential Raw SQL with Node Runner?
1. **Zero Dependencies & High Performance**: Works directly with your existing `mysql2/promise` pool configuration without requiring heavy ORM setup (Knex/Sequelize).
2. **Deterministic Versioning**: SQL scripts are executed in numerical order (`001_initial_schema.sql`, `002_...sql`).
3. **Auditability**: Migration history is automatically recorded in a `schema_migrations` tracking table.

### How to Run Migrations
Run the migration script directly via Node:
```bash
node server/db/migrate.js
```

---

## Table Relationships & Schema Structure

```
                  +-------------------+
                  |       users       |
                  +---------+---------+
                            |
         +------------------+------------------+
         |                  |                  |
         v                  v                  v
+-----------------+ +---------------+ +----------------------+
|  sales_orders   | |purchase_orders| | manufacturing_orders |
+--------+--------+ +-------+-------+ +----------+-----------+
         |                  |                    |
         v                  v                    v
+-----------------+ +---------------+ +----------------------+
|sales_order_items| |purch_order_itm| |     work_orders      |
+--------+--------+ +-------+-------+ +----------+-----------+
         |                  |                    |
         +------------------+--------------------+
                            |
                            v
                   +----------------+
                   |    products    |
                   +-------+--------+
                           |
           +---------------+---------------+
           |                               |
           v                               v
    +--------------+              +------------------+
    |     bom      |              |   stock_ledger   |
    +--------------+              +------------------+
```

---

## Summary of Tables

### 1. `roles`
- **Purpose**: Defines Role-Based Access Control (RBAC) privileges (`Admin`, `SalesUser`, `PurchaseUser`, `ManufacturingUser`, `InventoryManager`, `BusinessOwner`).

### 2. `users`
- **Purpose**: Enterprise user accounts.
- **Integration**: Adapted to preserve compatibility with your existing authentication controller (`full_name`, `login_id`, `email`, `password_hash`, `role_id`, `role` ENUM, `department`, `status`).

### 3. `vendors`
- **Purpose**: External suppliers supplying raw materials for purchase replenishment.

### 4. `products`
- **Purpose**: Central inventory model for both sold products and raw components.
- **Key Columns**:
  - `sku`: Unique stock keeping unit.
  - `procurement_strategy`: `MTS` (Make To Stock) or `MTO` (Make To Order).
  - `procure_on_demand`: Enables automatic replenishment trigger.
  - `procurement_type`: `Purchase` or `Manufacturing`.
  - **`free_to_use_qty`**: **Virtual Generated Column** (`GENERATED ALWAYS AS (on_hand_qty - reserved_qty) VIRTUAL`).
    - *Why this option?* Computes available stock dynamically at the MySQL engine level with zero storage overhead and 100% mathematical consistency across concurrent transactions.

### 5. `bom` (Bill of Materials)
- **Purpose**: Recipe defining manufacturing requirements for a finished product.

### 6. `bom_components`
- **Purpose**: Raw material components required by a BoM and quantities needed per unit.
- **FK Constraint**: `ON DELETE CASCADE` from `bom`, `RESTRICT` on component products.

### 7. `work_centers`
- **Purpose**: Physical plant locations where manufacturing operations take place (Assembly Line, Paint Floor, Packaging Unit).

### 8. `bom_operations`
- **Purpose**: Step-by-step production steps (Assembly, Painting, Packing) with expected duration in minutes.

### 9. `sales_orders` & 10. `sales_order_items`
- **Purpose**: Manages customer demand orders.
- **Status Flow**: `Draft` $\rightarrow$ `Confirmed` $\rightarrow$ `PartiallyDelivered` $\rightarrow$ `FullyDelivered` (or `Cancelled`).
- **Cascade**: `sales_order_items` deleted automatically if draft order is deleted (`ON DELETE CASCADE`).

### 11. `purchase_orders` & 12. `purchase_order_items`
- **Purpose**: Replenishes stock from external vendors.
- **Status Flow**: `Draft` $\rightarrow$ `Confirmed` $\rightarrow$ `PartiallyReceived` $\rightarrow$ `FullyReceived`.

### 13. `manufacturing_orders` & 14. `work_orders`
- **Purpose**: Production execution of finished goods using BoMs.
- **Status Flow (MO)**: `Draft` $\rightarrow$ `InProgress` $\rightarrow$ `Done` $\rightarrow$ `Cancelled`.
- **Status Flow (WO)**: `Pending` $\rightarrow$ `InProgress` $\rightarrow$ `Done`.

### 15. `stock_ledger`
- **Purpose**: Audit trail tracking every physical inventory movement (`SalesDelivery`, `PurchaseReceipt`, `ManufacturingConsume`, `ManufacturingProduce`, `ManualAdjustment`).

### 16. `audit_logs`
- **Purpose**: System-wide traceability for status changes, price updates, quantity changes, and user activities.
