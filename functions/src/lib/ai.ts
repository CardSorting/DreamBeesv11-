import { db } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout, logger } from "./utils.js";
import { B2_BUCKET, B2_PUBLIC_URL } from "./constants.js";

/**
 * Core AI Utilities
 * This file contains helpers for image storage and processing related to AI generation.
 */
