
import { pool } from "../config/db.js";

export const getBudgetsByMonth = async (userId, month) => {
  const [rows] = await pool.execute(
    `SELECT
      b.category_id AS categoryId,
      c.name AS category,
      c.color,
      b.amount AS budget,
      COALESCE(SUM(t.amount), 0) AS spent
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t
       ON t.user_id = b.user_id
       AND t.category_id = b.category_id
       AND t.type = 'expense'
       AND DATE_FORMAT(t.transaction_date, '%Y-%m') = b.budget_month
     WHERE b.user_id = ?
       AND b.budget_month = ?
     GROUP BY b.id, c.name, c.color, b.amount, b.category_id`,
    [userId, month]
  );

  return rows;
};

export const validateBudgetCategory = async (
  userId,
  categoryId
) => {
  const [rows] = await pool.execute(
    `SELECT id
     FROM categories
     WHERE id = ?
       AND (user_id = ? OR user_id IS NULL)
       AND (type = 'expense' OR type = 'both')
     LIMIT 1`,
    [categoryId, userId]
  );

  return rows.length > 0;
};

export const upsertBudget = async (
  userId,
  categoryId,
  month,
  amount
) => {
  await pool.execute(
    `INSERT INTO budgets
      (user_id, category_id, budget_month, amount)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
    [userId, categoryId, month, amount]
  );
};
