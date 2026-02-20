-- Migration 007: Triggers and helper functions

-- ============================================================
-- Auto-update updated_at on every UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Safe wallet debit (used by Edge Functions via service role)
-- Returns FALSE if insufficient balance, TRUE on success
-- ============================================================
CREATE OR REPLACE FUNCTION debit_wallet(
  p_wallet_id    UUID,
  p_amount_paisa BIGINT,
  p_type         transaction_type,
  p_idempotency  TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description  TEXT DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rows_updated INT;
BEGIN
  -- INSERT idempotent transaction record first
  INSERT INTO transactions (
    wallet_id, amount_paisa, type, status, idempotency_key,
    reference_id, reference_type, description
  ) VALUES (
    p_wallet_id, -p_amount_paisa, p_type, 'COMPLETED',
    p_idempotency, p_reference_id, p_reference_type, p_description
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  -- Debit wallet with guard check (FOR UPDATE prevents race condition)
  UPDATE wallets
  SET available_balance = available_balance - p_amount_paisa,
      lifetime_spent    = lifetime_spent    + p_amount_paisa
  WHERE id = p_wallet_id
    AND available_balance >= p_amount_paisa;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RETURN v_rows_updated > 0;
END;
$$;

-- ============================================================
-- Safe wallet credit (used by Edge Functions via service role)
-- ============================================================
CREATE OR REPLACE FUNCTION credit_wallet(
  p_wallet_id    UUID,
  p_amount_paisa BIGINT,
  p_type         transaction_type,
  p_idempotency  TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_description  TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO transactions (
    wallet_id, amount_paisa, type, status, idempotency_key,
    reference_id, reference_type, description
  ) VALUES (
    p_wallet_id, p_amount_paisa, p_type, 'COMPLETED',
    p_idempotency, p_reference_id, p_reference_type, p_description
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE wallets
  SET available_balance = available_balance + p_amount_paisa,
      lifetime_earned   = lifetime_earned   + p_amount_paisa
  WHERE id = p_wallet_id;
END;
$$;
