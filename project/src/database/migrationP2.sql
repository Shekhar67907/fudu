-- Filename: migrations/20240605_add_payment_tracking.sql
-- Description: Add payment tracking at item level

-- Start transaction
BEGIN;

-- Add payment tracking columns to order_items
ALTER TABLE "public"."order_items"
ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'pending' 
  CONSTRAINT valid_payment_status CHECK ("payment_status" IN ('pending', 'partial', 'paid')),
ADD COLUMN IF NOT EXISTS "amount_paid" NUMERIC(10,2) DEFAULT 0;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" UUID DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID,
    "amount_paid" NUMERIC(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL 
      CONSTRAINT valid_payment_method CHECK ("payment_method" IN ('cash', 'card', 'upi', 'other')),
    "payment_date" TIMESTAMPTZ DEFAULT NOW(),
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY ("id"),
    CONSTRAINT "fk_payment_transactions_order" 
      FOREIGN KEY ("order_id") 
      REFERENCES "public"."orders"("id") 
      ON DELETE CASCADE,
    CONSTRAINT "fk_payment_transactions_order_item" 
      FOREIGN KEY ("order_item_id") 
      REFERENCES "public"."order_items"("id") 
      ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order_id" 
  ON "public"."payment_transactions" ("order_id");
  
CREATE INDEX IF NOT EXISTS "idx_payment_transactions_order_item_id" 
  ON "public"."payment_transactions" ("order_item_id");

-- Update existing order_items to mark as paid if full amount is paid in order_payments
-- This is a one-time data migration for existing data
DO $$
BEGIN
    -- Only run if order_payments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'order_payments') THEN
        -- Update order_items based on existing payments
        UPDATE "public"."order_items" oi
        SET 
            "amount_paid" = oi.amount,
            "payment_status" = 'paid'
        FROM "public"."order_payments" op
        WHERE oi.order_id = op.order_id 
          AND op.balance <= 0
          AND oi.amount > 0;
    END IF;
END $$;

-- Add a comment to document the changes
COMMENT ON COLUMN "public"."order_items"."payment_status" IS 'Tracks payment status of individual order items (pending/partial/paid)';
COMMENT ON COLUMN "public"."order_items"."amount_paid" IS 'Amount paid against this order item';

-- Commit the transaction
COMMIT;