-- Migration 006: Row Level Security (RLS) Policies
-- Phase 1 tables: profiles, wallets, transactions

-- ============================================================
-- PROFILES RLS
-- ============================================================

-- Anyone (authenticated) can read any profile (for feed/campaign pages)
CREATE POLICY "profiles_select_any"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile row
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile row
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- WALLETS RLS
-- ============================================================

-- Users can only read their own wallet
CREATE POLICY "wallets_select_own"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE by users
-- All wallet mutations go through Edge Functions using service role key

-- ============================================================
-- TRANSACTIONS RLS
-- ============================================================

-- Users can only read their own transactions
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE user_id = auth.uid()
    )
  );

-- No direct INSERT/UPDATE/DELETE by users
-- All transaction writes go through Edge Functions using service role key
