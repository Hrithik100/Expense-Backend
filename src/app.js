
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import routes from "./routes/index.js";
import { pool } from "./config/db.js";

const app = express();

app.set("trust proxy", 1);


app.disable("x-powered-by");
app.use(helmet());


app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);


app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());


app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many requests. Please try again later.",
    },
  })
);


app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    return res.status(503).json({
      ok: false,
      database: "unavailable",
    });
  }
});


app.use("/api", routes);


app.use((_req, res) => {
  return res.status(404).json({
    message: "API endpoint not found",
  });
});


app.use((err, _req, res, _next) => {
  console.error("API Error:", err);

  return res.status(500).json({
    message: "Unexpected server error",
  });
});

export default app;
