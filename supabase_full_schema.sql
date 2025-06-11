SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";

-- Function to prevent duplicate prescription remarks
CREATE OR REPLACE FUNCTION "public"."prevent_duplicate_prescription_remarks"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND EXISTS (SELECT 1 FROM prescription_remarks WHERE prescription_id = NEW.prescription_id) THEN
        RAISE EXCEPTION 'A remarks record already exists for this prescription';
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."prevent_duplicate_prescription_remarks"() OWNER TO "postgres";

SET default_tablespace = '';
SET default_table_access_method = "heap";

-- Main prescriptions table
CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "prescription_no" "text" NOT NULL,
    "reference_no" "text",
    "class" "text",
    "prescribed_by" "text" NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "source" "text" NOT NULL DEFAULT 'OrderCard',
    "title" "text",
    "age" "text",
    "gender" "text",
    "customer_code" "text",
    "birth_day" "date",
    "marriage_anniversary" "date",
    "address" "text",
    "city" "text",
    "state" "text",
    "pin_code" "text",
    "phone_landline" "text",
    "mobile_no" "text",
    "email" "text",
    "ipd" "text",
    "retest_after" "date",
    "others" "text",
    "balance_lens" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."prescriptions" OWNER TO "postgres";
COMMENT ON COLUMN public.prescriptions.source IS 'Source of prescription: OrderCard or ContactLens';

-- Prescription remarks table
CREATE TABLE IF NOT EXISTS "public"."prescription_remarks" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "for_constant_use" boolean DEFAULT false,
    "for_distance_vision_only" boolean DEFAULT false,
    "for_near_vision_only" boolean DEFAULT false,
    "separate_glasses" boolean DEFAULT false,
    "bi_focal_lenses" boolean DEFAULT false,
    "progressive_lenses" boolean DEFAULT false,
    "anti_reflection_lenses" boolean DEFAULT false,
    "anti_radiation_lenses" boolean DEFAULT false,
    "under_corrected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."prescription_remarks" OWNER TO "postgres";

-- Create trigger for preventing duplicate prescription remarks
CREATE TRIGGER trigger_prevent_duplicate_prescription_remarks
    BEFORE INSERT ON public.prescription_remarks
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_duplicate_prescription_remarks();

-- Upsert function for prescription remarks
CREATE OR REPLACE FUNCTION "public"."upsert_prescription_remarks"(
    "p_prescription_id" "uuid", 
    "p_for_constant_use" boolean DEFAULT false, 
    "p_for_distance_vision_only" boolean DEFAULT false, 
    "p_for_near_vision_only" boolean DEFAULT false, 
    "p_separate_glasses" boolean DEFAULT false, 
    "p_bi_focal_lenses" boolean DEFAULT false, 
    "p_progressive_lenses" boolean DEFAULT false, 
    "p_anti_reflection_lenses" boolean DEFAULT false, 
    "p_anti_radiation_lenses" boolean DEFAULT false, 
    "p_under_corrected" boolean DEFAULT false
) RETURNS SETOF "public"."prescription_remarks"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  INSERT INTO prescription_remarks (prescription_id, for_constant_use, for_distance_vision_only, for_near_vision_only, separate_glasses, bi_focal_lenses, progressive_lenses, anti_reflection_lenses, anti_radiation_lenses, under_corrected)
  VALUES (p_prescription_id, p_for_constant_use, p_for_distance_vision_only, p_for_near_vision_only, p_separate_glasses, p_bi_focal_lenses, p_progressive_lenses, p_anti_reflection_lenses, p_anti_radiation_lenses, p_under_corrected)
  ON CONFLICT (prescription_id) 
  DO UPDATE SET for_constant_use = EXCLUDED.for_constant_use, for_distance_vision_only = EXCLUDED.for_distance_vision_only, for_near_vision_only = EXCLUDED.for_near_vision_only, separate_glasses = EXCLUDED.separate_glasses, bi_focal_lenses = EXCLUDED.bi_focal_lenses, progressive_lenses = EXCLUDED.progressive_lenses, anti_reflection_lenses = EXCLUDED.anti_reflection_lenses, anti_radiation_lenses = EXCLUDED.anti_radiation_lenses, under_corrected = EXCLUDED.under_corrected, created_at = CASE WHEN prescription_remarks.id IS NULL THEN NOW() ELSE prescription_remarks.created_at END
  RETURNING *;
