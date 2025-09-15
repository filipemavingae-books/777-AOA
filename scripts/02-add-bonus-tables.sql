-- Create daily bonuses table
CREATE TABLE IF NOT EXISTS daily_bonuses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
    amount DECIMAL(15,2) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_date ON daily_bonuses(user_id, DATE(claimed_at));
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_claimed_at ON daily_bonuses(claimed_at);

-- Add some sample sound files paths (these would need to be actual audio files)
-- You would need to add actual audio files to the public/sounds/ directory
