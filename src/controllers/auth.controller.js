
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  createUser,
  findUserByEmail,
  updateRefreshToken,
  findUserRefreshToken,
  revokeRefreshToken,
  findUserById,
} from "../models/auth.model.js";

import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const cookieName = "expense_refresh";

const clearRefreshCookie = (res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/auth",
  });
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
});

async function issueSession(id, res) {
  const refresh = createRefreshToken(id);

  await updateRefreshToken(id, hashToken(refresh));

  res.cookie(cookieName, refresh, cookieOptions());

  return createAccessToken(id);
}

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "Invalid input",
    });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const id = Number(
      await createUser(
        name,
        normalizedEmail,
        await bcrypt.hash(password, 12)
      )
    );

    const accessToken = await issueSession(id, res);

    return res.status(201).json({
      accessToken,
      user: { id, name, email: normalizedEmail },
    });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    throw e;
  }
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Enter a valid email and password",
    });
  }

  const user = await findUserByEmail(
    parsed.data.email.toLowerCase()
  );

  if (
    !user ||
    !(await bcrypt.compare(parsed.data.password, user.password_hash))
  ) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const accessToken = await issueSession(Number(user.id), res);

  return res.json({
    accessToken,
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
    },
  });
}

export async function refresh(req, res) {
  const token = req.cookies?.[cookieName];

  if (!token) {
    return res.status(401).json({
      message: "Refresh session missing",
    });
  }

  try {
    const payload = verifyRefreshToken(token);
    const id = Number(payload.sub);

    const user = await findUserRefreshToken(id);

    if (
      !user?.refresh_token_hash ||
      user.refresh_token_hash !== hashToken(token)
    ) {
      throw new Error("Refresh token revoked");
    }

    const accessToken = await issueSession(id, res);

    return res.json({ accessToken });
  } catch {
    clearRefreshCookie(res);

    return res.status(401).json({
      message: "Refresh session expired; please log in again",
    });
  }
}

export async function logout(req, res) {
  const token = req.cookies?.[cookieName];

  if (token) {
    try {
      const payload = verifyRefreshToken(token);

      await revokeRefreshToken(
        Number(payload.sub),
        hashToken(token)
      );
    } catch {
      // Expired or invalid token: still clear cookie.
    }
  }

  clearRefreshCookie(res);

  return res.json({ message: "Logged out" });
}

export async function me(req, res) {
  const user = await findUserById(req.userId);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json({
    user: {
      id: Number(user.id),
      name: user.name,
      email: user.email,
    },
  });
}
