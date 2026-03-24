-- Migration: Add support for Member Invites and JSON permissions
-- Date: 2026-01-28
-- REVISED: Make joined_at nullable, ID backfill, PK update.

-- 1. Drop existing Primary Key
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_pkey;

-- 2. Add new surrogate ID column (checking if exists first to be safe)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_members' AND column_name='id') THEN
        ALTER TABLE project_members ADD COLUMN id UUID;
        -- Backfill existing rows
        UPDATE project_members SET id = gen_random_uuid() WHERE id IS NULL;
        -- Now enforce NOT NULL
        ALTER TABLE project_members ALTER COLUMN id SET NOT NULL;
    END IF;
END $$;

-- 3. Make id the new Primary Key (if not already)
-- Note: 'ADD PRIMARY KEY' will fail if one exists. We dropped the OLD one, but if we ran this script before, the NEW one might exist.
-- To be safe, we can try to drop the new one too or just wrap in a block?
-- Simplest is to ignore error or check constraint.
-- Let's try to be idempotent.
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_pkey;
ALTER TABLE project_members ADD PRIMARY KEY (id);

-- 4. Make user_id nullable
ALTER TABLE project_members ALTER COLUMN user_id DROP NOT NULL;

-- 5. Make joined_at nullable (CRITICAL FIX for Invites)
ALTER TABLE project_members ALTER COLUMN joined_at DROP NOT NULL;

-- 6. Add new columns
ALTER TABLE project_members 
    ADD COLUMN IF NOT EXISTS invite_email TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS environments JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- 7. Add Unique Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_user_unique ON project_members(project_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_members_email_unique ON project_members(project_id, invite_email) WHERE invite_email IS NOT NULL;
