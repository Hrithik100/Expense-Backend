
import { z } from "zod";

import {
  getCategories,
  findCategoryByName,
  createCategory,
  findCategoryById,
  updateCategory,
  deleteCategory,
} from "../models/category.model.js";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  type: z.enum(["income", "expense", "both"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const validateId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// GET /api/categories
export async function listCategories(req, res) {
  const categories = await getCategories(req.userId);

  return res.json(
    categories.map((category) => ({
      ...category,
      id: Number(category.id),
      userId:
        category.userId === null
          ? null
          : Number(category.userId),
      isDefault: category.userId === null,
    }))
  );
}

// POST /api/categories
export async function addCategory(req, res) {
  const parsed = categorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "Invalid category",
    });
  }

  const { name, type, color } = parsed.data;

  const existing = await findCategoryByName(req.userId, name);

  if (existing) {
    return res.status(409).json({
      message: "A category with this name already exists",
    });
  }

  try {
    const id = await createCategory(req.userId, {
      name,
      type,
      color,
    });

    return res.status(201).json({
      id: Number(id),
      name,
      type,
      color,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A category with this name already exists",
      });
    }

    throw error;
  }
}

// PUT /api/categories/:id
export async function editCategory(req, res) {
  const id = validateId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "Invalid category ID",
    });
  }

  const parsed = categorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "Invalid category",
    });
  }

  const category = await findCategoryById(req.userId, id);

  if (!category) {
    return res.status(404).json({
      message: "Category not found or cannot be edited",
    });
  }

  const existing = await findCategoryByName(
    req.userId,
    parsed.data.name,
    id
  );

  if (existing) {
    return res.status(409).json({
      message: "A category with this name already exists",
    });
  }

  try {
    await updateCategory(req.userId, id, parsed.data);

    return res.json({
      id,
      ...parsed.data,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A category with this name already exists",
      });
    }

    throw error;
  }
}

// DELETE /api/categories/:id
export async function removeCategory(req, res) {
  const id = validateId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "Invalid category ID",
    });
  }

  const category = await findCategoryById(req.userId, id);

  if (!category) {
    return res.status(404).json({
      message: "Category not found or cannot be deleted",
    });
  }

  const deleted = await deleteCategory(req.userId, id);

  if (!deleted) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  return res.json({
    message: "Category deleted successfully",
  });
}
