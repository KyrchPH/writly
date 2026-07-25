import { readFileSync } from "fs";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

const parseServiceAccount = (raw: string, source: string): ServiceAccount => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${source}.`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid service account payload in ${source}.`);
  }

  const data = parsed as Record<string, unknown>;
  const clientEmail = data.client_email;
  const privateKey = data.private_key;
  const projectId = data.project_id;

  if (typeof clientEmail !== "string" || clientEmail.length === 0) {
    throw new Error(`Missing client_email in ${source}.`);
  }

  if (typeof privateKey !== "string" || privateKey.length === 0) {
    throw new Error(`Missing private_key in ${source}.`);
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    ...(typeof projectId === "string" && projectId ? { projectId } : {}),
  };
};

const readServiceAccountFile = (serviceAccountPath: string) => {
  try {
    return readFileSync(serviceAccountPath, "utf8");
  } catch {
    throw new Error(
      `Unable to read FIREBASE_SERVICE_ACCOUNT_PATH at "${serviceAccountPath}".`,
    );
  }
};

const resolveServiceAccount = (): ServiceAccount | null => {
  const inlineJson = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return parseServiceAccount(inlineJson, "FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (!serviceAccountPath) {
    return null;
  }

  return parseServiceAccount(
    readServiceAccountFile(serviceAccountPath),
    `FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath})`,
  );
};

export const getFirebaseAdminApp = (): App => {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const serviceAccount = resolveServiceAccount();
  return initializeApp({
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  });
};

export const getFirebaseAdminAuth = () => getAuth(getFirebaseAdminApp());
