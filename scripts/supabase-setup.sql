-- Supabase Setup Script for Agricolala
-- Run this in Supabase SQL Editor after creating your project
-- This script is idempotent and can be run multiple times safely

-- Enable Row Level Security on all tables (idempotent - safe to run multiple times)
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Parcel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WeatherHistoryTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WeatherHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_WeatherHistoryParcels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_WeatherHistoryTasksParcels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Treatment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ProductApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Substance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "SubstanceDose" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Disease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_SubstanceDiseases" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (idempotent with CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION is_admin(user_id text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "AdminUser"
        WHERE email = (
            SELECT email FROM "User" WHERE id = user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies for User table
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON "User";
CREATE POLICY "Users can view their own profile or admins can view all" ON "User"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = id OR
        is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON "User";
CREATE POLICY "Users can update their own profile or admins can update all" ON "User"
    FOR UPDATE USING (
        (select auth.uid())::text = id OR is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can insert their own profile or admins can insert" ON "User";
CREATE POLICY "Users can insert their own profile or admins can insert" ON "User"
    FOR INSERT WITH CHECK (
        (select auth.uid())::text = id OR is_admin((select auth.uid())::text)
    );

-- Create RLS policies for Account table
DROP POLICY IF EXISTS "Users can manage their own accounts or admins can manage all" ON "Account";
CREATE POLICY "Users can manage their own accounts or admins can manage all" ON "Account"
    FOR ALL USING (
        (select auth.uid())::text = "userId" OR is_admin((select auth.uid())::text)
    );

-- Create RLS policies for Session table
DROP POLICY IF EXISTS "Users can manage their own sessions or admins can manage all" ON "Session";
CREATE POLICY "Users can manage their own sessions or admins can manage all" ON "Session"
    FOR ALL USING (
        (select auth.uid())::text = "userId" OR is_admin((select auth.uid())::text)
    );

-- Create RLS policies for Parcel table
DROP POLICY IF EXISTS "Users can view their own parcels or admins can view all" ON "Parcel";
CREATE POLICY "Users can view their own parcels or admins can view all" ON "Parcel"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = "userId" OR
        is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can insert their own parcels or admins can insert" ON "Parcel";
CREATE POLICY "Users can insert their own parcels or admins can insert" ON "Parcel"
    FOR INSERT WITH CHECK (
        (select auth.uid())::text = "userId" OR is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can update their own parcels or admins can update all" ON "Parcel";
CREATE POLICY "Users can update their own parcels or admins can update all" ON "Parcel"
    FOR UPDATE USING (
        (select auth.uid())::text = "userId" OR is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can delete their own parcels or admins can delete all" ON "Parcel";
CREATE POLICY "Users can delete their own parcels or admins can delete all" ON "Parcel"
    FOR DELETE USING (
        (select auth.uid())::text = "userId" OR is_admin((select auth.uid())::text)
    );

-- Create RLS policies for Treatment table
DROP POLICY IF EXISTS "Users can view their own treatments or admins can view all" ON "Treatment";
CREATE POLICY "Users can view their own treatments or admins can view all" ON "Treatment"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = "userId" OR
        is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can insert their own treatments or admins can insert" ON "Treatment";
CREATE POLICY "Users can insert their own treatments or admins can insert" ON "Treatment"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = "userId" OR
        is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can update their own treatments or admins can update all" ON "Treatment";
CREATE POLICY "Users can update their own treatments or admins can update all" ON "Treatment"
    FOR UPDATE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = "userId" OR
        is_admin((select auth.uid())::text)
    );

DROP POLICY IF EXISTS "Users can delete their own treatments or admins can delete all" ON "Treatment";
CREATE POLICY "Users can delete their own treatments or admins can delete all" ON "Treatment"
    FOR DELETE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid())::text = "userId" OR
        is_admin((select auth.uid())::text)
    );

-- Create RLS policies for ProductApplication table
DROP POLICY IF EXISTS "Users can view their own product applications or admins can view all" ON "ProductApplication";
CREATE POLICY "Users can view their own product applications or admins can view all" ON "ProductApplication"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        EXISTS (
            SELECT 1 FROM "Treatment" t
            WHERE t.id = "ProductApplication"."treatmentId"
            AND (t."userId" = (select auth.uid())::text OR is_admin((select auth.uid())::text))
        )
    );

