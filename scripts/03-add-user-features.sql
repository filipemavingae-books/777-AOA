-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban VARCHAR(34);

-- Create document verifications table
CREATE TABLE IF NOT EXISTS document_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_document_verifications_user_id ON document_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_status ON document_verifications(status);
