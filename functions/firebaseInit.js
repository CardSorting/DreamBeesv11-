import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";

// Initialize Firebase Admin with Application Default Credentials
// This automatically picks up the service account in Cloud Functions v2
const app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "dreambees-alchemist"
});

import { logger } from "./lib/utils.js";
logger.info(`[FirebaseInit] Initialized with project:`, { projectId: app.options.projectId });

import { getStorage } from "firebase-admin/storage";

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export { db, FieldValue, getFunctions, getStorage };
