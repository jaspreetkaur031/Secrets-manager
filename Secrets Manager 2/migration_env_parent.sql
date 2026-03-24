-- Add parent_id to environments table for nesting support

ALTER TABLE environments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES environments(id);

CREATE INDEX IF NOT EXISTS idx_environments_parent_id ON environments(parent_id);
