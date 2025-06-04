-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Prescriptions table with all necessary constraints
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_no TEXT NOT NULL,
    reference_no TEXT,
    class TEXT,
    prescribed_by TEXT NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    age TEXT,
    gender TEXT,
    customer_code TEXT,
    birth_day DATE,
    marriage_anniversary DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    phone_landline TEXT,
    mobile_no TEXT,
    email TEXT,
    ipd TEXT,
    retest_after DATE,
    others TEXT,
    balance_lens BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add constraints
    CONSTRAINT unique_prescription_no UNIQUE (prescription_no)
);

-- Eye prescriptions table
CREATE TABLE IF NOT EXISTS eye_prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID NOT NULL,
    eye_type TEXT NOT NULL,
    vision_type TEXT NOT NULL,
    sph TEXT,
    cyl TEXT,
    ax TEXT,
    add_power TEXT,
    vn TEXT,
    rpd TEXT,
    lpd TEXT,
    spherical_equivalent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_eye_prescription
      FOREIGN KEY (prescription_id) 
      REFERENCES prescriptions(id) 
      ON DELETE CASCADE
);

-- Prescription remarks table
CREATE TABLE IF NOT EXISTS prescription_remarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID NOT NULL,
    for_constant_use BOOLEAN DEFAULT FALSE,
    for_distance_vision_only BOOLEAN DEFAULT FALSE,
    for_near_vision_only BOOLEAN DEFAULT FALSE,
    separate_glasses BOOLEAN DEFAULT FALSE,
    bi_focal_lenses BOOLEAN DEFAULT FALSE,
    progressive_lenses BOOLEAN DEFAULT FALSE,
    anti_reflection_lenses BOOLEAN DEFAULT FALSE,
    anti_radiation_lenses BOOLEAN DEFAULT FALSE,
    under_corrected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_prescription_remark
      FOREIGN KEY (prescription_id) 
      REFERENCES prescriptions(id) 
      ON DELETE CASCADE,
      
    -- Add unique constraint to ensure one remark per prescription
    CONSTRAINT uq_prescription_remarks_prescription_id 
      UNIQUE (prescription_id)
);

-- Create partial unique index for reference_no (only enforces uniqueness for non-empty values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reference_no 
  ON prescriptions (reference_no) 
  WHERE reference_no IS NOT NULL AND reference_no != '';

-- Create partial unique index for mobile_no (only enforces uniqueness for non-empty values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_mobile_no 
  ON prescriptions (mobile_no) 
  WHERE mobile_no IS NOT NULL AND mobile_no != '';

-- Create other indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_no ON prescriptions(prescription_no);
CREATE INDEX IF NOT EXISTS idx_prescriptions_reference_no ON prescriptions(reference_no);
CREATE INDEX IF NOT EXISTS idx_prescriptions_name ON prescriptions(name);
CREATE INDEX IF NOT EXISTS idx_prescriptions_mobile_no ON prescriptions(mobile_no);
CREATE INDEX IF NOT EXISTS idx_eye_prescriptions_prescription_id ON eye_prescriptions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_remarks_prescription_id ON prescription_remarks(prescription_id);

-- Disable Row Level Security (RLS) on all tables to allow public access
ALTER TABLE prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE eye_prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_remarks DISABLE ROW LEVEL SECURITY;

-- Create policies to allow public access to all tables
CREATE POLICY "Enable public access to all prescriptions"
ON prescriptions FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all eye_prescriptions"
ON eye_prescriptions FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all prescription_remarks"
ON prescription_remarks FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Create a function to handle upserting prescription remarks
CREATE OR REPLACE FUNCTION public.upsert_prescription_remarks(
  p_prescription_id UUID,
  p_for_constant_use BOOLEAN DEFAULT FALSE,
  p_for_distance_vision_only BOOLEAN DEFAULT FALSE,
  p_for_near_vision_only BOOLEAN DEFAULT FALSE,
  p_separate_glasses BOOLEAN DEFAULT FALSE,
  p_bi_focal_lenses BOOLEAN DEFAULT FALSE,
  p_progressive_lenses BOOLEAN DEFAULT FALSE,
  p_anti_reflection_lenses BOOLEAN DEFAULT FALSE,
  p_anti_radiation_lenses BOOLEAN DEFAULT FALSE,
  p_under_corrected BOOLEAN DEFAULT FALSE
) 
RETURNS SETOF prescription_remarks AS $$
BEGIN
  RETURN QUERY
  INSERT INTO prescription_remarks (
    prescription_id,
    for_constant_use,
    for_distance_vision_only,
    for_near_vision_only,
    separate_glasses,
    bi_focal_lenses,
    progressive_lenses,
    anti_reflection_lenses,
    anti_radiation_lenses,
    under_corrected
  )
  VALUES (
    p_prescription_id,
    p_for_constant_use,
    p_for_distance_vision_only,
    p_for_near_vision_only,
    p_separate_glasses,
    p_bi_focal_lenses,
    p_progressive_lenses,
    p_anti_reflection_lenses,
    p_anti_radiation_lenses,
    p_under_corrected
  )
  ON CONFLICT (prescription_id) 
  DO UPDATE SET
    for_constant_use = EXCLUDED.for_constant_use,
    for_distance_vision_only = EXCLUDED.for_distance_vision_only,
    for_near_vision_only = EXCLUDED.for_near_vision_only,
    separate_glasses = EXCLUDED.separate_glasses,
    bi_focal_lenses = EXCLUDED.bi_focal_lenses,
    progressive_lenses = EXCLUDED.progressive_lenses,
    anti_reflection_lenses = EXCLUDED.anti_reflection_lenses,
    anti_radiation_lenses = EXCLUDED.anti_radiation_lenses,
    under_corrected = EXCLUDED.under_corrected,
    created_at = CASE 
      WHEN prescription_remarks.id IS NULL THEN NOW() 
      ELSE prescription_remarks.created_at 
    END
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Add unique constraint to prescription_remarks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'prescription_remarks' 
        AND constraint_name = 'uq_prescription_remarks_prescription_id'
    ) THEN
        ALTER TABLE prescription_remarks
        ADD CONSTRAINT uq_prescription_remarks_prescription_id 
        UNIQUE (prescription_id);
    END IF;
END $$;
-- Orders table to track customer purchases
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID NOT NULL,
    order_no TEXT NOT NULL,
    bill_no TEXT,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status TEXT DEFAULT 'Pending',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_order_prescription
      FOREIGN KEY (prescription_id) 
      REFERENCES prescriptions(id) 
      ON DELETE CASCADE,
      
    -- Add constraint for unique order number
    CONSTRAINT unique_order_no UNIQUE (order_no)
);

