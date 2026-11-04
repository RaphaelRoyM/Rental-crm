-- ============================================================
--  Equipment & Tool Rental CRM — Database Schema
--  Run this in Supabase SQL Editor to create all tables.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'staff')),
  phone         VARCHAR(20),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(20)  NOT NULL,
  address         TEXT,
  id_proof_type   VARCHAR(50),
  id_proof_number VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 3. SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  phone          VARCHAR(20),
  email          VARCHAR(150),
  address        TEXT,
  type           VARCHAR(20)  NOT NULL CHECK (type IN ('vendor', 'service', 'both')),
  notes          TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 5. TOOL TYPES  (Model / Catalogue level)
-- ============================================================
CREATE TABLE tool_types (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id             VARCHAR(20)   NOT NULL UNIQUE,
  name                VARCHAR(200)  NOT NULL,
  brand               VARCHAR(100),
  model_number        VARCHAR(100),
  category            VARCHAR(100)  NOT NULL,
  description         TEXT,
  power_type          VARCHAR(30)   CHECK (power_type IN ('electric', 'battery', 'petrol', 'manual', 'other')),
  specifications      TEXT,
  default_daily_rate  DECIMAL(10,2) NOT NULL,
  default_weekly_rate DECIMAL(10,2),
  security_deposit    DECIMAL(10,2) NOT NULL DEFAULT 0,
  accessories         TEXT,
  image_url           TEXT,
  notes               TEXT,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. ASSETS  (Individual physical units)
-- ============================================================
CREATE TABLE assets (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id              VARCHAR(20)   NOT NULL UNIQUE,
  tool_type_id          UUID          NOT NULL REFERENCES tool_types(id) ON DELETE RESTRICT,
  serial_number         VARCHAR(100),
  barcode               VARCHAR(100),
  purchase_date         DATE,
  purchase_price        DECIMAL(10,2),
  supplier_id           UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
  condition             VARCHAR(20)   NOT NULL DEFAULT 'good'
                          CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  status                VARCHAR(20)   NOT NULL DEFAULT 'available'
                          CHECK (status IN ('available', 'reserved', 'rented', 'maintenance', 'retired')),
  storage_location      VARCHAR(150),
  warranty_expiry       DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  notes                 TEXT,
  created_at            TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 7. RENTALS
-- ============================================================
CREATE TABLE rentals (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_number     VARCHAR(20)   NOT NULL UNIQUE,
  customer_id       UUID          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  created_by        UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_date        DATE          NOT NULL,
  expected_end_date DATE          NOT NULL,
  actual_end_date   DATE,
  status            VARCHAR(20)   NOT NULL DEFAULT 'reserved'
                      CHECK (status IN ('reserved', 'active', 'returned', 'cancelled')),
  subtotal          DECIMAL(10,2) NOT NULL DEFAULT 0,
  late_fee          DECIMAL(10,2) NOT NULL DEFAULT 0,
  damage_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 8. RENTAL ITEMS  (One row = one physical asset in a rental)
-- ============================================================
CREATE TABLE rental_items (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id   UUID          NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  asset_id    UUID          NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  daily_rate  DECIMAL(10,2) NOT NULL,
  days_rented INTEGER,
  subtotal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  UNIQUE (rental_id, asset_id)
);


-- ============================================================
-- 9. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id   UUID          NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
  amount      DECIMAL(10,2) NOT NULL,
  type        VARCHAR(30)   NOT NULL
                CHECK (type IN ('deposit', 'rent', 'late_fee', 'damage_fee', 'deposit_refund', 'deposit_deduction')),
  method      VARCHAR(30)   NOT NULL
                CHECK (method IN ('cash', 'card', 'bank_transfer', 'online')),
  received_by UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes       TEXT,
  paid_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 10. DAMAGE IMAGES
-- ============================================================
CREATE TABLE damage_images (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id   UUID      NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  asset_id    UUID      NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  image_url   TEXT      NOT NULL,
  description TEXT,
  uploaded_by UUID      REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. MAINTENANCE LOGS
-- ============================================================
CREATE TABLE maintenance_logs (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id    UUID          NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  supplier_id UUID          REFERENCES suppliers(id) ON DELETE SET NULL,
  type        VARCHAR(20)   NOT NULL CHECK (type IN ('repair', 'service', 'inspection')),
  description TEXT,
  cost        DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date  DATE          NOT NULL,
  end_date    DATE,
  status      VARCHAR(20)   NOT NULL DEFAULT 'ongoing'
                CHECK (status IN ('ongoing', 'completed')),
  created_by  UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tool_types_category     ON tool_types(category);
CREATE INDEX idx_tool_types_active       ON tool_types(is_active);
CREATE INDEX idx_assets_tool_type        ON assets(tool_type_id);
CREATE INDEX idx_assets_status           ON assets(status);
CREATE INDEX idx_assets_serial           ON assets(serial_number);
CREATE INDEX idx_rentals_customer        ON rentals(customer_id);
CREATE INDEX idx_rentals_status          ON rentals(status);
CREATE INDEX idx_rental_items_rental     ON rental_items(rental_id);
CREATE INDEX idx_rental_items_asset      ON rental_items(asset_id);
CREATE INDEX idx_payments_rental         ON payments(rental_id);
CREATE INDEX idx_damage_images_rental    ON damage_images(rental_id);
CREATE INDEX idx_maintenance_asset       ON maintenance_logs(asset_id);


-- ============================================================
-- AUTO-ID: rental_number → RNT-0001
-- ============================================================
CREATE SEQUENCE rental_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_rental_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rental_number := 'RNT-' || LPAD(nextval('rental_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rental_number
  BEFORE INSERT ON rentals
  FOR EACH ROW
  WHEN (NEW.rental_number IS NULL OR NEW.rental_number = '')
  EXECUTE FUNCTION generate_rental_number();


-- ============================================================
-- AUTO-ID: tool_id → TOOL-0001
-- ============================================================
CREATE SEQUENCE tool_type_seq START 1;

CREATE OR REPLACE FUNCTION generate_tool_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tool_id := 'TOOL-' || LPAD(nextval('tool_type_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tool_id
  BEFORE INSERT ON tool_types
  FOR EACH ROW
  WHEN (NEW.tool_id IS NULL OR NEW.tool_id = '')
  EXECUTE FUNCTION generate_tool_id();


-- ============================================================
-- AUTO-ID: asset_id → AST-0001
-- ============================================================
CREATE SEQUENCE asset_seq START 1;

CREATE OR REPLACE FUNCTION generate_asset_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.asset_id := 'AST-' || LPAD(nextval('asset_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asset_id
  BEFORE INSERT ON assets
  FOR EACH ROW
  WHEN (NEW.asset_id IS NULL OR NEW.asset_id = '')
  EXECUTE FUNCTION generate_asset_id();
