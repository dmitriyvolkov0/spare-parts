ALTER TABLE users MODIFY role ENUM('admin', 'technician', 'storekeeper') NOT NULL DEFAULT 'technician';
