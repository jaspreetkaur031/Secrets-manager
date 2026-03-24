-- Migration to add environment_id to audit_logs

-- Add environment_id column
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES environments(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_env_time ON audit_logs(environment_id, timestamp DESC);
