/**
 * KoinWork Database Types — Firebase Firestore
 *
 * All monetary values are stored as integer PAISA (never float).
 * 1 KCoin = 1000 paisa | ₹1 = 100 paisa | 1 KCoin = ₹10
 *
 * Run `firebase firestore:indexes` to sync composite index config.
 */

// ─── Enum types ───────────────────────────────────────────────────────────────

export type UserRole       = "owner" | "employee";
export type KycStatus      = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type TransactionType =
  | "DEPOSIT"
  | "ESCROW_FREEZE"
  | "ESCROW_RELEASE"
  | "PAYMENT"
  | "WITHDRAWAL"
  | "REFUND"
  | "BOOST_FEE";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "REVERSED";
export type CampaignStatus    =
  | "DRAFT" | "OPEN" | "IN_PROGRESS" | "SETTLING" | "SETTLED" | "CANCELLED";
export type EscrowStatus    =
  | "NONE" | "FROZEN" | "PARTIAL_RELEASE" | "SETTLED" | "REFUNDED";
export type SlotStatus      =
  | "AVAILABLE" | "APPLIED" | "ASSIGNED" | "COMPLETED" | "NO_SHOW" | "DISPUTED" | "CANCELLED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
export type WithdrawalStatus  =
  | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type DisputeStatus     =
  | "OPEN" | "UNDER_REVIEW" | "RESOLVED_OWNER" | "RESOLVED_EMPLOYEE" | "CLOSED";
export type BoostTier     = "BASIC" | "STANDARD" | "PREMIUM";
export type NotificationType =
  | "APPLICATION_RECEIVED" | "APPLICATION_ACCEPTED" | "APPLICATION_REJECTED"
  | "WORK_APPROVED" | "PAYMENT_RECEIVED" | "WITHDRAWAL_PROCESSED"
  | "DISPUTE_UPDATE" | "CAMPAIGN_UPDATE" | "SYSTEM";

// ─── App-layer row types (returned from Firestore helpers) ────────────────────

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  /** latitude, stored as plain number */
  lat?: number | null;
  /** longitude, stored as plain number */
  lng?: number | null;
  city: string | null;
  state: string | null;
  location_updated_at: string;
  kyc_status: KycStatus;
  kyc_verified_at: string | null;
  avg_rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  /** Integer paisa. 1 KCoin = 1000 paisa */
  available_balance: number;
  /** Integer paisa. Frozen for pending withdrawals / escrow */
  frozen_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  /** Integer paisa. Positive = credit, negative = debit */
  amount_paisa: number;
  type: TransactionType;
  status: TransactionStatus;
  idempotency_key: string;
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Firestore document shapes (raw from Firestore) ──────────────────────────
// These may have Firestore Timestamps; we normalise to ISO strings in helpers.

export type FirestoreProfile     = Omit<Profile, "id">;
export type FirestoreWallet      = Omit<Wallet, "id">;
export type FirestoreTransaction = Omit<Transaction, "id">;
