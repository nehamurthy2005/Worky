import { type NextRequest } from "next/server";
import { verifySessionAndRedirect } from "@/lib/firebase/middleware";

export async function proxy(request: NextRequest) {
  return await verifySessionAndRedirect(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
