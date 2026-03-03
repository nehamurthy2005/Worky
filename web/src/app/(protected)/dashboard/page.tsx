import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatKCoins } from "@/lib/utils/currency";
import {
  getCurrentUser,
  getProfile,
  getWallet,
} from "@/lib/firebase/firestore";
import { SignOutButton } from "@/components/auth/SignOutButton";

export const metadata = {
  title: "Dashboard — KoinWork",
};

export default async function DashboardPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/login");

  const [profile, wallet] = await Promise.all([
    getProfile(authUser.uid),
    getWallet(authUser.uid),
  ]);

  if (!profile) redirect("/onboarding/role");

  const isOwner = profile.role === "owner";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-700">KoinWork</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile.full_name}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isOwner
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isOwner ? "Owner" : "Employee"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          Welcome back, {profile.full_name.split(" ")[0]}! 👋
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Wallet summary */}
          <Card className="col-span-full sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="mt-1 text-2xl font-bold text-indigo-700">
                  {wallet ? formatKCoins(wallet.available_balance) : "—"}
                </p>
              </div>
              <span className="text-3xl">🪙</span>
            </div>
            <Link
              href="/wallet"
              className="mt-4 block text-sm font-medium text-indigo-600 hover:underline"
            >
              View wallet →
            </Link>
          </Card>

          {/* KYC status */}
          <Card>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {profile.kyc_status === "APPROVED" ? "✅" : "⚠️"}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">KYC Status</p>
                <p
                  className={`text-sm font-semibold ${
                    profile.kyc_status === "APPROVED"
                      ? "text-green-600"
                      : profile.kyc_status === "PENDING"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {profile.kyc_status.replace("_", " ")}
                </p>
              </div>
            </div>
            {profile.kyc_status !== "APPROVED" && (
              <p className="mt-3 text-xs text-gray-400">
                KYC required to withdraw earnings.
              </p>
            )}
          </Card>

          {/* Role-specific quick action */}
          <Card>
            <p className="text-sm text-gray-500">
              {isOwner ? "Quick Actions" : "Find Work"}
            </p>
            <div className="mt-3 space-y-2">
              {isOwner ? (
                <>
                  <Link
                    href="/campaigns/create"
                    className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    + Create Campaign
                  </Link>
                  <Link
                    href="/campaigns"
                    className="block rounded-lg border border-indigo-200 px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    My Campaigns
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/feed"
                    className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    href="/applications"
                    className="block rounded-lg border border-indigo-200 px-4 py-2 text-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    My Applications
                  </Link>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Phase indicator */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <p className="text-sm font-semibold text-indigo-700">
            🚧 Phase 1 Complete: Foundation (Firebase)
          </p>
          <p className="mt-1 text-xs text-indigo-500">
            Auth ✅ &nbsp;|&nbsp; Profiles (Firestore) ✅ &nbsp;|&nbsp; Wallet ✅
            &nbsp;|&nbsp; Security Rules ✅ &nbsp;|&nbsp; Session Cookies ✅
          </p>
          <p className="mt-1 text-xs text-indigo-400">
            Next: Phase 2 — Campaign System (create, feed, per-slot escrow)
          </p>
        </div>
      </main>
    </div>
  );
}
