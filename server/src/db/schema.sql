-- Phase 2: Winter Treatment Dispatch System Database Schema

-- Traffic Management Centers (5 ALDOT regions)
CREATE TABLE IF NOT EXISTS tmc_centers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  long DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users (Admin, Dispatcher, Driver)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'dispatcher', 'driver')),
  tmc_id INTEGER REFERENCES tmc_centers(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User TMC Preferences (for configurable state-wide dashboard)
CREATE TABLE IF NOT EXISTS user_tmc_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tmc_id INTEGER REFERENCES tmc_centers(id) ON DELETE CASCADE,
  is_monitoring BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tmc_id)
);

-- Trucks
CREATE TABLE IF NOT EXISTS trucks (
  id SERIAL PRIMARY KEY,
  truck_number VARCHAR(50) UNIQUE NOT NULL,
  tmc_id INTEGER REFERENCES tmc_centers(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_service', 'maintenance')),
  current_driver_id INTEGER REFERENCES users(id),
  capacity_tons DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  tmc_id INTEGER REFERENCES tmc_centers(id),
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('salt', 'sand', 'brine', 'other')),
  quantity_tons DECIMAL(10, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(tmc_id, material_type)
);

-- Treatment Tickets
CREATE TABLE IF NOT EXISTS treatment_tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  tmc_id INTEGER REFERENCES tmc_centers(id),
  created_by INTEGER REFERENCES users(id),
  assigned_driver_id INTEGER REFERENCES users(id),
  truck_id INTEGER REFERENCES trucks(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_time TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bridge Treatments (links tickets to specific bridges)
CREATE TABLE IF NOT EXISTS bridge_treatments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES treatment_tickets(id),
  bridge_id VARCHAR(50) NOT NULL,
  treatment_type VARCHAR(50) CHECK (treatment_type IN ('salt', 'sand', 'brine', 'combination')),
  material_used_tons DECIMAL(10, 2),
  treated_at TIMESTAMP DEFAULT NOW(),
  weather_conditions TEXT,
  driver_notes TEXT,
  photo_url TEXT
);

-- Weather Alerts
CREATE TABLE IF NOT EXISTS weather_alerts (
  id SERIAL PRIMARY KEY,
  region VARCHAR(50),
  alert_type VARCHAR(50),
  severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe', 'extreme')),
  description TEXT,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON treatment_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_tmc ON treatment_tickets(tmc_id);
CREATE INDEX IF NOT EXISTS idx_tickets_driver ON treatment_tickets(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_bridge_treatments_bridge ON bridge_treatments(bridge_id);
CREATE INDEX IF NOT EXISTS idx_bridge_treatments_ticket ON bridge_treatments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trucks_tmc ON trucks(tmc_id);
