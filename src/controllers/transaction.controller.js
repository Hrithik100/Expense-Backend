
import { z } from "zod";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../models/transaction.model.js";

import {
  validateCategory,
  getCategories,
} from "../models/category.model.js";

import {
  getDashboardTotals,
  getExpensesByCategory,
  getRecentTransactions,
} from "../models/dashboard.model.js";

import {
  getBudgetsByMonth,
  validateBudgetCategory,
  upsertBudget,
} from "../models/budget.model.js";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive().max(9999999999.99),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(255).default(""),
});

const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.coerce.number().positive().max(9999999999.99),
});

const getMonth = (queryMonth) => {
  return typeof queryMonth === "string" &&
    /^\d{4}-\d{2}$/.test(queryMonth)
    ? queryMonth
    : new Date().toISOString().slice(0, 7);
};

const formatDate = (date) => {
  return typeof date === "string"
    ? date
    : date.toISOString().slice(0, 10);
};

// GET /transactions
export async function list(req, res) {
  const month = getMonth(req.query.month);

  const type = ["income", "expense"].includes(String(req.query.type))
    ? String(req.query.type)
    : "";

  const search =
    typeof req.query.search === "string"
      ? req.query.search.slice(0, 100)
      : "";

  const page = Math.max(
    1,
    Math.min(100000, Number(req.query.page) || 1)
  );

  const limit = Math.max(
    1,
    Math.min(100, Number(req.query.limit) || 20)
  );

  const { rows, total } = await getTransactions(req.userId, {
    month,
    type,
    search,
    limit,
    offset: (page - 1) * limit,
  });

  return res.json({
    items: rows.map((r) => ({
      ...r,
      id: Number(r.id),
      categoryId:
        r.categoryId === null ? null : Number(r.categoryId),
      amount: Number(r.amount),
      date: formatDate(r.date),
    })),
    page,
    limit,
    total,
  });
}

// POST /transactions
export async function create(req, res) {
  const p = schema.safeParse(req.body);

  if (!p.success) {
    return res.status(400).json({
      message: p.error.issues[0]?.message || "Invalid transaction",
    });
  }

  const validCategory = await validateCategory(
    req.userId,
    p.data.categoryId,
    p.data.type
  );

  if (!validCategory) {
    return res.status(400).json({
      message: "Invalid category for this transaction type",
    });
  }

  const id = await createTransaction(req.userId, p.data);

  return res.status(201).json({
    id: Number(id),
    ...p.data,
    categoryId: p.data.categoryId || null,
  });
}

// PUT /transactions/:id
export async function update(req, res) {
  const p = schema.safeParse(req.body);
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      message: "Invalid transaction id",
    });
  }

  if (!p.success) {
    return res.status(400).json({
      message: p.error.issues[0]?.message || "Invalid transaction",
    });
  }

  const validCategory = await validateCategory(
    req.userId,
    p.data.categoryId,
    p.data.type
  );

  if (!validCategory) {
    return res.status(400).json({
      message: "Invalid category for this transaction type",
    });
  }

  const affectedRows = await updateTransaction(
    req.userId,
    id,
    p.data
  );

  if (!affectedRows) {
    return res.status(404).json({
      message: "Transaction not found",
    });
  }

  return res.json({
    id,
    ...p.data,
    categoryId: p.data.categoryId || null,
  });
}

// DELETE /transactions/:id
export async function remove(req, res) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({
      message: "Invalid transaction id",
    });
  }

  const affectedRows = await deleteTransaction(req.userId, id);

  if (!affectedRows) {
    return res.status(404).json({
      message: "Transaction not found",
    });
  }

  return res.json({
    message: "Transaction deleted",
  });
}

// GET /transactions/categories
export async function categories(req, res) {
  const rows = await getCategories(req.userId);

  return res.json(
    rows.map((r) => ({
      ...r,
      id: Number(r.id),
    }))
  );
}

// GET /transactions/dashboard
export async function dashboard(req, res) {
  const month = getMonth(req.query.month);

  const [totals, byCategory, recent] = await Promise.all([
    getDashboardTotals(req.userId, month),
    getExpensesByCategory(req.userId, month),
    getRecentTransactions(req.userId),
  ]);

  const income = Number(totals.income);
  const expenses = Number(totals.expenses);

  return res.json({
    month,
    income,
    expenses,
    balance: income - expenses,
    savingsRate:
      income > 0
        ? Math.round(((income - expenses) / income) * 100)
        : 0,

    byCategory: byCategory.map((r) => ({
      ...r,
      total: Number(r.total),
    })),

    recent: recent.map((r) => ({
      ...r,
      id: Number(r.id),
      amount: Number(r.amount),
      date: formatDate(r.date),
    })),
  });
}

// GET /transactions/budgets
export async function getBudgets(req, res) {
  const month = getMonth(req.query.month);

  const rows = await getBudgetsByMonth(req.userId, month);

  return res.json(
    rows.map((r) => ({
      ...r,
      categoryId: Number(r.categoryId),
      budget: Number(r.budget),
      spent: Number(r.spent),
    }))
  );
}

// PUT /transactions/budgets/:categoryId
export async function setBudget(req, res) {
  const p = budgetSchema.safeParse(req.body);
  const categoryId = Number(req.params.categoryId);

  if (
    !Number.isSafeInteger(categoryId) ||
    categoryId < 1 ||
    !p.success
  ) {
    return res.status(400).json({
      message: "Provide a valid category, month, and positive budget",
    });
  }

  const validCategory = await validateBudgetCategory(
    req.userId,
    categoryId
  );

  if (!validCategory) {
    return res.status(400).json({
      message: "Invalid expense category",
    });
  }

  await upsertBudget(
    req.userId,
    categoryId,
    p.data.month,
    p.data.amount
  );

  return res.json({
    categoryId,
    ...p.data,
  });
}