END;
$$;
ALTER FUNCTION "public"."upsert_prescription_remarks"("p_prescription_id" "uuid", "p_for_constant_use" boolean, "p_for_distance_vision_only" boolean, "p_for_near_vision_only" boolean, "p_separate_glasses" boolean, "p_bi_focal_lenses" boolean, "p_progressive_lenses" boolean, "p_anti_reflection_lenses" boolean, "p_anti_radiation_lenses" boolean, "p_under_corrected" boolean) OWNER TO "postgres";

-- Eye prescriptions table
CREATE TABLE IF NOT EXISTS "public"."eye_prescriptions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "eye_type" "text" NOT NULL,
    "vision_type" "text" NOT NULL,
    "sph" "text",
    "cyl" "text",
    "ax" "text",
    "add_power" "text",
    "vn" "text",
    "rpd" "text",
    "lpd" "text",
    "spherical_equivalent" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."eye_prescriptions" OWNER TO "postgres";

-- Contact lens prescriptions table
CREATE TABLE IF NOT EXISTS "public"."contact_lens_prescriptions" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "booked_by" "text" NOT NULL,
    "delivery_date" "date",
    "delivery_time" time without time zone,
    "status" "text" DEFAULT 'Processing'::"text" NOT NULL,
    "retest_date" "date",
    "expiry_date" "date",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "customer_code" "text",
    "birth_day" "date",
    "marriage_anniversary" "date",
    "pin" "text",
    "phone_landline" "text",
    "prescribed_by" "text",
    "reference_no" "text",
    "material" "text",
    "dispose" "text",
    "brand" "text"
);
ALTER TABLE "public"."contact_lens_prescriptions" OWNER TO "postgres";

-- Contact lens eyes table
CREATE TABLE IF NOT EXISTS "public"."contact_lens_eyes" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "contact_lens_prescription_id" "uuid" NOT NULL,
    "eye_side" "text" NOT NULL,
    "se" "text",
    "sph" "text",
    "cyl" "text",
    "axis" "text",
    "add_power" "text",
    "vn" "text",
    "rpd" "text",
    "lpd" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "ipd" "text"
);
ALTER TABLE "public"."contact_lens_eyes" OWNER TO "postgres";

-- Contact lens items table
CREATE TABLE IF NOT EXISTS "public"."contact_lens_items" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "contact_lens_prescription_id" "uuid" NOT NULL,
    "eye_side" "text" NOT NULL,
    "base_curve" "text",
    "power" "text",
    "material" "text",
    "dispose" "text",
    "brand" "text",
    "diameter" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "rate" numeric(10,2) NOT NULL,
    "amount" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "rate")) STORED,
    "sph" "text",
    "cyl" "text",
    "axis" "text",
    "lens_code" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "item_index" integer,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(10,2) GENERATED ALWAYS AS ((((("quantity")::numeric * "rate") * "discount_percent") / (100)::numeric)) STORED,
    "final_amount" numeric(10,2) GENERATED ALWAYS AS (((("quantity")::numeric * "rate") * ((1)::numeric - ("discount_percent" / (100)::numeric)))) STORED
);
ALTER TABLE "public"."contact_lens_items" OWNER TO "postgres";

