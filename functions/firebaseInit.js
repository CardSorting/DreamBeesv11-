import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

if (process.env.FUNCTIONS_EMULATOR || process.env.NODE_ENV === 'development') {
    const serviceAccount = require("./dreambees-app-gen-v1-firebase-adminsdk-fbsvc-195fd20c32.json");
    initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    initializeApp();
}

const db = getFirestore();
export { db, FieldValue, getFunctions };