-- Order items table for frames, sunglasses, and lenses
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL,
    si INTEGER NOT NULL,
    item_type TEXT NOT NULL, -- 'frame', 'sunglass', 'lens'
    item_code TEXT,
    item_name TEXT NOT NULL,
    
    -- Fields for all items
    rate NUMERIC(10, 2) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    amount NUMERIC(10, 2) NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    
    -- Lens-specific fields (can be NULL for frames/sunglasses)
    brand_name TEXT,
    index TEXT,
    coating TEXT,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_order_item
      FOREIGN KEY (order_id) 
      REFERENCES orders(id) 
      ON DELETE CASCADE
);

-- Order payments table
CREATE TABLE IF NOT EXISTS order_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL,
    
    -- Payment calculation fields
    payment_estimate NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) DEFAULT 0,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL,
    
    -- Advance payment fields
    advance_cash NUMERIC(10, 2) DEFAULT 0,
    advance_card_upi NUMERIC(10, 2) DEFAULT 0,
    advance_other NUMERIC(10, 2) DEFAULT 0,
    total_advance NUMERIC(10, 2) GENERATED ALWAYS AS (
        COALESCE(advance_cash, 0) + 
        COALESCE(advance_card_upi, 0) + 
        COALESCE(advance_other, 0)
    ) STORED,
    
    -- Balance is final_amount minus total_advance (never negative)
    balance NUMERIC(10, 2) GENERATED ALWAYS AS (
        GREATEST(0, final_amount - (
            COALESCE(advance_cash, 0) + 
            COALESCE(advance_card_upi, 0) + 
            COALESCE(advance_other, 0)
        ))
    ) STORED,
    
    -- Schedule amount
    schedule_amount NUMERIC(10, 2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_order_payment
      FOREIGN KEY (order_id) 
      REFERENCES orders(id) 
      ON DELETE CASCADE,
      
    -- One payment record per order
    CONSTRAINT uq_order_payment_order_id 
      UNIQUE (order_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_prescription_id ON orders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);

-- Disable Row Level Security (RLS) as requested for testing
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments DISABLE ROW LEVEL SECURITY;

-- Create policies to allow public access to all tables (for testing)
CREATE POLICY "Enable public access to all orders"
ON orders FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all order_items"
ON order_items FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all order_payments"
ON order_payments FOR ALL
TO public
USING (true)
WITH CHECK (true);