import { getStorage } from "firebase-admin/storage";
import { env } from "../config/env.js";
import { getFirebaseAdminApp } from "./firebase-admin.js";

export const getFirebaseStorageBucket = () =>
  getStorage(getFirebaseAdminApp()).bucket(env.FIREBASE_STORAGE_BUCKET);

export const getFirebaseStorageBucketName = () => env.FIREBASE_STORAGE_BUCKET;
