/**
 * KoinWork Cloud Functions — Phase 1 Scaffold
 *
 * All financial operations (wallet debits/credits, escrow, withdrawals)
 * are performed exclusively on the server via these Cloud Functions.
 * The client SDK NEVER directly writes to wallet or transaction collections.
 *
 * Deploy: firebase deploy --only functions
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// ─── Constants ───────────────────────────────────────────────────────────────
const PAISA_PER_KCOIN   = 1000; // 1 KCoin = ₹10 = 1000 paisa
const PAISA_PER_RUPEE   = 100;  // ₹1 = 100 paisa
const MIN_WITHDRAWAL    = 50 * PAISA_PER_KCOIN; // 50 KCoins = ₹500

// ─── Helper: atomic wallet debit using Firestore transaction ─────────────────
async function debitWallet(
  tx: admin.firestore.Transaction,
  walletRef: admin.firestore.DocumentReference,
  amountPaisa: number,
  idempotencyKey: string
): Promise<void> {
  const snap = await tx.get(walletRef);
  if (!snap.exists) throw new Error("Wallet not found");

  const wallet = snap.data()!;
  if (wallet.available_balance < amountPaisa) {
    throw new Error(`Insufficient balance. Need ${amountPaisa}, have ${wallet.available_balance}`);
  }

  // Idempotency check
  const txSnap = await db
    .collection("transactions")
    .where("idempotency_key", "==", idempotencyKey)
    .limit(1)
    .get();
  if (!txSnap.empty) throw new Error(`DUPLICATE_TRANSACTION:${idempotencyKey}`);

  tx.update(walletRef, {
    available_balance: FieldValue.increment(-amountPaisa),
    lifetime_spent:    FieldValue.increment(amountPaisa),
    updated_at:        FieldValue.serverTimestamp(),
  });
}

// ─── Helper: atomic wallet credit ────────────────────────────────────────────
async function creditWallet(
  tx: admin.firestore.Transaction,
  walletRef: admin.firestore.DocumentReference,
  amountPaisa: number,
  idempotencyKey: string
): Promise<void> {
  const snap = await tx.get(walletRef);
  if (!snap.exists) throw new Error("Wallet not found");

  // Idempotency check
  const txSnap = await db
    .collection("transactions")
    .where("idempotency_key", "==", idempotencyKey)
    .limit(1)
    .get();
  if (!txSnap.empty) throw new Error(`DUPLICATE_TRANSACTION:${idempotencyKey}`);

  tx.update(walletRef, {
    available_balance: FieldValue.increment(amountPaisa),
    lifetime_earned:   FieldValue.increment(amountPaisa),
    updated_at:        FieldValue.serverTimestamp(),
  });
}

// ─── onCreate: Auto-create wallet when profile is created ─────────────────────
export const onProfileCreated = functions.firestore.onDocumentCreated(
  "profiles/{uid}",
  async (event) => {
    const uid = event.params.uid;

    await db.collection("wallets").doc(`wallet_${uid}`).set({
      user_id:           uid,
      available_balance: 0,
      frozen_balance:    0,
      lifetime_earned:   0,
      lifetime_spent:    0,
      created_at:        FieldValue.serverTimestamp(),
      updated_at:        FieldValue.serverTimestamp(),
    });
  }
);

// ─── createCampaign ───────────────────────────────────────────────────────────
export const createCampaign = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");

  const { campaignData } = request.data as {
    campaignData: {
      title: string;
      pay_per_day_rupees: number;
      max_workers: number;
      duration_days: number;
      [key: string]: unknown;
    };
  };

  const ownerUid = request.auth.uid;

  // Validate inputs
  if (
    !campaignData.title?.trim() ||
    campaignData.pay_per_day_rupees <= 0 ||
    campaignData.max_workers <= 0 ||
    campaignData.max_workers > 500 ||
    campaignData.duration_days <= 0 ||
    campaignData.duration_days > 365
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid campaign data: check pay, workers (1–500), and duration (1–365 days)"
    );
  }

  // Calculate escrow: 50% of total cost
  const totalCostPaisa = (campaignData.pay_per_day_rupees * PAISA_PER_RUPEE)
                       * campaignData.max_workers
                       * campaignData.duration_days;
  const escrowPaisa    = Math.ceil(totalCostPaisa * 0.5);
  const idempotencyKey = `campaign_escrow_${ownerUid}_${Date.now()}`;

  // Use predictable wallet document ID (wallet_{uid}) — avoids query overhead
  const walletDocRef = db.collection("wallets").doc(`wallet_${ownerUid}`);
  const walletSnap   = await walletDocRef.get();
  if (!walletSnap.exists) throw new functions.https.HttpsError("not-found", "Wallet not found");

  await db.runTransaction(async (tx) => {
    await debitWallet(tx, walletDocRef, escrowPaisa, idempotencyKey);

    const campaignRef = db.collection("campaigns").doc();
    tx.set(campaignRef, {
      ...campaignData,
      owner_id:            ownerUid,
      status:              "OPEN",
      escrow_status:       "FROZEN",
      escrow_amount_paisa: escrowPaisa,
      total_slots_filled:  0,
      created_at:          FieldValue.serverTimestamp(),
      updated_at:          FieldValue.serverTimestamp(),
    });

    // Freeze escrow in wallet
    tx.update(walletDocRef, {
      frozen_balance: FieldValue.increment(escrowPaisa),
    });

    // Log transaction (using idempotency key as document ID for dedup)
    const txRef = db.collection("transactions").doc(idempotencyKey);
    tx.set(txRef, {
      wallet_id:        `wallet_${ownerUid}`,
      amount_paisa:     -escrowPaisa,
      type:             "ESCROW_FREEZE",
      status:           "COMPLETED",
      idempotency_key:  idempotencyKey,
      reference_type:   "campaign",
      description:      `Escrow for campaign: ${campaignData.title}`,
      metadata:         {},
      created_at:       FieldValue.serverTimestamp(),
      updated_at:       FieldValue.serverTimestamp(),
    }, { merge: false }); // fail if key already exists
  });

  return { success: true };
});

// ─── approveWork ──────────────────────────────────────────────────────────────
export const approveWork = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");

  const { workLogId } = request.data as { workLogId: string };
  const ownerUid = request.auth.uid;

  const workLogRef  = db.collection("work_logs").doc(workLogId);
  const workLogSnap = await workLogRef.get();
  if (!workLogSnap.exists) throw new functions.https.HttpsError("not-found", "Work log not found");

  const workLog     = workLogSnap.data()!;
  const campaignRef = db.collection("campaigns").doc(workLog.campaign_id);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) throw new functions.https.HttpsError("not-found", "Campaign not found");

  const campaign = campaignSnap.data()!;
  if (campaign.owner_id !== ownerUid) {
    throw new functions.https.HttpsError("permission-denied", "Not your campaign");
  }

  const payPaisa        = campaign.pay_per_day_rupees * PAISA_PER_RUPEE;
  const idempotencyKey  = `approve_work_${workLogId}`;

  // Get employee wallet
  const empWalletSnap = await db
    .collection("wallets")
    .where("user_id", "==", workLog.employee_id)
    .limit(1)
    .get();
  if (empWalletSnap.empty) throw new functions.https.HttpsError("not-found", "Employee wallet not found");

  const empWalletRef = empWalletSnap.docs[0].ref;

  await db.runTransaction(async (tx) => {
    await creditWallet(tx, empWalletRef, payPaisa, idempotencyKey);

    tx.update(workLogRef, {
      status:      "APPROVED",
      approved_at: FieldValue.serverTimestamp(),
      updated_at:  FieldValue.serverTimestamp(),
    });

    const txRef = db.collection("transactions").doc();
    tx.set(txRef, {
      wallet_id:        empWalletSnap.docs[0].id,
      amount_paisa:     payPaisa,
      type:             "PAYMENT",
      status:           "COMPLETED",
      idempotency_key:  idempotencyKey,
      reference_id:     workLogId,
      reference_type:   "work_log",
      description:      `Daily payment for ${workLog.work_date}`,
      metadata:         {},
      created_at:       FieldValue.serverTimestamp(),
      updated_at:       FieldValue.serverTimestamp(),
    });
  });

  return { success: true };
});

// ─── processWithdrawal ───────────────────────────────────────────────────────
export const processWithdrawal = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in required");

  const { amountPaisa, bankDetails } = request.data as {
    amountPaisa: number;
    bankDetails: Record<string, unknown>;
  };

  const uid = request.auth.uid;

  if (amountPaisa < MIN_WITHDRAWAL) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Minimum withdrawal is ${MIN_WITHDRAWAL / PAISA_PER_KCOIN} KCoins`
    );
  }

  // KYC check
  const profileSnap = await db.collection("profiles").doc(uid).get();
  if (!profileSnap.exists) throw new functions.https.HttpsError("not-found", "Profile not found");
  if (profileSnap.data()!.kyc_status !== "APPROVED") {
    throw new functions.https.HttpsError("failed-precondition", "KYC not approved");
  }

  const walletSnap = await db.collection("wallets").where("user_id", "==", uid).limit(1).get();
  if (walletSnap.empty) throw new functions.https.HttpsError("not-found", "Wallet not found");

  const walletRef  = walletSnap.docs[0].ref;
  const walletData = walletSnap.docs[0].data();

  if (walletData.available_balance < amountPaisa) {
    throw new functions.https.HttpsError("failed-precondition", "Insufficient balance");
  }

  const idempotencyKey = `withdrawal_${uid}_${Date.now()}`;

  await db.runTransaction(async (tx) => {
    await debitWallet(tx, walletRef, amountPaisa, idempotencyKey);

    // Freeze during processing
    tx.update(walletRef, {
      frozen_balance: FieldValue.increment(amountPaisa),
    });

    const withdrawalRef = db.collection("withdrawals").doc();
    tx.set(withdrawalRef, {
      user_id:         uid,
      amount_paisa:    amountPaisa,
      status:          "PENDING",
      bank_details:    bankDetails,
      idempotency_key: idempotencyKey,
      created_at:      FieldValue.serverTimestamp(),
      updated_at:      FieldValue.serverTimestamp(),
    });

    const txRef = db.collection("transactions").doc();
    tx.set(txRef, {
      wallet_id:        walletSnap.docs[0].id,
      amount_paisa:     -amountPaisa,
      type:             "WITHDRAWAL",
      status:           "PENDING",
      idempotency_key:  idempotencyKey,
      reference_type:   "withdrawal",
      description:      "Bank withdrawal",
      metadata:         {},
      created_at:       FieldValue.serverTimestamp(),
      updated_at:       FieldValue.serverTimestamp(),
    });
  });

  // TODO: Initiate Razorpay/Cashfree payout API call here
  return { success: true, message: "Withdrawal initiated" };
});
