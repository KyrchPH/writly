import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MONGODB_DB_NAME: z.string().min(1).default("writly"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.preprocess(emptyStringToUndefined, z.string().optional()),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, "FIREBASE_STORAGE_BUCKET is required"),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  GMAIL_SENDER_EMAIL: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  GMAIL_FROM_NAME: z.preprocess(
    emptyStringToUndefined,
    z.string().default("Writly"),
  ),
  GMAIL_REPLY_TO: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  ADMIN_APP_URL: z.string().default("http://localhost:3000/admin"),
  PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  CV_OTP_EXPIRY_MINUTES: z.coerce.number().int().min(1).max(30).default(10),
  CV_OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(30).max(900).default(180),
  CV_DOWNLOAD_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(900).default(300),
  REVIEW_INVITATION_EXPIRY_DAYS: z.coerce.number().int().min(1).max(60).default(14),
  CRON_KEEPALIVE_SECRET: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessage = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid server environment variables: ${errorMessage}`);
}

const corsOrigins = parsed.data.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/+$/, ""))
  .filter(Boolean);

export const env = {
  ...parsed.data,
  CORS_ORIGINS: corsOrigins,
};

export const isProd = env.NODE_ENV === "production";

export const isEmailConfigured =
  Boolean(env.GMAIL_CLIENT_ID?.trim()) &&
  Boolean(env.GMAIL_CLIENT_SECRET?.trim()) &&
  Boolean(env.GMAIL_REFRESH_TOKEN?.trim()) &&
  Boolean(env.GMAIL_SENDER_EMAIL?.trim());
