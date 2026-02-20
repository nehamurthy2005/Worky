"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const supabase = createClient();

  const [fullName, setFullName] = useState(prefillName);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any).insert({
      id: userId,
      role,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      bio: bio.trim() || null,
    });

    if (error) {
      // If profile already exists, update instead
      if (error.code === "23505") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from("profiles") as any)
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            city: city.trim() || null,
            state: state.trim() || null,
            bio: bio.trim() || null,
          })
          .eq("id", userId);

        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }
      } else {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
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
          <p className="mt-1 text-sm text-gray-500">
            Tell us a bit about yourself
          </p>
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

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Complete setup →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
