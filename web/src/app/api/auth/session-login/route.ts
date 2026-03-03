/**
 * POST /api/auth/session-login
 *
 * Exchanges a Firebase ID token (from client SDK) for a server-side
 * Firebase session cookie (httpOnly, Secure, SameSite=Strict).
 *
 * This is the secure pattern for Next.js App Router + Firebase Auth:
 *   1. Client signs in with Firebase SDK → gets idToken
 *   2. Client POSTs idToken to this endpoint
 *   3. Server verifies idToken and creates a 14-day session cookie
 *   4. Cookie is used by proxy.ts and server components
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/firebase/session";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    // Verify the ID token and create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000, // ms
    });

    const response = NextResponse.json({ status: "ok" }, { status: 200 });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   SESSION_COOKIE_MAX_AGE,
      path:     "/",
    });

    return response;
  } catch (error) {
    console.error("session-login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}
