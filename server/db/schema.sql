-- Sentinel SG Database Schema
-- For Aiven cloud MySQL (database: defaultdb)

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'Recruit',
  awareness_score INT DEFAULT 0,
  available_tap INT DEFAULT 50,
  hp_tap INT DEFAULT 0,
  atk_tap INT DEFAULT 0,
  def_tap INT DEFAULT 0,
  spd_tap INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_awareness (awareness_score DESC),
  INDEX idx_email (email),
  INDEX idx_username (username)
);

-- ============================================================
-- USER_CREATURES (which creatures each user has unlocked)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_creatures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  creature_id VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  hp_invested INT DEFAULT 0,
  atk_invested INT DEFAULT 0,
  def_invested INT DEFAULT 0,
  spd_invested INT DEFAULT 0,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_creature (user_id, creature_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ============================================================
-- USER_MOVES (which moves each creature has unlocked per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_moves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  creature_id VARCHAR(50) NOT NULL,
  move_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_move (user_id, creature_id, move_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_creature (user_id, creature_id)
);

-- ============================================================
-- MISSIONS_COMPLETED
-- ============================================================
CREATE TABLE IF NOT EXISTS missions_completed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mission_id VARCHAR(50) NOT NULL,
  rank_earned VARCHAR(2) DEFAULT 'C',
  turns_taken INT,
  damage_taken_pct INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_mission (mission_id)
);

-- ============================================================
-- BATTLES (history of all battles, PVE and PVP)
-- ============================================================
CREATE TABLE IF NOT EXISTS battles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  battle_type ENUM('PVE', 'PVP') NOT NULL,
  mission_id VARCHAR(50),
  opponent_user_id INT,
  result ENUM('WIN', 'LOSS', 'DRAW') NOT NULL,
  turns_taken INT,
  awareness_delta INT,
  battle_log JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (battle_type)
);

-- ============================================================
-- TRAINING_PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module_id VARCHAR(50) NOT NULL,
  status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
  progress_pct INT DEFAULT 0,
  tap_earned INT DEFAULT 0,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uniq_user_module (user_id, module_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ============================================================
-- FACTCHECK_HISTORY (audit log of fact-check requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS factcheck_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_type VARCHAR(20),
  file_name VARCHAR(255),
  verdict VARCHAR(50),
  confidence INT,
  threat_family VARCHAR(50),
  threat_subcategory VARCHAR(100),
  agent_1_result JSON,
  agent_2_result JSON,
  agents_agreed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_verdict (verdict)
);

-- ============================================================
-- CHARACTER_CUSTOMISATION
-- ============================================================
CREATE TABLE IF NOT EXISTS character_customisation (
  user_id INT PRIMARY KEY,
  headgear VARCHAR(50) DEFAULT 'base_cap',
  outfit VARCHAR(50) DEFAULT 'cadet_uniform',
  accessories VARCHAR(50) DEFAULT 'standard_visor',
  effects VARCHAR(50) DEFAULT 'cyan_aura',
  badge VARCHAR(50) DEFAULT 'recruit_badge',
  background VARCHAR(50) DEFAULT 'default',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- COSMETIC_UNLOCKS (which cosmetic items each user owns)
-- ============================================================
CREATE TABLE IF NOT EXISTS cosmetic_unlocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL,
  rarity VARCHAR(20),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_item (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);

-- ============================================================
-- PVP_MATCHES (queued / active / completed)
-- ============================================================
CREATE TABLE IF NOT EXISTS pvp_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player1_id INT NOT NULL,
  player2_id INT NOT NULL,
  winner_id INT,
  status ENUM('QUEUED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'QUEUED',
  player1_awareness_change INT DEFAULT 0,
  player2_awareness_change INT DEFAULT 0,
  battle_log JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (player1_id) REFERENCES users(id),
  FOREIGN KEY (player2_id) REFERENCES users(id),
  INDEX idx_status (status)
);
