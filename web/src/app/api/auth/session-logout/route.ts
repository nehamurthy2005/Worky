/**
 * POST /api/auth/session-logout
 * Clears the Firebase session cookie.
 */

import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/session";

export async function POST() {
  const response = NextResponse.json({ status: "ok" }, { status: 200 });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   0,
    path:     "/",
  });

  return response;
}
