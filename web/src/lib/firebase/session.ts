/**
 * Firebase Auth Helpers — shared utilities for managing
 * the Firebase session cookie used by the Next.js proxy.
 *
 * Flow:
 *   1. Client signs in with Firebase Auth SDK → receives ID token
 *   2. Client POSTs the ID token to /api/auth/session-login
 *   3. Server creates a Firebase session cookie (httpOnly, secure)
 *   4. proxy.ts (Next.js middleware) reads the cookie and verifies it
 *   5. Server components call getCurrentUser() to get the verified user
 */

export const SESSION_COOKIE_NAME = "__kw_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds
