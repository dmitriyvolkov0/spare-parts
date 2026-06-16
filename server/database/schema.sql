CREATE DATABASE IF NOT EXISTS auto_spare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auto_spare;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  login VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'technician', 'storekeeper') NOT NULL DEFAULT 'technician',
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipment (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inventory_number VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spare_parts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  location VARCHAR(255) NULL,
  created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repairs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipment_id BIGINT UNSIGNED NOT NULL,
  repair_date DATE NOT NULL,
  description TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_repairs_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  CONSTRAINT fk_repairs_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS repair_parts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  repair_id BIGINT UNSIGNED NOT NULL,
  part_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_repair_parts_repair FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE,
  CONSTRAINT fk_repair_parts_part FOREIGN KEY (part_id) REFERENCES spare_parts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  part_id BIGINT UNSIGNED NOT NULL,
  operation_type ENUM('INCOME', 'EXPENSE') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  comment TEXT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_stock_part FOREIGN KEY (part_id) REFERENCES spare_parts(id),
  CONSTRAINT fk_stock_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (full_name, login, password, role, created_at)
SELECT 'Администратор', 'admin', '$2y$10$2/pliWepkuWMLKZT0ATQh.iVQ96a/eY6uUtXr7TxY.eV23GKYYo.e', 'admin', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'admin');

INSERT INTO equipment (inventory_number, name)
SELECT 'EQ-001', 'Компрессорная установка'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE inventory_number = 'EQ-001');

INSERT INTO spare_parts (article, name, unit, quantity, min_quantity, location, created_at)
SELECT 'BRG-205', 'Подшипник 205', 'шт', 10, 3, 'Стеллаж A1', NOW()
WHERE NOT EXISTS (SELECT 1 FROM spare_parts WHERE article = 'BRG-205');
