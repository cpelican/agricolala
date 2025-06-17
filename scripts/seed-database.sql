-- Seed initial substances
INSERT INTO "Substance" (id, name, "maxDosage", "createdAt", "updatedAt") VALUES
('substance_1', 'Copper', 4.0, NOW(), NOW()),
('substance_2', 'Sulfur', 6.0, NOW(), NOW()),
('substance_3', 'Mancozeb', 2.0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Seed initial diseases
INSERT INTO "Disease" (id, name, description, "createdAt", "updatedAt") VALUES
('disease_1', 'Peronospora', 'Downy mildew affecting grapevines', NOW(), NOW()),
('disease_2', 'Oidio', 'Powdery mildew affecting grapevines', NOW(), NOW()),
('disease_3', 'Botrytis', 'Gray mold affecting grapes', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Link substances to diseases
INSERT INTO "_SubstanceTargets" ("A", "B") VALUES
('disease_1', 'substance_1'),
('disease_1', 'substance_3'),
('disease_2', 'substance_2'),
('disease_3', 'substance_1')
ON CONFLICT DO NOTHING;

-- Seed initial products
INSERT INTO "Product" (id, brand, name, "createdAt", "updatedAt") VALUES
('product_1', 'Bayer', 'Copper Sulfate 25%', NOW(), NOW()),
('product_2', 'Syngenta', 'Sulfur WG 80%', NOW(), NOW()),
('product_3', 'BASF', 'Mancozeb 75%', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seed substance doses for products
INSERT INTO "SubstanceDose" (id, dose, "substanceId", "productId", "createdAt", "updatedAt") VALUES
('dose_1', 250.0, 'substance_1', 'product_1', NOW(), NOW()),
('dose_2', 800.0, 'substance_2', 'product_2', NOW(), NOW()),
('dose_3', 750.0, 'substance_3', 'product_3', NOW(), NOW())
ON CONFLICT DO NOTHING;