-- Contact lens payments table
CREATE TABLE IF NOT EXISTS "public"."contact_lens_payments" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "contact_lens_prescription_id" "uuid" NOT NULL,
    "estimate" numeric(10,2) NOT NULL,
    "advance" numeric(10,2) DEFAULT 0,
    "balance" numeric(10,2) GENERATED ALWAYS AS (GREATEST((0)::numeric, ("estimate" - "advance"))) STORED,
    "payment_mode" "text" NOT NULL,
    "cash_advance" numeric(10,2) DEFAULT 0,
    "card_upi_advance" numeric(10,2) DEFAULT 0,
    "cheque_advance" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "scheme_discount" boolean DEFAULT false,
    "payment_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "payment_total" numeric(10,2) DEFAULT 0,
    CONSTRAINT "check_payment_mode" CHECK (("payment_mode" = ANY (ARRAY['Cash'::"text", 'Card'::"text", 'UPI'::"text", 'Cheque'::"text"])))
);
ALTER TABLE "public"."contact_lens_payments" OWNER TO "postgres";

-- Orders table
CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "order_no" "text" NOT NULL,
    "bill_no" "text",
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "delivery_date" "date",
    "status" "text" DEFAULT 'Pending'::"text",
    "remarks" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."orders" OWNER TO "postgres";

