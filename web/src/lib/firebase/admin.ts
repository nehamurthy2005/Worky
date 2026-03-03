/**
 * Firebase Admin SDK — server-side only.
 * Uses the service account key from environment variables.
 * NEVER import this in client components.
 */

import { cert, getApps, initializeApp, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApp();

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    // During build/test with no credentials, return a stub.
    // Real requests will fail at the auth.verifySessionCookie call (which is correct).
    return initializeApp({ projectId: projectId ?? "placeholder" });
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const adminApp  = getAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb   = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
