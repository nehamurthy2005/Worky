import { formatKCoins, formatRupees, paisaToKCoins } from "@/lib/utils/currency";
import type { Wallet, Transaction, TransactionType } from "@/types/database";
import { Card } from "@/components/ui/Card";

interface WalletCardProps {
  wallet: Wallet;
}

export function WalletCard({ wallet }: WalletCardProps) {
  const kcoins = paisaToKCoins(wallet.available_balance);
  const frozenKCoins = paisaToKCoins(wallet.frozen_balance);

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-200">Available Balance</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {kcoins.toLocaleString("en-IN")}
            <span className="ml-2 text-xl font-semibold text-indigo-200">KCoins</span>
          </p>
          <p className="mt-1 text-sm text-indigo-300">
            {formatRupees(wallet.available_balance)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 p-3">
          <span className="text-2xl" aria-hidden="true">🪙</span>
        </div>
      </div>

      {wallet.frozen_balance > 0 && (
        <div className="mt-4 rounded-lg bg-white/10 px-4 py-3">
          <p className="text-xs text-indigo-200">
            🔒 Frozen:{" "}
            <span className="font-semibold text-white">
              {frozenKCoins.toLocaleString("en-IN")} KCoins
            </span>{" "}
            (pending withdrawal / escrow)
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-sm">
        <div>
          <p className="text-indigo-300">Lifetime Earned</p>
          <p className="font-semibold">
            {formatKCoins(wallet.lifetime_earned)}
          </p>
        </div>
        <div>
          <p className="text-indigo-300">Lifetime Spent</p>
          <p className="font-semibold">
            {formatKCoins(wallet.lifetime_spent)}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── Transaction History ───────────────────────────────────────────────────

const TYPE_LABELS: Record<TransactionType, { label: string; color: string }> = {
  DEPOSIT:        { label: "Deposit",        color: "text-green-600" },
  PAYMENT:        { label: "Payment",        color: "text-green-600" },
  ESCROW_RELEASE: { label: "Escrow Release", color: "text-green-600" },
  ESCROW_FREEZE:  { label: "Escrow",         color: "text-orange-500" },
  WITHDRAWAL:     { label: "Withdrawal",     color: "text-red-600" },
  REFUND:         { label: "Refund",         color: "text-blue-600" },
  BOOST_FEE:      { label: "Boost",          color: "text-purple-600" },
};

interface TransactionRowProps {
  tx: Transaction;
}

function TransactionRow({ tx }: TransactionRowProps) {
  const meta = TYPE_LABELS[tx.type] ?? { label: tx.type, color: "text-gray-600" };
  const isCredit = tx.amount_paisa > 0;
  const absKCoins = paisaToKCoins(Math.abs(tx.amount_paisa));
  const date = new Date(tx.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
        {tx.description && (
          <p className="text-xs text-gray-400">{tx.description}</p>
        )}
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold ${
            isCredit ? "text-green-600" : "text-red-500"
          }`}
        >
          {isCredit ? "+" : "−"}
          {absKCoins.toLocaleString("en-IN")} KC
        </p>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
            tx.status === "COMPLETED"
              ? "bg-green-50 text-green-700"
              : tx.status === "PENDING"
              ? "bg-yellow-50 text-yellow-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {tx.status}
        </span>
      </div>
    </div>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        No transactions yet. Add funds to get started!
      </div>
    );
  }

  return (
    <div>
      {transactions.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
