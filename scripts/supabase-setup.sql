-- Supabase Setup Script for Agraria PWA
-- Run this in Supabase SQL Editor after creating your project

-- Enable Row Level Security on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parcel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Treatment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Substance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubstanceDose" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Disease" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_SubstanceDiseases" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
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
CREATE POLICY "Users can view their own profile or admins can view all" ON "User"
    FOR SELECT USING (
        auth.uid()::text = id OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can update their own profile or admins can update all" ON "User"
    FOR UPDATE USING (
        auth.uid()::text = id OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can insert their own profile or admins can insert" ON "User"
    FOR INSERT WITH CHECK (
        auth.uid()::text = id OR is_admin(auth.uid()::text)
    );

-- Create RLS policies for Account table
CREATE POLICY "Users can manage their own accounts or admins can manage all" ON "Account"
    FOR ALL USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

-- Create RLS policies for Session table
CREATE POLICY "Users can manage their own sessions or admins can manage all" ON "Session"
    FOR ALL USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

-- Create RLS policies for Parcel table
CREATE POLICY "Users can view their own parcels or admins can view all" ON "Parcel"
    FOR SELECT USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can insert their own parcels or admins can insert" ON "Parcel"
    FOR INSERT WITH CHECK (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can update their own parcels or admins can update all" ON "Parcel"
    FOR UPDATE USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can delete their own parcels or admins can delete all" ON "Parcel"
    FOR DELETE USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

-- Create RLS policies for Treatment table
CREATE POLICY "Users can view their own treatments or admins can view all" ON "Treatment"
    FOR SELECT USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can insert their own treatments or admins can insert" ON "Treatment"
    FOR INSERT WITH CHECK (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can update their own treatments or admins can update all" ON "Treatment"
    FOR UPDATE USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

CREATE POLICY "Users can delete their own treatments or admins can delete all" ON "Treatment"
    FOR DELETE USING (
        auth.uid()::text = "userId" OR is_admin(auth.uid()::text)
    );

-- Create RLS policies for ProductApplication table
CREATE POLICY "Users can view their own product applications or admins can view all" ON "ProductApplication"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Treatment" t 
            WHERE t.id = "ProductApplication"."treatmentId" 
            AND (t."userId" = auth.uid()::text OR is_admin(auth.uid()::text))
        )
    );

CREATE POLICY "Users can insert their own product applications or admins can insert" ON "ProductApplication"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Treatment" t 
            WHERE t.id = "ProductApplication"."treatmentId" 
            AND (t."userId" = auth.uid()::text OR is_admin(auth.uid()::text))
        )
    );

CREATE POLICY "Users can update their own product applications or admins can update all" ON "ProductApplication"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "Treatment" t 
            WHERE t.id = "ProductApplication"."treatmentId" 
            AND (t."userId" = auth.uid()::text OR is_admin(auth.uid()::text))
        )
    );

CREATE POLICY "Users can delete their own product applications or admins can delete all" ON "ProductApplication"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "Treatment" t 
            WHERE t.id = "ProductApplication"."treatmentId" 
            AND (t."userId" = auth.uid()::text OR is_admin(auth.uid()::text))
        )
    );

-- RLS policies for _SubstanceDiseases junction table
CREATE POLICY "Anyone can view substance-disease relationships" ON "_SubstanceDiseases"
    FOR SELECT USING (true);

-- Public read access for reference tables (Product, Substance, Disease)
CREATE POLICY "Anyone can view products" ON "Product"
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view substances" ON "Substance"
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view diseases" ON "Disease"
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view substance doses" ON "SubstanceDose"
    FOR SELECT USING (true);

-- Admin policies for reference tables (only admins can modify)
CREATE POLICY "Only admins can modify products" ON "Product"
    FOR ALL USING (is_admin(auth.uid()::text));

CREATE POLICY "Only admins can modify substances" ON "Substance"
    FOR ALL USING (is_admin(auth.uid()::text));

CREATE POLICY "Only admins can modify diseases" ON "Disease"
    FOR ALL USING (is_admin(auth.uid()::text));

CREATE POLICY "Only admins can modify substance doses" ON "SubstanceDose"
    FOR ALL USING (is_admin(auth.uid()::text));

-- Admin policies for AdminUser table
CREATE POLICY "Admins can manage admin users" ON "AdminUser"
    FOR ALL USING (is_admin(auth.uid()::text));

CREATE POLICY "Only admins can modify substance-disease relationships" ON "_SubstanceDiseases"
    FOR ALL USING (is_admin(auth.uid()::text));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcel_user_id ON "Parcel"("userId");
CREATE INDEX IF NOT EXISTS idx_treatment_user_id ON "Treatment"("userId");
CREATE INDEX IF NOT EXISTS idx_treatment_parcel_id ON "Treatment"("parcelId");
