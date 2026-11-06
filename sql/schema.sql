CREATE DATABASE IF NOT EXISTS expense_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE expense_tracker;

CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 refresh_token_hash CHAR(64) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NULL,
 name VARCHAR(60) NOT NULL,
 type ENUM('income','expense','both') NOT NULL DEFAULT 'expense',
 color VARCHAR(7) NOT NULL DEFAULT '#10b981',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 UNIQUE KEY uq_user_category (user_id, name, type),
 INDEX idx_categories_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 category_id BIGINT UNSIGNED NULL,
 type ENUM('income','expense') NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 description VARCHAR(255) NOT NULL DEFAULT '',
 transaction_date DATE NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
 CONSTRAINT chk_transaction_amount CHECK (amount > 0),
 INDEX idx_transactions_user_date (user_id, transaction_date),
 INDEX idx_transactions_user_type (user_id, type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budgets (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 category_id BIGINT UNSIGNED NOT NULL,
 budget_month CHAR(7) NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
 CONSTRAINT chk_budget_amount CHECK (amount > 0),
 UNIQUE KEY uq_budget (user_id, category_id, budget_month)
) ENGINE=InnoDB;

-- Global starter categories (user_id NULL). Create per-user custom categories later as needed.
INSERT IGNORE INTO categories (user_id,name,type,color) VALUES
(NULL,'Food & Dining','expense','#f97316'),(NULL,'Transport','expense','#0ea5e9'),
(NULL,'Shopping','expense','#8b5cf6'),(NULL,'Bills','expense','#64748b'),
(NULL,'Health','expense','#ef4444'),(NULL,'Entertainment','expense','#ec4899'),
(NULL,'Salary','income','#10b981'),(NULL,'Freelance','income','#14b8a6'),
(NULL,'Other','both','#94a3b8');
