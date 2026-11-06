import jwt from "jsonwebtoken";
import crypto from "node:crypto";
const accessSecret = process.env.JWT_ACCESS_SECRET || "";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "";
if (
  accessSecret.length < 10 ||
  refreshSecret.length < 10 ||
  accessSecret === refreshSecret
) {
  console.warn(
    "Configure distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values (32+ characters) in .env.",
  );
}
export const createAccessToken = (id) =>
  jwt.sign({ sub: String(id) }, accessSecret, { expiresIn: "15m" });
export const createRefreshToken = (id) =>
  jwt.sign({ sub: String(id), jti: crypto.randomUUID() }, refreshSecret, {
    expiresIn: "7d",
  });
export const verifyAccessToken = (token) => jwt.verify(token, accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
