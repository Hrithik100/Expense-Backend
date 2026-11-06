
import { pool } from "../config/db.js";

export const getDashboardTotals = async (userId, month) => {
  const [rows] = await pool.execute(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
     FROM transactions
     WHERE user_id = ?
       AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
    [userId, month]
  );

  return rows[0];
};

export const getExpensesByCategory = async (userId, month) => {
  const [rows] = await pool.execute(
    `SELECT
      COALESCE(c.name, 'Uncategorized') AS name,
      COALESCE(c.color, '#94a3b8') AS color,
      SUM(t.amount) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ?
       AND t.type = 'expense'
       AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?
     GROUP BY c.id, c.name, c.color
     ORDER BY total DESC`,
    [userId, month]
  );

  return rows;
};

export const getRecentTransactions = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT
      t.id,
      t.type,
      t.amount,
      t.description,
      t.transaction_date AS date,
      COALESCE(c.name, 'Uncategorized') AS category,
      c.color
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = ?
     ORDER BY t.transaction_date DESC, t.id DESC
     LIMIT 6`,
    [userId]
  );

  return rows;
};
