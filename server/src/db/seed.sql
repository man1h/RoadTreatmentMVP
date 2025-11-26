-- Seed data for ALDOT Traffic Management Centers

INSERT INTO tmc_centers (name, region, address, lat, long) VALUES
('North Region TMC', 'North', 'University of Alabama in Huntsville, Huntsville, AL', 34.7304, -86.6408),
('East Central Region TMC', 'East Central', '1020 Bankhead Highway West, Birmingham, AL 35204', 33.5186, -86.8104),
('West Central Region TMC', 'West Central', 'University of Alabama, Tuscaloosa, AL', 33.2098, -87.5692),
('Southeast Region TMC', 'Southeast', '1409 Coliseum Blvd, Montgomery, AL 36110', 32.3668, -86.2920),
('Southwest Region TMC', 'Southwest', '150 Dunlap Drive, Mobile, AL', 30.6954, -88.0431)
ON CONFLICT DO NOTHING;

-- Seed admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, role, tmc_id, name, phone) VALUES
('admin@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UerXjkdiDIwS0cLQbC1V0Yoi8qTIyPkqm', 'admin', 1, 'System Administrator', '555-0100')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Seed sample dispatchers for each TMC
INSERT INTO users (email, password_hash, role, tmc_id, name, phone) VALUES
('dispatcher.huntsville@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'dispatcher', 1, 'John Smith', '555-0101'),
('dispatcher.birmingham@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'dispatcher', 2, 'Sarah Johnson', '555-0102'),
('dispatcher.tuscaloosa@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'dispatcher', 3, 'Mike Williams', '555-0103'),
('dispatcher.montgomery@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'dispatcher', 4, 'Emily Davis', '555-0104'),
('dispatcher.mobile@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'dispatcher', 5, 'Robert Brown', '555-0105')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Seed sample drivers
INSERT INTO users (email, password_hash, role, tmc_id, name, phone) VALUES
('driver1.huntsville@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'driver', 1, 'Tom Anderson', '555-0201'),
('driver2.huntsville@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'driver', 1, 'Lisa Martinez', '555-0202'),
('driver1.birmingham@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'driver', 2, 'James Wilson', '555-0203'),
('driver2.birmingham@aldot.alabama.gov', '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW', 'driver', 2, 'Maria Garcia', '555-0204')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Seed trucks
INSERT INTO trucks (truck_number, tmc_id, status, capacity_tons) VALUES
('TRUCK-N-001', 1, 'available', 5.0),
('TRUCK-N-002', 1, 'available', 5.0),
('TRUCK-EC-001', 2, 'available', 7.0),
('TRUCK-EC-002', 2, 'available', 7.0),
('TRUCK-WC-001', 3, 'available', 5.0),
('TRUCK-SE-001', 4, 'available', 6.0),
('TRUCK-SW-001', 5, 'available', 6.0),
('TRUCK-SW-002', 5, 'available', 6.0)
ON CONFLICT (truck_number) DO NOTHING;

-- Seed material inventory
INSERT INTO materials (tmc_id, material_type, quantity_tons) VALUES
(1, 'salt', 100.0),
(1, 'sand', 50.0),
(1, 'brine', 200.0),
(2, 'salt', 150.0),
(2, 'sand', 75.0),
(2, 'brine', 300.0),
(3, 'salt', 80.0),
(3, 'sand', 40.0),
(3, 'brine', 150.0),
(4, 'salt', 120.0),
(4, 'sand', 60.0),
(4, 'brine', 250.0),
(5, 'salt', 110.0),
(5, 'sand', 55.0),
(5, 'brine', 220.0)
ON CONFLICT DO NOTHING;

-- Initialize default TMC preferences for all users (monitor all TMCs by default)
INSERT INTO user_tmc_preferences (user_id, tmc_id, is_monitoring)
SELECT u.id, t.id, true
FROM users u
CROSS JOIN tmc_centers t
ON CONFLICT (user_id, tmc_id) DO NOTHING;
