import { redirect } from "next/navigation";
import Link from "next/link";
import { WalletCard, TransactionList } from "@/components/wallet/WalletCard";
import {
  getCurrentUser,
  getProfile,
  getWallet,
  getTransactions,
} from "@/lib/firebase/firestore";

export const metadata = {
  title: "Wallet — KoinWork",
};

export default async function WalletPage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/login");

  const [profile, wallet] = await Promise.all([
    getProfile(authUser.uid),
    getWallet(authUser.uid),
  ]);

  if (!profile) redirect("/onboarding/role");
  if (!wallet) redirect("/dashboard");

  const transactions = await getTransactions(wallet.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/dashboard" className="text-indigo-600 hover:underline text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Wallet</h1>
          <span className="w-16" />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Balance card */}
        <WalletCard wallet={wallet} />

        {/* KYC notice */}
        {profile.kyc_status !== "APPROVED" && profile.role === "employee" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ KYC verification required to withdraw
            </p>
            <p className="mt-1 text-xs text-yellow-600">
              Complete your KYC to unlock withdrawals to your bank account.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition">
            + Add Funds
          </button>
          <button
            disabled={profile.kyc_status !== "APPROVED"}
            className="rounded-xl border border-indigo-200 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>

        {/* Transaction history */}
        <div>
          <h3 className="mb-3 text-base font-semibold text-gray-800">
            Transaction History
          </h3>
          <div className="rounded-2xl border border-gray-100 bg-white px-5 shadow-sm">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>
    </div>
  );
}