-- Order items table
CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "si" integer NOT NULL,
    "item_type" "text" NOT NULL,
    "item_code" "text",
    "item_name" "text" NOT NULL,
    "rate" numeric(10,2) NOT NULL,
    "qty" integer DEFAULT 1 NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "tax_percent" numeric(5,2) DEFAULT 0,
    "discount_percent" numeric(5,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "brand_name" "text",
    "index" "text",
    "coating" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."order_items" OWNER TO "postgres";

-- Order payments table
CREATE TABLE IF NOT EXISTS "public"."order_payments" (
    "id" "uuid" DEFAULT "public"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "payment_estimate" numeric(10,2) NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "final_amount" numeric(10,2) NOT NULL,
    "advance_cash" numeric(10,2) DEFAULT 0,
    "advance_card_upi" numeric(10,2) DEFAULT 0,
    "advance_other" numeric(10,2) DEFAULT 0,
    "total_advance" numeric(10,2) GENERATED ALWAYS AS (((COALESCE("advance_cash", (0)::numeric) + COALESCE("advance_card_upi", (0)::numeric)) + COALESCE("advance_other", (0)::numeric))) STORED,
    "balance" numeric(10,2) GENERATED ALWAYS AS (GREATEST((0)::numeric, ("final_amount" - ((COALESCE("advance_cash", (0)::numeric) + COALESCE("advance_card_upi", (0)::numeric)) + COALESCE("advance_other", (0)::numeric))))) STORED,
    "schedule_amount" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);
ALTER TABLE "public"."order_payments" OWNER TO "postgres";

-- PRIMARY KEY CONSTRAINTS
ALTER TABLE ONLY "public"."prescriptions" ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."prescription_remarks" ADD CONSTRAINT "prescription_remarks_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."eye_prescriptions" ADD CONSTRAINT "eye_prescriptions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."contact_lens_prescriptions" ADD CONSTRAINT "contact_lens_prescriptions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."contact_lens_eyes" ADD CONSTRAINT "contact_lens_eyes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."contact_lens_items" ADD CONSTRAINT "contact_lens_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."contact_lens_payments" ADD CONSTRAINT "contact_lens_payments_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."order_payments" ADD CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id");

-- UNIQUE CONSTRAINTS
ALTER TABLE ONLY "public"."prescriptions" ADD CONSTRAINT "unique_prescription_no" UNIQUE ("prescription_no");
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "unique_order_no" UNIQUE ("order_no");
ALTER TABLE ONLY "public"."prescription_remarks" ADD CONSTRAINT "uq_prescription_remarks_prescription_id" UNIQUE ("prescription_id");
ALTER TABLE ONLY "public"."contact_lens_prescriptions" ADD CONSTRAINT "uq_contact_lens_prescription_id" UNIQUE ("prescription_id");
ALTER TABLE ONLY "public"."contact_lens_eyes" ADD CONSTRAINT "uq_contact_lens_eye_side" UNIQUE ("contact_lens_prescription_id", "eye_side");
ALTER TABLE ONLY "public"."contact_lens_payments" ADD CONSTRAINT "uq_contact_lens_payment_prescription_id" UNIQUE ("contact_lens_prescription_id");
ALTER TABLE ONLY "public"."order_payments" ADD CONSTRAINT "uq_order_payment_order_id" UNIQUE ("order_id");

-- INDEXES
CREATE INDEX "idx_prescriptions_name" ON "public"."prescriptions" USING "btree" ("name");
CREATE INDEX "idx_prescriptions_mobile_no" ON "public"."prescriptions" USING "btree" ("mobile_no");
CREATE INDEX "idx_prescriptions_prescription_no" ON "public"."prescriptions" USING "btree" ("prescription_no");
CREATE INDEX "idx_prescriptions_reference_no" ON "public"."prescriptions" USING "btree" ("reference_no");
CREATE INDEX "idx_prescription_remarks_prescription_id" ON "public"."prescription_remarks" USING "btree" ("prescription_id");
CREATE INDEX "idx_eye_prescriptions_prescription_id" ON "public"."eye_prescriptions" USING "btree" ("prescription_id");
CREATE INDEX "idx_contact_lens_prescriptions_prescription_id" ON "public"."contact_lens_prescriptions" USING "btree" ("prescription_id");
CREATE INDEX "idx_contact_lens_prescriptions_customer_code" ON "public"."contact_lens_prescriptions" USING "btree" ("customer_code");
CREATE INDEX "idx_contact_lens_prescriptions_reference_no" ON "public"."contact_lens_prescriptions" USING "btree" ("reference_no");
CREATE INDEX "idx_contact_lens_eyes_prescription_id" ON "public"."contact_lens_eyes" USING "btree" ("contact_lens_prescription_id");
CREATE INDEX "idx_contact_lens_items_prescription_id" ON "public"."contact_lens_items" USING "btree" ("contact_lens_prescription_id");
CREATE INDEX "idx_contact_lens_items_material" ON "public"."contact_lens_items" USING "btree" ("material");
CREATE INDEX "idx_contact_lens_items_dispose" ON "public"."contact_lens_items" USING "btree" ("dispose");
CREATE INDEX "idx_contact_lens_items_brand" ON "public"."contact_lens_items" USING "btree" ("brand");
CREATE INDEX "idx_contact_lens_items_discount" ON "public"."contact_lens_items" USING "btree" ("discount_percent");
CREATE INDEX "idx_contact_lens_payments_prescription_id" ON "public"."contact_lens_payments" USING "btree" ("contact_lens_prescription_id");
CREATE INDEX "idx_orders_prescription_id" ON "public"."orders" USING "btree" ("prescription_id");
CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");
CREATE INDEX "idx_order_payments_order_id" ON "public"."order_payments" USING "btree" ("order_id");

-- UNIQUE INDEXES
CREATE UNIQUE INDEX "idx_unique_reference_no" ON "public"."prescriptions" USING "btree" ("reference_no") WHERE (("reference_no" IS NOT NULL) AND ("reference_no" <> ''::"text"));
CREATE UNIQUE INDEX "idx_unique_mobile_no_per_source" ON "public"."prescriptions"(mobile_no, source) WHERE ((mobile_no IS NOT NULL) AND (mobile_no <> ''::TEXT));
COMMENT ON INDEX idx_unique_mobile_no_per_source IS 'Ensures unique mobile numbers per source type';

-- Backfill source for existing ContactLens prescriptions
UPDATE "public"."prescriptions" p SET source = 'ContactLens' WHERE EXISTS (SELECT 1 FROM "public"."contact_lens_prescriptions" clp WHERE clp.prescription_id = p.id);

-- FOREIGN KEY CONSTRAINTS
ALTER TABLE ONLY "public"."prescription_remarks" ADD CONSTRAINT "fk_prescription_remark" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."eye_prescriptions" ADD CONSTRAINT "fk_eye_prescription" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."contact_lens_prescriptions" ADD CONSTRAINT "fk_contact_lens_prescription" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."contact_lens_eyes" ADD CONSTRAINT "fk_contact_lens_eye" FOREIGN KEY ("contact_lens_prescription_id") REFERENCES "public"."contact_lens_prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."contact_lens_items" ADD CONSTRAINT "fk_contact_lens_item" FOREIGN KEY ("contact_lens_prescription_id") REFERENCES "public"."contact_lens_prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."contact_lens_payments" ADD CONSTRAINT "fk_contact_lens_payment" FOREIGN KEY ("contact_lens_prescription_id") REFERENCES "public"."contact_lens_prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."orders" ADD CONSTRAINT "fk_order_prescription" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_items" ADD CONSTRAINT "fk_order_item" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."order_payments" ADD CONSTRAINT "fk_order_payment" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

-- ROW LEVEL SECURITY POLICIES
ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prescription_remarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."eye_prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_lens_prescriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_lens_eyes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_lens_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."contact_lens_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_payments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable public access to all prescriptions" ON "public"."prescriptions" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all prescription_remarks" ON "public"."prescription_remarks" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all eye_prescriptions" ON "public"."eye_prescriptions" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all contact_lens_prescriptions" ON "public"."contact_lens_prescriptions" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all contact_lens_eyes" ON "public"."contact_lens_eyes" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all contact_lens_items" ON "public"."contact_lens_items" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all contact_lens_payments" ON "public"."contact_lens_payments" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all orders" ON "public"."orders" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all order_items" ON "public"."order_items" USING (true) WITH CHECK (true);
CREATE POLICY "Enable public access to all order_payments" ON "public"."order_payments" USING (true) WITH CHECK (true);

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."prevent_duplicate_prescription_remarks"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_duplicate_prescription_remarks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_duplicate_prescription_remarks"() TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v4"() TO "service_role";

GRANT ALL ON TABLE "public"."prescription_remarks" TO "anon";
GRANT ALL ON TABLE "public"."prescription_remarks" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_remarks" TO "service_role";

GRANT ALL ON FUNCTION "public"."upsert_prescription_remarks"("p_prescription_id" "uuid", "p_for_constant_use" boolean, "p_for_distance_vision_only" boolean, "p_for_near_vision_only" boolean, "p_separate_glasses" boolean, "p_bi_focal_lenses" boolean, "p_progressive_lenses" boolean, "p_anti_reflection_lenses" boolean, "p_anti_radiation_lenses" boolean, "p_under_corrected" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_prescription_remarks"("p_prescription_id" "uuid", "p_for_constant_use" boolean, "p_for_distance_vision_only" boolean, "p_for_near_vision_only" boolean, "p_separate_glasses" boolean, "p_bi_focal_lenses" boolean, "p_progressive_lenses" boolean, "p_anti_reflection_lenses" boolean, "p_anti_radiation_lenses" boolean, "p_under_corrected" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_prescription_remarks"("p_prescription_id" "uuid", "p_for_constant_use" boolean, "p_for_distance_vision_only" boolean, "p_for_near_vision_only" boolean, "p_separate_glasses" boolean, "p_bi_focal_lenses" boolean, "p_progressive_lenses" boolean, "p_anti_reflection_lenses" boolean, "p_anti_radiation_lenses" boolean, "p_under_corrected" boolean) TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1"() TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v1mc"() TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_nil"() TO "service_role";


GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_dns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_oid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_url"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "postgres";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "anon";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."uuid_ns_x500"() TO "service_role";




GRANT ALL ON TABLE "public"."contact_lens_eyes" TO "anon";
GRANT ALL ON TABLE "public"."contact_lens_eyes" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_lens_eyes" TO "service_role";



GRANT ALL ON TABLE "public"."contact_lens_items" TO "anon";
GRANT ALL ON TABLE "public"."contact_lens_items" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_lens_items" TO "service_role";



GRANT ALL ON TABLE "public"."contact_lens_payments" TO "anon";
GRANT ALL ON TABLE "public"."contact_lens_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_lens_payments" TO "service_role";



GRANT ALL ON TABLE "public"."contact_lens_prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."contact_lens_prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_lens_prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."eye_prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."eye_prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."eye_prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_payments" TO "anon";
GRANT ALL ON TABLE "public"."order_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."order_payments" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";



RESET ALL;