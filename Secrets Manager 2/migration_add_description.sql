-- Migration to add description to audit_logs

ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS description TEXT;
