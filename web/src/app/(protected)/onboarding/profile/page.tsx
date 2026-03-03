"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupForm";
import type { UserRole } from "@/types/database";

export default function ProfileSetupPage() {
  const router = useRouter();

  const [userId, setUserId]       = useState<string | null>(null);
  const [role, setRole]           = useState<UserRole | null>(null);
  const [prefillName, setPrefillName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      const pendingRole = localStorage.getItem("kw_pending_role") as UserRole | null;
      if (!pendingRole) {
        router.push("/onboarding/role");
        return;
      }

      setUserId(firebaseUser.uid);
      setRole(pendingRole);
      setPrefillName(firebaseUser.displayName ?? "");
    });

    return () => unsubscribe();
  }, [router]);

  if (!userId || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <ProfileSetupForm userId={userId} role={role} prefillName={prefillName} />
  );
}
