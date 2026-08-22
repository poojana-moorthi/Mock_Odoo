-- Migration 004: Align audit_logs schema with action_type column name

ALTER TABLE `audit_logs` 
  CHANGE COLUMN `action` `action_type` VARCHAR(100) NOT NULL;
