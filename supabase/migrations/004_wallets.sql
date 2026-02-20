-- Migration 004: Wallets table
-- ALL monetary values stored as integer PAISA (not float, not decimal)
-- 1 KCoin = 1000 paisa | ₹1 = 100 paisa | 1 KCoin = ₹10 = 1000 paisa

CREATE TABLE wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  -- Integer paisa balances — no floating point drift
  available_balance BIGINT NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  frozen_balance    BIGINT NOT NULL DEFAULT 0 CHECK (frozen_balance >= 0),
  lifetime_earned   BIGINT NOT NULL DEFAULT 0,
  lifetime_spent    BIGINT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets (user_id);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Auto-create wallet when a profile is created
CREATE OR REPLACE FUNCTION create_wallet_for_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_wallet_on_profile
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION create_wallet_for_profile();