DROP POLICY IF EXISTS "Users can insert their own product applications or admins can insert" ON "ProductApplication";
CREATE POLICY "Users can insert their own product applications or admins can insert" ON "ProductApplication"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        EXISTS (
            SELECT 1 FROM "Treatment" t
            WHERE t.id = "ProductApplication"."treatmentId"
            AND (t."userId" = (select auth.uid())::text OR is_admin((select auth.uid())::text))
        )
    );

DROP POLICY IF EXISTS "Users can update their own product applications or admins can update all" ON "ProductApplication";
CREATE POLICY "Users can update their own product applications or admins can update all" ON "ProductApplication"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Treatment" t
            WHERE t.id = "ProductApplication"."treatmentId"
            AND (t."userId" = (select auth.uid())::text OR is_admin((select auth.uid())::text))
        )
    );

DROP POLICY IF EXISTS "Users can delete their own product applications or admins can delete all" ON "ProductApplication";
CREATE POLICY "Users can delete their own product applications or admins can delete all" ON "ProductApplication"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Treatment" t
            WHERE t.id = "ProductApplication"."treatmentId"
            AND (t."userId" = (select auth.uid())::text OR is_admin((select auth.uid())::text))
        )
    );

-- RLS Policies for WeatherHistoryTask
DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can view weather history tasks" ON "WeatherHistoryTask";
CREATE POLICY "Authenticated users, admins, and cron jobs can view weather history tasks" ON "WeatherHistoryTask"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can insert weather history tasks" ON "WeatherHistoryTask";
CREATE POLICY "Authenticated users, admins, and cron jobs can insert weather history tasks" ON "WeatherHistoryTask"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can update weather history tasks" ON "WeatherHistoryTask";
CREATE POLICY "Authenticated users, admins, and cron jobs can update weather history tasks" ON "WeatherHistoryTask"
    FOR UPDATE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can delete weather history tasks" ON "WeatherHistoryTask";
CREATE POLICY "Authenticated users, admins, and cron jobs can delete weather history tasks" ON "WeatherHistoryTask"
    FOR DELETE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

-- RLS Policies for WeatherHistory
DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can view weather history" ON "WeatherHistory";
CREATE POLICY "Authenticated users, admins, and cron jobs can view weather history" ON "WeatherHistory"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can insert weather history" ON "WeatherHistory";
CREATE POLICY "Authenticated users, admins, and cron jobs can insert weather history" ON "WeatherHistory"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can update weather history" ON "WeatherHistory";
CREATE POLICY "Authenticated users, admins, and cron jobs can update weather history" ON "WeatherHistory"
    FOR UPDATE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users, admins, and cron jobs can delete weather history" ON "WeatherHistory";
CREATE POLICY "Authenticated users, admins, and cron jobs can delete weather history" ON "WeatherHistory"
    FOR DELETE USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

-- RLS Policies for _WeatherHistoryTasksParcels junction table
DROP POLICY IF EXISTS "Users can view weather history task-parcel relationships for their parcels or admins/cron can view all" ON "_WeatherHistoryTasksParcels";
CREATE POLICY "Users can view weather history task-parcel relationships for their parcels or admins/cron can view all" ON "_WeatherHistoryTasksParcels"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can insert weather history task-parcel relationships for their parcels or admins/cron can insert" ON "_WeatherHistoryTasksParcels";
CREATE POLICY "Users can insert weather history task-parcel relationships for their parcels or admins/cron can insert" ON "_WeatherHistoryTasksParcels"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can update weather history task-parcel relationships for their parcels or admins/cron can update all" ON "_WeatherHistoryTasksParcels";
CREATE POLICY "Users can update weather history task-parcel relationships for their parcels or admins/cron can update all" ON "_WeatherHistoryTasksParcels"
    FOR UPDATE USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can delete weather history task-parcel relationships for their parcels or admins/cron can delete all" ON "_WeatherHistoryTasksParcels";
CREATE POLICY "Users can delete weather history task-parcel relationships for their parcels or admins/cron can delete all" ON "_WeatherHistoryTasksParcels"
    FOR DELETE USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

