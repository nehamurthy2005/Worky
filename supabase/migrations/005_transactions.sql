-- Migration 005: Transactions table
-- Idempotency key prevents duplicate credits on webhook retry

CREATE TABLE transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID NOT NULL REFERENCES wallets(id),
  amount_paisa     BIGINT NOT NULL,
  type             transaction_type NOT NULL,
  status           transaction_status NOT NULL DEFAULT 'PENDING',
  -- Unique idempotency key: use payment gateway ID or generate deterministically
  idempotency_key  TEXT NOT NULL,
  reference_id     UUID,        -- campaign_id, withdrawal_id, etc.
  reference_type   TEXT,        -- 'campaign', 'withdrawal', 'boost_purchase'
  description      TEXT,
  metadata         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on idempotency_key prevents duplicate transactions
CREATE UNIQUE INDEX idx_transactions_idempotency  ON transactions (idempotency_key);
CREATE INDEX        idx_transactions_wallet_id    ON transactions (wallet_id);
CREATE INDEX        idx_transactions_reference    ON transactions (reference_id, reference_type);
CREATE INDEX        idx_transactions_created_at   ON transactions (created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
