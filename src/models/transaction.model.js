import { pool } from "../config/db.js";

export const getTransactions = async (
  userId,
  { month, type, search, limit, offset },
) => {
  // Validate pagination values again at model level
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(Number(limit) || 20)));

  const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0));

  const where = [
    "t.user_id = ?",
    'DATE_FORMAT(t.transaction_date, "%Y-%m") = ?',
  ];

  const params = [userId, month];

  if (type) {
    where.push("t.type = ?");
    params.push(type);
  }

  if (search) {
    where.push("(t.description LIKE ? OR c.name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = where.join(" AND ");

  const [rows] = await pool.execute(
    `SELECT
      t.id,
      t.type,
      t.amount,
      t.category_id AS categoryId,
      t.description,
      t.transaction_date AS date,
      c.name AS category,
      c.color
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${whereClause}
     ORDER BY t.transaction_date DESC, t.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );

  const [count] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE ${whereClause}`,
    params,
  );

  return {
    rows,
    total: Number(count[0].total),
  };
};

export const createTransaction = async (userId, transaction) => {
  const [result] = await pool.execute(
    `INSERT INTO transactions
      (user_id, category_id, type, amount, description, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      transaction.categoryId || null,
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.date,
    ],
  );

  return result.insertId;
};

export const updateTransaction = async (userId, id, transaction) => {
  const [result] = await pool.execute(
    `UPDATE transactions
     SET category_id = ?,
         type = ?,
         amount = ?,
         description = ?,
         transaction_date = ?
     WHERE id = ? AND user_id = ?`,
    [
      transaction.categoryId || null,
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.date,
      id,
      userId,
    ],
  );

  return result.affectedRows;
};

export const deleteTransaction = async (userId, id) => {
  const [result] = await pool.execute(
    `DELETE FROM transactions
     WHERE id = ? AND user_id = ?`,
    [id, userId],
  );

  return result.affectedRows;
};
