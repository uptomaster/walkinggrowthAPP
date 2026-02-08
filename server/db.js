const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'walk_growth.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id INTEGER NOT NULL PRIMARY KEY,
    data_json TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
`);

function createUser(nickname, passwordHash) {
  const stmt = db.prepare('INSERT INTO users (nickname, password_hash) VALUES (?, ?)');
  const result = stmt.run(nickname, passwordHash);
  return result.lastInsertRowid;
}

function findUserByNickname(nickname) {
  const stmt = db.prepare('SELECT id, nickname, password_hash FROM users WHERE nickname = ?');
  return stmt.get(nickname);
}

function findUserById(id) {
  const stmt = db.prepare('SELECT id, nickname FROM users WHERE id = ?');
  return stmt.get(id);
}

function getUserData(userId) {
  const stmt = db.prepare('SELECT data_json, updated_at FROM user_data WHERE user_id = ?');
  return stmt.get(userId);
}

function setUserData(userId, dataJson) {
  const stmt = db.prepare(`
    INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = datetime('now')
  `);
  stmt.run(userId, dataJson);
}

module.exports = {
  db,
  createUser,
  findUserByNickname,
  findUserById,
  getUserData,
  setUserData,
};
