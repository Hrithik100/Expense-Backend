
import { pool } from "../config/db.js";

export const createUser = async (name, email, passwordHash) => {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash)
     VALUES (?, ?, ?)`,
    [name, email, passwordHash]
  );

  return result.insertId;
};

export const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] || null;
};

export const updateRefreshToken = async (id, tokenHash) => {
  await pool.execute(
    `UPDATE users
     SET refresh_token_hash = ?
     WHERE id = ?`,
    [tokenHash, id]
  );
};

export const findUserRefreshToken = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, refresh_token_hash
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

export const revokeRefreshToken = async (id, tokenHash) => {
  await pool.execute(
    `UPDATE users
     SET refresh_token_hash = NULL
     WHERE id = ? AND refresh_token_hash = ?`,
    [id, tokenHash]
  );
};

export const findUserById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};
