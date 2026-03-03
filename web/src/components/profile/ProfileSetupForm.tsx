"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { UserRole } from "@/types/database";

interface ProfileSetupFormProps {
  userId: string;
  role: UserRole;
  prefillName?: string;
}

export function ProfileSetupForm({
  userId,
  role,
  prefillName = "",
}: ProfileSetupFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(prefillName);
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const [state, setState]       = useState("");
  const [bio, setBio]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }

    try {
      const profileRef = doc(db, COLLECTIONS.PROFILES, userId);
      await setDoc(
        profileRef,
        {
          role,
          full_name:           fullName.trim(),
          phone:               phone.trim() || null,
          city:                city.trim() || null,
          state:               state.trim() || null,
          bio:                 bio.trim() || null,
          kyc_status:          "NOT_SUBMITTED",
          avg_rating:          0,
          total_reviews:       0,
          is_active:           true,
          location_updated_at: serverTimestamp(),
          updated_at:          serverTimestamp(),
        },
        { merge: true } // upsert — safe for both new and existing profiles
      );

      // Create wallet document if it doesn't exist
      const walletRef = doc(db, COLLECTIONS.WALLETS, `wallet_${userId}`);
      await setDoc(
        walletRef,
        {
          user_id:           userId,
          available_balance: 0,
          frozen_balance:    0,
          lifetime_earned:   0,
          lifetime_spent:    0,
          created_at:        serverTimestamp(),
          updated_at:        serverTimestamp(),
        },
        { merge: true }
      );

      // Remove pending role from localStorage
      localStorage.removeItem("kw_pending_role");

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Profile save failed.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">
            {role === "owner" ? "🏢" : "👷"}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Set up your {role === "owner" ? "Owner" : "Employee"} profile
          </h2>
          <p className="mt-1 text-sm text-gray-500">Tell us a bit about yourself</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Full name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Rahul Sharma"
            />
            <Input
              label="Phone number (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              hint="Used for important notifications"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
              />
              <Input
                label="State"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
            {role === "employee" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Bio (optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Brief description of your skills and experience..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Complete setup →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
