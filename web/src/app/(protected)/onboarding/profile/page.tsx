"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProfileSetupForm } from "@/components/profile/ProfileSetupForm";
import type { UserRole } from "@/types/database";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [prefillName, setPrefillName] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const pendingRole = localStorage.getItem("kw_pending_role") as UserRole | null;
      if (!pendingRole) {
        router.push("/onboarding/role");
        return;
      }

      setUserId(user.id);
      setRole(pendingRole);
      setPrefillName(user.user_metadata?.full_name ?? "");
    }

    load();
  }, [supabase, router]);

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
