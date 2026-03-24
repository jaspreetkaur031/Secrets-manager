-- Secrets Manager Schema Design
-- PostgreSQL 14+ compatible

-- Enable UUID extension for IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Users & RBAC
-- -----------------------------------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_full_name TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ 
);

-- Removed ENUM type for roles, using TEXT

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ 
);

CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID REFERENCES users(id), -- Nullable for invites
    invite_email TEXT, -- For pending invites
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'INVITED'
    environments JSONB DEFAULT '[]'::jsonb, -- Denormalized permissions: ["env_id_1", "env_id_2"]
    has_permission BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ, -- Nullable if just invited? Or use as created_at
    invited_at TIMESTAMPTZ,
    PRIMARY KEY (project_id, user_id) -- Wait, if user_id is null, this PK fails.
);
-- We need to adjust PK. If user_id is null, we can't use it in PK.
-- Valid PK alternatives:
-- A: Surrogate ID (id UUID PRIMARY KEY) - Current schema has no ID column on project_members?
-- Let's check api.js: it expects 'id' on project_members.
-- schema.sql didn't have 'id' in project_members!
-- But api.js uses `id: uuidv4()` in insert.
-- So we must add `id` column and make it PK.
--
-- Revised Schema for project_members:
CREATE TABLE project_members (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    invite_email TEXT,
    status TEXT DEFAULT 'ACTIVE',
    environments JSONB DEFAULT '[]'::jsonb,
    has_permission BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ
);
-- Unique constraint: A user (if exists) should be in project only once.
-- An email (if invited) should be in project only once.
CREATE UNIQUE INDEX idx_project_members_user ON project_members(project_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_project_members_email ON project_members(project_id, invite_email) WHERE invite_email IS NOT NULL;

-- Index for fast lookup of a user's projects
CREATE INDEX idx_project_members_user_id ON project_members(user_id);


-- -----------------------------------------------------------------------------
-- 2. Environments
-- -----------------------------------------------------------------------------

CREATE TABLE environments (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    display_name TEXT NOT NULL, -- e.g., 'dev', 'staging', 'prod'
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Ensure names/slugs are unique within a project
    UNIQUE (project_id, slug)
);


-- -----------------------------------------------------------------------------
-- 2.1 Environment Access Control (Granular Permissions)
-- -----------------------------------------------------------------------------

-- Removed ENUM type for access_level, using TEXT

CREATE TABLE environment_permissions (
    id UUID PRIMARY KEY,
    environment_id UUID NOT NULL REFERENCES environments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    access_level TEXT NOT NULL, -- 'READ', 'WRITE'
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    -- A user can have only one permission entry per environment
    UNIQUE (environment_id, user_id)
);

CREATE INDEX idx_env_perm_user ON environment_permissions(user_id);
CREATE INDEX idx_env_perm_env ON environment_permissions(environment_id);


-- -----------------------------------------------------------------------------
-- 3. Secrets & Syncing Logic
-- -----------------------------------------------------------------------------

-- Registry to track the "Global" state of keys within a project.
-- This helps in detecting "Out of Sync" environments.
-- If a secret key exists here, it "should" exist in all environments.
-- The 'last_updated_at' here generally reflects the latest change to this key anywhere.
CREATE TABLE project_secret_registry (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    key_name TEXT NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL,
    description TEXT,
    
    UNIQUE (project_id, key_name)
);

CREATE TABLE secrets (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    environment_id UUID NOT NULL REFERENCES environments(id),
    
    -- Key reference is loosely coupled by name to the registry, 
    -- but we enforce existence via application logic or strictly here.
    -- To allow flexibility, we'll store the key string here, but it must match a registry entry.
    key_name TEXT NOT NULL, 
    
    -- Value is stored as plain text
    value TEXT NOT NULL,
        
    -- Versioning for rollback support (optional but recommended)
    version INT NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Ensure unique active key per environment
    -- Soft deleted secrets are excluded from this uniqueness check constraint usually,
    -- efficiently handled by partial index:
    UNIQUE (environment_id, key_name)
);

-- Note: Standard UNIQUE constraint includes deleted keys? 
-- Better to use partial unique index for active keys only
ALTER TABLE secrets DROP CONSTRAINT IF EXISTS secrets_environment_id_key_name_key;
CREATE UNIQUE INDEX idx_secrets_unique_active_key 
    ON secrets(environment_id, key_name) 
    WHERE deleted_at IS NULL;

-- Index for looking up secrets by project (admin view)
CREATE INDEX idx_secrets_project ON secrets(project_id);


-- -----------------------------------------------------------------------------
-- 4. Audit Logging
-- -----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id), -- Nullable for system-wide events
    environment_id UUID REFERENCES environments(id), -- Nullable for project-level events (e.g. creating env)
    user_id UUID REFERENCES users(id),     -- Nullable for system actions
    
    action TEXT NOT NULL, -- e.g., 'SECRET_CREATE', 'SECRET_UPDATE', 'SECRET_DELETE', 'ENV_CREATE'
    entity_type TEXT NOT NULL, -- 'SECRET', 'PROJECT', 'USER', 'ENVIRONMENT'
    entity_id UUID NOT NULL,   -- ID of the affected row
    
    -- Changes
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL
);

-- Index for timeline queries
CREATE INDEX idx_audit_logs_project_time ON audit_logs(project_id, timestamp DESC);
CREATE INDEX idx_audit_logs_env_time ON audit_logs(environment_id, timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Prevent updates/deletes on audit logs (Simple rule, enforcement often done via Trigger)
-- CREATE RULE audit_logs_immutable AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
-- CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;


-- -----------------------------------------------------------------------------
-- 5. Helper Views / Functions (Optional Idea)
-- -----------------------------------------------------------------------------

-- View removed as per request



-- Refresh Tokens table removed as per request (Stateless Auth)

