-- SQL script to add missing columns to contact_lens_prescriptions table

-- #1 - Update contact_lens_prescriptions table
-- Add Reference Number column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS reference_no TEXT;

-- Add Customer Code column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS customer_code TEXT;

-- Add Birthday column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS birth_day DATE;

-- Add Marriage Anniversary column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS marriage_anniversary DATE;

-- Add PIN column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS pin TEXT;

-- Add Phone Landline column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS phone_landline TEXT;

-- Add Prescribed By column
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS prescribed_by TEXT;

-- Create index for reference_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_lens_prescriptions_reference_no 
  ON contact_lens_prescriptions(reference_no);

-- Create index for customer_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_lens_prescriptions_customer_code 
  ON contact_lens_prescriptions(customer_code);

-- #2 - Update contact_lens_eyes table
-- Add IPD column to contact_lens_eyes table
ALTER TABLE contact_lens_eyes ADD COLUMN IF NOT EXISTS ipd TEXT;

-- #3 - Update contact_lens_items table
-- Add item_index column to contact_lens_items table for ordering items
ALTER TABLE contact_lens_items ADD COLUMN IF NOT EXISTS item_index INTEGER;

-- #4 - Fix issues in contact_lens_payments table
-- Fix comma issue after payment_total and ensure all columns exist
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS payment_total NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash';
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS cash_advance NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS card_upi_advance NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS cheque_advance NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS scheme_discount BOOLEAN DEFAULT FALSE;
ALTER TABLE contact_lens_payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- Make sure payment_mode constraint exists with correct values
ALTER TABLE contact_lens_payments DROP CONSTRAINT IF EXISTS check_payment_mode;
ALTER TABLE contact_lens_payments ADD CONSTRAINT check_payment_mode 
  CHECK (payment_mode IN ('Cash', 'Card', 'UPI', 'Cheque'));

-- Make sure the payments table has the correct foreign key constraint
ALTER TABLE contact_lens_payments DROP CONSTRAINT IF EXISTS fk_contact_lens_payment;
ALTER TABLE contact_lens_payments ADD CONSTRAINT fk_contact_lens_payment
  FOREIGN KEY (contact_lens_prescription_id) 
  REFERENCES contact_lens_prescriptions(id) 
  ON DELETE CASCADE;
-- SQL SCHEMA UPDATE FOR CONTACT LENS SYSTEM
-- Purpose: Remove lookup tables and use direct text fields instead
-- Date: 2025-06-01

-- STEP 1: Add new text columns to contact_lens_prescriptions table
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS dispose TEXT;
ALTER TABLE contact_lens_prescriptions ADD COLUMN IF NOT EXISTS brand TEXT;

-- STEP 2: Prepare contact_lens_items table for direct text fields
-- Remove foreign key constraints if they exist
ALTER TABLE contact_lens_items DROP CONSTRAINT IF EXISTS fk_contact_lens_item_material;
ALTER TABLE contact_lens_items DROP CONSTRAINT IF EXISTS fk_contact_lens_item_disposal;
ALTER TABLE contact_lens_items DROP CONSTRAINT IF EXISTS fk_contact_lens_item_brand;

-- STEP 3: Rename existing text fields if present, or create them if not
-- Check if material_text exists and handle appropriately
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'material_text') THEN
    ALTER TABLE contact_lens_items RENAME COLUMN material_text TO material;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contact_lens_items' AND column_name = 'material') THEN
    ALTER TABLE contact_lens_items ADD COLUMN material TEXT;
  END IF;
  
  -- Check if disposal_text exists and handle appropriately
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'disposal_text') THEN
    ALTER TABLE contact_lens_items RENAME COLUMN disposal_text TO dispose;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contact_lens_items' AND column_name = 'dispose') THEN
    ALTER TABLE contact_lens_items ADD COLUMN dispose TEXT;
  END IF;
  
  -- Check if brand_text exists and handle appropriately
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'brand_text') THEN
    ALTER TABLE contact_lens_items RENAME COLUMN brand_text TO brand;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contact_lens_items' AND column_name = 'brand') THEN
    ALTER TABLE contact_lens_items ADD COLUMN brand TEXT;
  END IF;
END
$$;

-- STEP 4: DATA MIGRATION - Uncomment and run these statements to migrate existing data

-- First, check if the foreign key columns exist before migrating data
DO $$
BEGIN
  -- Migrate material data if material_id column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'material_id') THEN
    UPDATE contact_lens_items ci
    SET material = (SELECT name FROM lens_materials lm WHERE lm.id = ci.material_id)
    WHERE ci.material_id IS NOT NULL AND (ci.material IS NULL OR ci.material = '');
  END IF;

  -- Migrate disposal data if disposal_id column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'disposal_id') THEN
    UPDATE contact_lens_items ci
    SET dispose = (SELECT type FROM lens_disposals ld WHERE ld.id = ci.disposal_id)
    WHERE ci.disposal_id IS NOT NULL AND (ci.dispose IS NULL OR ci.dispose = '');
  END IF;

  -- Migrate brand data if brand_id column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'contact_lens_items' AND column_name = 'brand_id') THEN
    UPDATE contact_lens_items ci
    SET brand = (SELECT name FROM lens_brands lb WHERE lb.id = ci.brand_id)
    WHERE ci.brand_id IS NOT NULL AND (ci.brand IS NULL OR ci.brand = '');
  END IF;
END
$$;

-- STEP 5: Remove old foreign key ID columns after data has been migrated
ALTER TABLE contact_lens_items DROP COLUMN IF EXISTS material_id;
ALTER TABLE contact_lens_items DROP COLUMN IF EXISTS disposal_id;
ALTER TABLE contact_lens_items DROP COLUMN IF EXISTS brand_id;
-- STEP 6: Finally, drop the unused lookup tables
-- This is safe to run after data migration is complete
DROP TABLE IF EXISTS lens_materials CASCADE;
DROP TABLE IF EXISTS lens_disposals CASCADE;
DROP TABLE IF EXISTS lens_brands CASCADE;

-- STEP 7: Add indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_contact_lens_items_material ON contact_lens_items(material);
CREATE INDEX IF NOT EXISTS idx_contact_lens_items_dispose ON contact_lens_items(dispose);
CREATE INDEX IF NOT EXISTS idx_contact_lens_items_brand ON contact_lens_items(brand);
