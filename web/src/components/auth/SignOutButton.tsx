"use client";

import { useRouter } from "next/navigation";
import { auth, firebaseSignOut } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await firebaseSignOut(auth);
    await fetch("/api/auth/session-logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-400 hover:text-red-500 transition"
    >
      Sign out
    </button>
  );
}