-- RLS Policies for _WeatherHistoryParcels junction table
DROP POLICY IF EXISTS "Users can view weather history-parcel relationships for their parcels or admins/cron can view all" ON "_WeatherHistoryParcels";
CREATE POLICY "Users can view weather history-parcel relationships for their parcels or admins/cron can view all" ON "_WeatherHistoryParcels"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can insert weather history-parcel relationships for their parcels or admins/cron can insert" ON "_WeatherHistoryParcels";
CREATE POLICY "Users can insert weather history-parcel relationships for their parcels or admins/cron can insert" ON "_WeatherHistoryParcels"
    FOR INSERT WITH CHECK (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can update weather history-parcel relationships for their parcels or admins/cron can update all" ON "_WeatherHistoryParcels";
CREATE POLICY "Users can update weather history-parcel relationships for their parcels or admins/cron can update all" ON "_WeatherHistoryParcels"
    FOR UPDATE USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

DROP POLICY IF EXISTS "Users can delete weather history-parcel relationships for their parcels or admins/cron can delete all" ON "_WeatherHistoryParcels";
CREATE POLICY "Users can delete weather history-parcel relationships for their parcels or admins/cron can delete all" ON "_WeatherHistoryParcels"
    FOR DELETE USING (
        (select auth.role()) = 'service_role' OR
        is_admin((select auth.uid())::text) OR
        EXISTS (
            SELECT 1 FROM "Parcel" p
            WHERE p.id = "A"
            AND p."userId" = (select auth.uid())::text
        )
    );

-- RLS policies for _SubstanceDiseases junction table
-- Drop old policies if they exist (from previous versions)
DROP POLICY IF EXISTS "Anyone can view substance-disease relationships" ON "_SubstanceDiseases";
DROP POLICY IF EXISTS "Allow select for authenticated users" ON "_SubstanceDiseases";

DROP POLICY IF EXISTS "Authenticated users can view substance-disease relationships" ON "_SubstanceDiseases";
CREATE POLICY "Authenticated users can view substance-disease relationships" ON "_SubstanceDiseases"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

-- Authenticated users can view reference tables (Product, Substance, Disease)
-- These are catalog/reference data but should only be accessible to logged-in users
-- Drop old "Anyone can view" policies if they exist (from previous versions)
DROP POLICY IF EXISTS "Anyone can view products" ON "Product";
DROP POLICY IF EXISTS "Anyone can view substances" ON "Substance";
DROP POLICY IF EXISTS "Anyone can view diseases" ON "Disease";
DROP POLICY IF EXISTS "Anyone can view substance doses" ON "SubstanceDose";

-- Drop old policies with typos/variations if they exist
DROP POLICY IF EXISTS "only autenticated can view products" ON "Product";
DROP POLICY IF EXISTS "only autenticated can view substances" ON "Substance";
DROP POLICY IF EXISTS "only autenticated can view diseases" ON "Disease";
DROP POLICY IF EXISTS "only autenticated can view substance doses" ON "SubstanceDose";

-- Create new authenticated-only policies (including service_role for cron jobs)
DROP POLICY IF EXISTS "Authenticated users can view products" ON "Product";
CREATE POLICY "Authenticated users can view products" ON "Product"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users can view substances" ON "Substance";
CREATE POLICY "Authenticated users can view substances" ON "Substance"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users can view diseases" ON "Disease";
CREATE POLICY "Authenticated users can view diseases" ON "Disease"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

DROP POLICY IF EXISTS "Authenticated users can view substance doses" ON "SubstanceDose";
CREATE POLICY "Authenticated users can view substance doses" ON "SubstanceDose"
    FOR SELECT USING (
        (select auth.role()) = 'service_role' OR
        (select auth.uid()) IS NOT NULL
    );

-- Admin policies for reference tables (only admins can modify)
-- Note: SELECT is handled by the "Authenticated users can view" policies above
-- We use separate policies for INSERT, UPDATE, DELETE to avoid multiple permissive SELECT policies

-- Drop old FOR ALL policies if they exist (from previous versions)
DROP POLICY IF EXISTS "Only admins can modify products" ON "Product";
DROP POLICY IF EXISTS "Only admins can modify substances" ON "Substance";
DROP POLICY IF EXISTS "Only admins can modify diseases" ON "Disease";
DROP POLICY IF EXISTS "Only admins can modify substance doses" ON "SubstanceDose";

-- Product modification policies
DROP POLICY IF EXISTS "Only admins can insert products" ON "Product";
CREATE POLICY "Only admins can insert products" ON "Product"
    FOR INSERT WITH CHECK (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update products" ON "Product";
CREATE POLICY "Only admins can update products" ON "Product"
    FOR UPDATE USING (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete products" ON "Product";
CREATE POLICY "Only admins can delete products" ON "Product"
    FOR DELETE USING (is_admin((select auth.uid())::text));

-- Substance modification policies
DROP POLICY IF EXISTS "Only admins can insert substances" ON "Substance";
CREATE POLICY "Only admins can insert substances" ON "Substance"
    FOR INSERT WITH CHECK (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update substances" ON "Substance";
CREATE POLICY "Only admins can update substances" ON "Substance"
    FOR UPDATE USING (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete substances" ON "Substance";
CREATE POLICY "Only admins can delete substances" ON "Substance"
    FOR DELETE USING (is_admin((select auth.uid())::text));

-- Disease modification policies
DROP POLICY IF EXISTS "Only admins can insert diseases" ON "Disease";
CREATE POLICY "Only admins can insert diseases" ON "Disease"
    FOR INSERT WITH CHECK (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update diseases" ON "Disease";
CREATE POLICY "Only admins can update diseases" ON "Disease"
    FOR UPDATE USING (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete diseases" ON "Disease";
CREATE POLICY "Only admins can delete diseases" ON "Disease"
    FOR DELETE USING (is_admin((select auth.uid())::text));

-- SubstanceDose modification policies
DROP POLICY IF EXISTS "Only admins can insert substance doses" ON "SubstanceDose";
CREATE POLICY "Only admins can insert substance doses" ON "SubstanceDose"
    FOR INSERT WITH CHECK (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update substance doses" ON "SubstanceDose";
CREATE POLICY "Only admins can update substance doses" ON "SubstanceDose"
    FOR UPDATE USING (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete substance doses" ON "SubstanceDose";
CREATE POLICY "Only admins can delete substance doses" ON "SubstanceDose"
    FOR DELETE USING (is_admin((select auth.uid())::text));

-- Admin policies for AdminUser table
DROP POLICY IF EXISTS "Admins can manage admin users" ON "AdminUser";
CREATE POLICY "Admins can manage admin users" ON "AdminUser"
    FOR ALL USING (is_admin((select auth.uid())::text));

-- _SubstanceDiseases modification policies (SELECT is handled by "Authenticated users can view" policy above)
-- Drop old policies if they exist (from previous versions)
DROP POLICY IF EXISTS "Only admins can modify substance-disease relationships" ON "_SubstanceDiseases";
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON "_SubstanceDiseases";
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON "_SubstanceDiseases";
DROP POLICY IF EXISTS "Allow update for authenticated users" ON "_SubstanceDiseases";

DROP POLICY IF EXISTS "Only admins can insert substance-disease relationships" ON "_SubstanceDiseases";
CREATE POLICY "Only admins can insert substance-disease relationships" ON "_SubstanceDiseases"
    FOR INSERT WITH CHECK (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can update substance-disease relationships" ON "_SubstanceDiseases";
CREATE POLICY "Only admins can update substance-disease relationships" ON "_SubstanceDiseases"
    FOR UPDATE USING (is_admin((select auth.uid())::text));

DROP POLICY IF EXISTS "Only admins can delete substance-disease relationships" ON "_SubstanceDiseases";
CREATE POLICY "Only admins can delete substance-disease relationships" ON "_SubstanceDiseases"
    FOR DELETE USING (is_admin((select auth.uid())::text));

-- Create indexes for better performance (already using IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_parcel_user_id ON "Parcel"("userId");
CREATE INDEX IF NOT EXISTS idx_treatment_user_id ON "Treatment"("userId");
CREATE INDEX IF NOT EXISTS idx_treatment_parcel_id ON "Treatment"("parcelId");
