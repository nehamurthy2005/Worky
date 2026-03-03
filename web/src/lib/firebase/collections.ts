/**
 * Firestore collection name constants.
 * Safe to import in both client and server components.
 * Does NOT import firebase-admin.
 */

export const COLLECTIONS = {
  PROFILES:      "profiles",
  WALLETS:       "wallets",
  TRANSACTIONS:  "transactions",
  CAMPAIGNS:     "campaigns",
  SLOTS:         "campaign_slots",
  APPLICATIONS:  "applications",
  WORK_LOGS:     "work_logs",
  WITHDRAWALS:   "withdrawals",
  DISPUTES:      "disputes",
  BOOSTS:        "boost_purchases",
  NOTIFICATIONS: "notifications",
  FRAUD_FLAGS:   "fraud_flags",
  REVIEWS:       "reviews",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
