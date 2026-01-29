-- ============================================
-- ADD CUSTOMER AND VENDOR FIELDS
-- Adds address, contact_number, contact_person_name, and gstin fields to customers and vendors tables
-- ============================================

-- Add columns to customers table if they don't exist
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS gstin VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR(255);

-- Add columns to vendors table if they don't exist
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS gstin VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_person_name VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin);
CREATE INDEX IF NOT EXISTS idx_customers_contact_number ON customers(contact_number);
CREATE INDEX IF NOT EXISTS idx_vendors_gstin ON vendors(gstin);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_number ON vendors(contact_number);
