// import mysql from "mysql2/promise";
// import dotenv from "dotenv";
// dotenv.config();
// export const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "expense_tracker",
//   waitForConnections: true,
//   connectionLimit: 10,
//   decimalNumbers: true,
//   timezone: "Z",
// });



import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDir, "../../.env"),
});

const isProduction = process.env.NODE_ENV === "production";

const requiredEnv = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
];

if (isProduction) {
  requiredEnv.push("DB_PASSWORD", "DB_SSL_CA_CERT");
}

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ...(isProduction && {
    ssl: {
      ca: process.env.DB_SSL_CA_CERT.replace(/\\n/g, "\n"),
    },
  }),

  waitForConnections: true,
  connectionLimit: 5,
  decimalNumbers: true,
  timezone: "Z",
});