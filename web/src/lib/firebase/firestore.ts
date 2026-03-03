/**
 * Firestore data-access helpers — server-side (uses Firebase Admin).
 * ⚠️  Do NOT import this file in client components ("use client").
 *     Import `@/lib/firebase/collections` for collection name constants.
 *     Import `@/lib/firebase/client` for client-side Firestore reads.
 */

import { adminAuth, adminDb } from "./admin";
import type {
  Profile,
  Wallet,
  Transaction,
  FirestoreProfile,
  FirestoreWallet,
  FirestoreTransaction,
} from "@/types/database";
import { SESSION_COOKIE_NAME } from "./session";
import { cookies } from "next/headers";

// Re-export is handled by the import below; no separate export needed.
import { COLLECTIONS } from "./collections";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Get the currently authenticated user from the session cookie.
 * Returns null if the session is missing or invalid.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded;
  } catch {
    return null;
  }
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await adminDb.collection(COLLECTIONS.PROFILES).doc(uid).get();
  if (!snap.exists) return null;

  const data = snap.data() as FirestoreProfile;
  return {
    id:                  snap.id,
    role:                data.role,
    full_name:           data.full_name,
    phone:               data.phone ?? null,
    avatar_url:          data.avatar_url ?? null,
    bio:                 data.bio ?? null,
    city:                data.city ?? null,
    state:               data.state ?? null,
    location_updated_at: data.location_updated_at ?? null,
    kyc_status:          data.kyc_status ?? "NOT_SUBMITTED",
    kyc_verified_at:     data.kyc_verified_at ?? null,
    avg_rating:          data.avg_rating ?? 0,
    total_reviews:       data.total_reviews ?? 0,
    is_active:           data.is_active ?? true,
    created_at:          data.created_at ?? new Date().toISOString(),
    updated_at:          data.updated_at ?? new Date().toISOString(),
  };
}

// ─── Wallet helpers ───────────────────────────────────────────────────────────

export async function getWallet(uid: string): Promise<Wallet | null> {
  const snap = await adminDb
    .collection(COLLECTIONS.WALLETS)
    .where("user_id", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const doc  = snap.docs[0];
  const data = doc.data() as FirestoreWallet;
  return {
    id:                doc.id,
    user_id:           data.user_id,
    available_balance: data.available_balance ?? 0,
    frozen_balance:    data.frozen_balance ?? 0,
    lifetime_earned:   data.lifetime_earned ?? 0,
    lifetime_spent:    data.lifetime_spent ?? 0,
    created_at:        data.created_at ?? new Date().toISOString(),
    updated_at:        data.updated_at ?? new Date().toISOString(),
  };
}

// ─── Transaction helpers ──────────────────────────────────────────────────────

export async function getTransactions(
  walletId: string,
  limit = 20
): Promise<Transaction[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.TRANSACTIONS)
    .where("wallet_id", "==", walletId)
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as FirestoreTransaction;
    return {
      id:               doc.id,
      wallet_id:        data.wallet_id,
      amount_paisa:     data.amount_paisa,
      type:             data.type,
      status:           data.status ?? "PENDING",
      idempotency_key:  data.idempotency_key,
      reference_id:     data.reference_id ?? null,
      reference_type:   data.reference_type ?? null,
      description:      data.description ?? null,
      metadata:         data.metadata ?? {},
      created_at:       data.created_at ?? new Date().toISOString(),
      updated_at:       data.updated_at ?? new Date().toISOString(),
    };
  });
}
