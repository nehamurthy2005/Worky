/**
 * Firebase Middleware Helpers — used by proxy.ts.
 * Verifies the Firebase session cookie on every protected request.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./session";

const PROTECTED_PATHS = ["/dashboard", "/wallet", "/onboarding"];
const AUTH_PATHS      = ["/login", "/signup"];

/**
 * Lightweight cookie check for the proxy.
 *
 * ⚠️  SECURITY NOTE: This check only verifies cookie presence, NOT the token signature.
 * Cryptographic verification happens in server components via `getCurrentUser()` →
 * `adminAuth.verifySessionCookie()`. Every protected route MUST call `getCurrentUser()`
 * to ensure the session is valid — the proxy alone is not sufficient.
 * This two-layer approach avoids the latency of calling Firebase Admin on every edge
 * request, while server components still perform full verification before serving data.
 */
export async function verifySessionAndRedirect(request: NextRequest) {
  const session  = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthRoute  = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!session && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
