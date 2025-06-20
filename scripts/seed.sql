-- Seed data for Agraria PWA
-- Run this in Supabase SQL Editor after setting up RLS

-- Delete existing data (in reverse dependency order)
DELETE FROM "SubstanceDose";
DELETE FROM "ProductApplication";
DELETE FROM "_SubstanceDiseases";
DELETE FROM "Substance";
DELETE FROM "Disease";
DELETE FROM "Product";

-- Create diseases
INSERT INTO "Disease" (id, name, description, "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Oidium', 'Powdery mildew, a fungal disease affecting grapevines', NOW(), NOW()),
(gen_random_uuid(), 'Peronospora', 'Downy mildew, a fungal disease affecting grapevines', NOW(), NOW());

-- Create substances
INSERT INTO "Substance" (id, name, "maxDosage", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Copper', 4.0, NOW(), NOW()),
(gen_random_uuid(), 'Sulfur', 10.0, NOW(), NOW());

-- Create substance-disease relationships (using the actual IDs from above)
INSERT INTO "_SubstanceDiseases" ("A", "B")
SELECT d.id, s.id
FROM "Disease" d, "Substance" s
WHERE (d.name = 'Peronospora' AND s.name = 'Copper')
   OR (d.name = 'Oidium' AND s.name = 'Sulfur');

-- Create products
INSERT INTO "Product" (id, name, brand, "maxCumulatedQuantity", "maxApplications", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Pasta cafaro', 'Pasta cafaro', 18.0, 6, NOW(), NOW()),
(gen_random_uuid(), 'Zolfo tiovit', 'Zolfo tiovit', 40.0, 10, NOW(), NOW());

-- Create product compositions (SubstanceDose)
INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 25.0, s.id, p.id, NOW(), NOW()
FROM "Substance" s, "Product" p
WHERE s.name = 'Copper' AND p.name = 'Pasta cafaro';

INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 80.0, s.id, p.id, NOW(), NOW()
FROM "Substance" s, "Product" p
WHERE s.name = 'Sulfur' AND p.name = 'Zolfo tiovit'; 