-- Contact Lens Module Extension for Optical Store Database
-- This extends the existing database structure to support contact lens prescriptions and orders

-- Lookup table for lens materials
CREATE TABLE IF NOT EXISTS lens_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add constraint for unique material name
    CONSTRAINT unique_material_name UNIQUE (name)
);

-- Lookup table for lens brands
CREATE TABLE IF NOT EXISTS lens_brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add constraint for unique brand name
    CONSTRAINT unique_brand_name UNIQUE (name)
);

-- Lookup table for lens disposal types
CREATE TABLE IF NOT EXISTS lens_disposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add constraint for unique disposal type
    CONSTRAINT unique_disposal_type UNIQUE (type)
);

-- Main contact lens prescriptions table
CREATE TABLE IF NOT EXISTS contact_lens_prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID NOT NULL,
    booked_by TEXT NOT NULL,
    delivery_date DATE,
    delivery_time TIME,
    status TEXT NOT NULL DEFAULT 'Processing', -- Enum: 'Processing', 'Ready', 'Hand Over'
    retest_date DATE,
    expiry_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_contact_lens_prescription
      FOREIGN KEY (prescription_id) 
      REFERENCES prescriptions(id) 
      ON DELETE CASCADE,
      
    -- One contact lens prescription record per prescription
    CONSTRAINT uq_contact_lens_prescription_id 
      UNIQUE (prescription_id)
);

-- Contact lens eye-specific data
CREATE TABLE IF NOT EXISTS contact_lens_eyes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_lens_prescription_id UUID NOT NULL,
    eye_side TEXT NOT NULL, -- Enum: 'Left', 'Right'
    se TEXT, -- Spherical Equivalent
    sph TEXT, -- Sphere
    cyl TEXT, -- Cylinder
    axis TEXT, -- Axis
    add_power TEXT, -- Add power
    vn TEXT, -- Visual Number
    rpd TEXT, -- Right Pupillary Distance
    lpd TEXT, -- Left Pupillary Distance
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_contact_lens_eye
      FOREIGN KEY (contact_lens_prescription_id) 
      REFERENCES contact_lens_prescriptions(id) 
      ON DELETE CASCADE,
      
    -- Each eye (Left/Right) can only have one record per prescription
    CONSTRAINT uq_contact_lens_eye_side 
      UNIQUE (contact_lens_prescription_id, eye_side),
      
    -- Ensure eye_side is only 'Left' or 'Right'
    CONSTRAINT check_eye_side 
      CHECK (eye_side IN ('Left', 'Right'))
);

-- Contact lens product items
CREATE TABLE IF NOT EXISTS contact_lens_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_lens_prescription_id UUID NOT NULL,
    eye_side TEXT NOT NULL, -- Enum: 'Left', 'Right', 'Both'
    base_curve TEXT, -- B.C (Base Curve)
    power TEXT, -- Power
    material_id UUID, -- FK to lens_materials
    material_text TEXT, -- Free text alternative if not using FK
    disposal_id UUID, -- FK to lens_disposals
    disposal_text TEXT, -- Free text alternative if not using FK
    brand_id UUID, -- FK to lens_brands
    brand_text TEXT, -- Free text alternative if not using FK
    diameter TEXT, -- Diameter
    quantity INTEGER NOT NULL DEFAULT 1,
    rate NUMERIC(10, 2) NOT NULL,
    amount NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
    sph TEXT, -- Optional product-level SPH if different from prescription
    cyl TEXT, -- Optional product-level CYL if different from prescription
    axis TEXT, -- Optional product-level AXIS if different from prescription
    lens_code TEXT, -- Optional lens code
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraints
    CONSTRAINT fk_contact_lens_item
      FOREIGN KEY (contact_lens_prescription_id) 
      REFERENCES contact_lens_prescriptions(id) 
      ON DELETE CASCADE,
      
    CONSTRAINT fk_contact_lens_item_material
      FOREIGN KEY (material_id) 
      REFERENCES lens_materials(id) 
      ON DELETE SET NULL,
      
    CONSTRAINT fk_contact_lens_item_disposal
      FOREIGN KEY (disposal_id) 
      REFERENCES lens_disposals(id) 
      ON DELETE SET NULL,
      
    CONSTRAINT fk_contact_lens_item_brand
      FOREIGN KEY (brand_id) 
      REFERENCES lens_brands(id) 
      ON DELETE SET NULL,
      
    -- Ensure eye_side is only 'Left', 'Right' or 'Both'
    CONSTRAINT check_item_eye_side 
      CHECK (eye_side IN ('Left', 'Right', 'Both'))
);

