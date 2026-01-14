import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";

// Initialize Firebase Admin
// In Cloud Functions v2, initializeApp() without arguments automatically uses the project's default credentials.
initializeApp();

const db = getFirestore();
export { db, FieldValue, getFunctions };
