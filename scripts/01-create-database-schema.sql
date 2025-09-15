-- Gaming Platform Database Schema
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with age verification and KYC
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  iban TEXT,
  identity_document TEXT,
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  kyc_level INTEGER DEFAULT 0, -- 0: none, 1: basic, 2: advanced
  device_fingerprint TEXT,
  wallet_number TEXT UNIQUE NOT NULL DEFAULT upper(encode(gen_random_bytes(8), 'hex')),
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT age_check CHECK (EXTRACT(YEAR FROM AGE(birth_date)) >= 18)
);

-- Wallets for multi-currency support
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  currency CHAR(3) NOT NULL DEFAULT 'AOA',
  balance NUMERIC(18,2) DEFAULT 0,
  locked_balance NUMERIC(18,2) DEFAULT 0,
  non_transferable_balance NUMERIC(18,2) DEFAULT 0, -- bonus funds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Transactions for all financial operations
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id),
  tx_type TEXT NOT NULL, -- deposit, withdrawal, entry_fee, prize, referral_bonus, bonus_day, transfer_in, transfer_out
  amount NUMERIC(18,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'AOA',
  meta JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, rejected, review_required
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- P2P Transfers
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  amount NUMERIC(18,2) NOT NULL,
  fee NUMERIC(18,2) DEFAULT 2.00,
  currency CHAR(3) NOT NULL DEFAULT 'AOA',
  message TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, cancelled, flagged
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz questions database
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of options
  correct_answer INTEGER NOT NULL, -- index of correct option
  difficulty INTEGER DEFAULT 1, -- 1-5 difficulty levels
  category TEXT,
  language CHAR(2) DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Games/Quiz sessions
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id),
  entry_fee NUMERIC(18,2) DEFAULT 50,
  currency CHAR(3) DEFAULT 'AOA',
  max_players INTEGER DEFAULT 10,
  prize_pool NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, running, finished, cancelled
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Game participants
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id),
  user_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  position INTEGER,
  prize_amount NUMERIC(18,2) DEFAULT 0,
  entry_transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Vouchers for free games and bonuses
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  code TEXT UNIQUE,
  type TEXT NOT NULL, -- free_game, entry_coupon, bonus
  value NUMERIC(18,2) DEFAULT 0,
  uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Referral system
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID REFERENCES users(id),
  invitee_id UUID REFERENCES users(id),
  invite_uuid TEXT UNIQUE NOT NULL,
  bonus_amount NUMERIC(18,2) DEFAULT 5,
  currency CHAR(3) DEFAULT 'AOA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  activated BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP WITH TIME ZONE
);

-- Daily bonuses tracking
CREATE TABLE daily_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  day_number INTEGER NOT NULL, -- 1-4 for welcome sequence
  bonus_type TEXT NOT NULL, -- aoa_bonus, free_games, usd_bonus
  amount NUMERIC(18,2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'AOA',
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, day_number)
);

-- Anti-fraud tracking
CREATE TABLE device_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_fingerprint TEXT UNIQUE,
  user_count INTEGER DEFAULT 1,
  flagged BOOLEAN DEFAULT FALSE,
  last_flagged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- IP tracking for fraud prevention
CREATE TABLE ip_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  ip_address INET NOT NULL,
  action TEXT NOT NULL, -- login, register, game_join, withdrawal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit logs for admin actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  admin_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_device_fp ON users(device_fingerprint);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_type_status ON transactions(tx_type, status);
CREATE INDEX idx_transfers_from ON transfers(from_user);
CREATE INDEX idx_transfers_to ON transfers(to_user);
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
CREATE INDEX idx_referrals_inviter ON referrals(inviter_id);
CREATE INDEX idx_referrals_uuid ON referrals(invite_uuid);
CREATE INDEX idx_ip_logs_user ON ip_logs(user_id);
CREATE INDEX idx_ip_logs_ip ON ip_logs(ip_address);
