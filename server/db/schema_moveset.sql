-- Equipped moves per creature (max 4 slots)
CREATE TABLE IF NOT EXISTS equipped_moves (
  user_id INT NOT NULL,
  creature_id VARCHAR(50) NOT NULL,
  slot_position TINYINT NOT NULL,
  move_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (user_id, creature_id, slot_position),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Unlocked abilities per creature (users start with default, unlock hidden via gameplay)
CREATE TABLE IF NOT EXISTS unlocked_abilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  creature_id VARCHAR(50) NOT NULL,
  ability_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_ability (user_id, creature_id, ability_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
