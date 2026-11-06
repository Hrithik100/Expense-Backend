import { verifyAccessToken } from "../utils/tokens.js";
export function requireAuth(req, res, next) {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer "))
    return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = verifyAccessToken(value.slice(7));
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid subject");
    req.userId = id;
    next();
  } catch {
    return res.status(401).json({ message: "Access token expired or invalid" });
  }
}
