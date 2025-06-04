-- Drop all policies first
DROP POLICY IF EXISTS "Allow authenticated users to insert prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Allow authenticated users to update prescriptions" ON prescriptions;
DROP POLICY IF EXISTS "Allow authenticated users to select prescriptions" ON prescriptions;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON eye_prescriptions;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON eye_prescriptions;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON eye_prescriptions;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON eye_prescriptions;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON prescription_remarks;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON prescription_remarks;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON prescription_remarks;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON prescription_remarks;

-- Drop unique indexes (if they exist)
DROP INDEX IF EXISTS idx_unique_reference_no;
DROP INDEX IF EXISTS idx_unique_mobile_no;

-- Drop regular indexes
DROP INDEX IF EXISTS idx_prescriptions_prescription_no;
DROP INDEX IF EXISTS idx_prescriptions_reference_no;
DROP INDEX IF EXISTS idx_prescriptions_name;
DROP INDEX IF EXISTS idx_prescriptions_mobile_no;
DROP INDEX IF EXISTS idx_eye_prescriptions_prescription_id;
DROP INDEX IF EXISTS idx_prescription_remarks_prescription_id;

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS prescription_remarks CASCADE;
DROP TABLE IF EXISTS eye_prescriptions CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Drop any custom functions (add any custom functions you've created)
-- DROP FUNCTION IF EXISTS your_function_name();

-- Drop any custom types (add any custom types you've created)
-- DROP TYPE IF EXISTS your_type_name; 