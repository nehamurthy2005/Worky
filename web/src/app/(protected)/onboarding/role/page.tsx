"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole; label: string; emoji: string; desc: string }[] = [
  {
    value: "owner",
    label: "Owner",
    emoji: "🏢",
    desc: "I want to post jobs, hire workers, and manage campaigns.",
  },
  {
    value: "employee",
    label: "Employee",
    emoji: "👷",
    desc: "I want to find gig work, earn KCoins, and withdraw to my bank.",
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError(null);

    const user = auth.currentUser;

    if (!user) {
      router.push("/login");
      return;
    }

    // Store selected role in localStorage to pass to profile setup
    localStorage.setItem("kw_pending_role", selected);
    router.push("/onboarding/profile");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700">KoinWork</h1>
          <h2 className="mt-3 text-xl font-semibold text-gray-800">
            How will you use KoinWork?
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose your role to get started. You can&apos;t change this later.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelected(role.value)}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
                selected === role.value
                  ? "border-indigo-600 bg-indigo-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{role.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800">{role.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{role.desc}</p>
                </div>
                {selected === role.value && (
                  <div className="ml-auto flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Please wait…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
