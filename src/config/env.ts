import dotenv from "dotenv";

dotenv.config();

function requireString(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

const NODE_ENV = (process.env.NODE_ENV ?? "development").trim();
const isProd = NODE_ENV === "production";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

const JWT_SECRET = requireString("JWT_SECRET", process.env.JWT_SECRET);

if (JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters (256-bit minimum for HS256).",
  );
}

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV,
  isProd,
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: requireString("DATABASE_URL", process.env.DATABASE_URL),
  FRONTEND_URL,
  JWT_SECRET,
  JWT_ISSUER: process.env.JWT_ISSUER?.trim() || "linkflow-server",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE?.trim() || "linkflow-clients",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN?.trim() || "15m",
  CORS_ORIGINS,
  TRUST_PROXY: process.env.TRUST_PROXY === "true",
};
