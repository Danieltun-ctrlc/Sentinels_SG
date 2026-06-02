-- Schema extensions for Game Deep Dive
-- Run AFTER the base schema

-- Expand user_creatures with tracking columns (ignore errors if already exist)
-- Using separate statements to handle existing columns gracefully
ALTER TABLE user_creatures ADD COLUMN nickname VARCHAR(50) NULL AFTER creature_id;
ALTER TABLE user_creatures ADD COLUMN active_ability VARCHAR(50) DEFAULT 'default';
ALTER TABLE user_creatures ADD COLUMN battles_won INT DEFAULT 0;
ALTER TABLE user_creatures ADD COLUMN battles_lost INT DEFAULT 0;
ALTER TABLE user_creatures ADD COLUMN times_used INT DEFAULT 0;
ALTER TABLE user_creatures ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Active squad table
CREATE TABLE IF NOT EXISTS active_squad (
  user_id INT NOT NULL,
  slot_position TINYINT NOT NULL,
  creature_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, slot_position),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Battle sessions for resume capability
CREATE TABLE IF NOT EXISTS battle_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  battle_type ENUM('PVE','PVP') NOT NULL,
  mission_id VARCHAR(50),
  state JSON NOT NULL,
  status ENUM('ACTIVE','COMPLETED','ABANDONED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, status)
);

-- Intel cards collected from missions
CREATE TABLE IF NOT EXISTS intel_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_id VARCHAR(50) NOT NULL,
  unlocked_via_mission VARCHAR(50),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_card (user_id, card_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TAP transaction audit log
CREATE TABLE IF NOT EXISTS tap_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  category ENUM('hp','atk','def','spd','general') NOT NULL,
  reason VARCHAR(100),
  reference_id VARCHAR(50),
  balance_after INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, created_at DESC)
);
