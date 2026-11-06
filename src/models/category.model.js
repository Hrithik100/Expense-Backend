import { pool } from "../config/db.js";

export const validateCategory = async (userId, categoryId, type) => {
  if (!categoryId) return true;

  const [rows] = await pool.execute(
    `SELECT id
     FROM categories
     WHERE id = ?
       AND (user_id = ? OR user_id IS NULL)
       AND (type = ? OR type = 'both')
     LIMIT 1`,
    [categoryId, userId, type],
  );

  return rows.length > 0;
};

export const getCategories = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      type,
      color,
      user_id AS userId
     FROM categories
     WHERE user_id IS NULL OR user_id = ?
     ORDER BY name`,
    [userId]
  );

  return rows;
};

export const findCategoryByName = async (userId, name, excludeId = null) => {
  const [rows] = await pool.execute(
    `SELECT id
     FROM categories
     WHERE user_id = ?
       AND LOWER(name) = LOWER(?)
       AND (? IS NULL OR id != ?)
     LIMIT 1`,
    [userId, name, excludeId, excludeId],
  );

  return rows[0] || null;
};

export const createCategory = async (userId, { name, type, color }) => {
  const [result] = await pool.execute(
    `INSERT INTO categories (user_id, name, type, color)
     VALUES (?, ?, ?, ?)`,
    [userId, name, type, color],
  );

  return result.insertId;
};

export const findCategoryById = async (userId, id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, type, color
     FROM categories
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [id, userId],
  );

  return rows[0] || null;
};

export const updateCategory = async (userId, id, { name, type, color }) => {
  const [result] = await pool.execute(
    `UPDATE categories
     SET name = ?, type = ?, color = ?
     WHERE id = ? AND user_id = ?`,
    [name, type, color, id, userId],
  );

  return result.affectedRows;
};

export const deleteCategory = async (userId, id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM budgets
       WHERE user_id = ? AND category_id = ?`,
      [userId, id],
    );

    await connection.execute(
      `UPDATE transactions
       SET category_id = NULL
       WHERE user_id = ? AND category_id = ?`,
      [userId, id],
    );

    const [result] = await connection.execute(
      `DELETE FROM categories
       WHERE id = ? AND user_id = ?`,
      [id, userId],
    );

    await connection.commit();

    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
