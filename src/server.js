
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { pool } from "./config/db.js";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // Verify database connection
    await pool.query("SELECT 1");

    console.log("MySQL connected successfully");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Expense Tracker API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