-- Contact lens payments
CREATE TABLE IF NOT EXISTS contact_lens_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_lens_prescription_id UUID NOT NULL,
    
    -- Payment calculation fields
    estimate NUMERIC(10, 2) NOT NULL,
    advance NUMERIC(10, 2) DEFAULT 0,
    balance NUMERIC(10, 2) GENERATED ALWAYS AS (
        GREATEST(0, estimate - advance)
    ) STORED,
    
    -- Store UI total payment field for direct mapping
    payment_total NUMERIC(10, 2) DEFAULT 0
    
    -- Payment method
    payment_mode TEXT NOT NULL, -- Enum: 'Cash', 'Card', 'UPI', 'Cheque'
    
    -- Advance payment breakdown
    cash_advance NUMERIC(10, 2) DEFAULT 0,
    card_upi_advance NUMERIC(10, 2) DEFAULT 0,
    cheque_advance NUMERIC(10, 2) DEFAULT 0,
    
    -- Discount information
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    scheme_discount BOOLEAN DEFAULT FALSE,
    
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    
    -- Add foreign key constraint with CASCADE
    CONSTRAINT fk_contact_lens_payment
      FOREIGN KEY (contact_lens_prescription_id) 
      REFERENCES contact_lens_prescriptions(id) 
      ON DELETE CASCADE,
      
    -- One payment record per contact lens prescription
    CONSTRAINT uq_contact_lens_payment_prescription_id 
      UNIQUE (contact_lens_prescription_id),
      
    -- Ensure payment_mode is valid
    CONSTRAINT check_payment_mode 
      CHECK (payment_mode IN ('Cash', 'Card', 'UPI', 'Cheque'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_lens_prescriptions_prescription_id 
  ON contact_lens_prescriptions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_eyes_prescription_id 
  ON contact_lens_eyes(contact_lens_prescription_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_items_prescription_id 
  ON contact_lens_items(contact_lens_prescription_id);
CREATE INDEX IF NOT EXISTS idx_contact_lens_payments_prescription_id 
  ON contact_lens_payments(contact_lens_prescription_id);

-- Disable Row Level Security (RLS) to match existing tables
ALTER TABLE lens_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE lens_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE lens_disposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lens_prescriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lens_eyes DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lens_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lens_payments DISABLE ROW LEVEL SECURITY;

-- Create policies to allow public access to all tables (matching existing tables)
CREATE POLICY "Enable public access to all lens_materials"
ON lens_materials FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all lens_brands"
ON lens_brands FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all lens_disposals"
ON lens_disposals FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all contact_lens_prescriptions"
ON contact_lens_prescriptions FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all contact_lens_eyes"
ON contact_lens_eyes FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all contact_lens_items"
ON contact_lens_items FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable public access to all contact_lens_payments"
ON contact_lens_payments FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Insert default values for lookup tables
INSERT INTO lens_materials (name, description)
VALUES 
    ('Hydrogel', 'Traditional soft contact lens material'),
    ('Silicone Hydrogel', 'Modern soft contact lens material with higher oxygen permeability'),
    ('Rigid Gas Permeable', 'Hard contact lens material with excellent oxygen permeability')
ON CONFLICT (name) DO NOTHING;

INSERT INTO lens_brands (name, manufacturer)
VALUES 
    ('Acuvue', 'Johnson & Johnson'),
    ('Air Optix', 'Alcon'),
    ('Biofinity', 'CooperVision'),
    ('Bausch & Lomb', 'Bausch & Lomb')
ON CONFLICT (name) DO NOTHING;

INSERT INTO lens_disposals (type, description)
VALUES 
    ('Daily', 'Disposed after a single day of wear'),
    ('Bi-weekly', 'Disposed after two weeks of wear'),
    ('Monthly', 'Disposed after one month of wear'),
    ('Quarterly', 'Disposed after three months of wear'),
    ('Yearly', 'Disposed after one year of wear')
ON CONFLICT (type) DO NOTHING;
