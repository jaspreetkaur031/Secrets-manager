import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { encryptSecret, decryptSecret, generateValueHash } from './crypto';

const STORAGE_KEY = 'secrets_manager_db';
// Seed data
const ADMIN_EMAIL = 'jaspreetkaursaini031@gmail.com';

const MASTER_PASSPHRASE = "sm2-demo-master-passphrase";

const initialData = {
  users: [
    { id: 'u1', email: 'admin@growthjockey.com', name: 'Admin User', isAdmin: true },
    { id: 'u2', email: 'dev@growthjockey.com', name: 'Developer User', isAdmin: false }
  ],
  projects: [
    { id: 'p1', name: 'Growth Platform', slug: 'growth-platform', description: 'Main monolithic application' },
  ],
  environments: [
    { id: 'e1', projectId: 'p1', name: 'Development', slug: 'dev', isProduction: false },
    { id: 'e2', projectId: 'p1', name: 'Staging', slug: 'staging', isProduction: false },
    { id: 'e3', projectId: 'p1', name: 'Production', slug: 'prod', isProduction: true },
  ],
  secrets: [
    { id: 's1', projectId: 'p1', environmentId: 'e1', key: 'DATABASE_URL', value: 'postgres://localhost:5432/db', version: 1, updatedAt: new Date().toISOString() },
    { id: 's2', projectId: 'p1', environmentId: 'e2', key: 'DATABASE_URL', value: 'postgres://staging-db.internal:5432/db', version: 1, updatedAt: new Date().toISOString() },
    // Missing in Prod to show sync status
  ],
  projectSecretRegistry: [
    { id: 'r1', projectId: 'p1', key: 'DATABASE_URL', description: 'Connection string for the primary database', lastUpdatedAt: new Date().toISOString() }
  ],
  projectMembers: [
    // Admin has access to all by default (logic handled in getters), but we can list implicit or explicit members
    { id: 'm1', projectId: 'p1', userId: 'u2', environments: ['e1'], status: 'ACTIVE', invitedBy: 'u1', invitedAt: new Date().toISOString() }
  ],
  auditLogs: []
};

// Helper: Load/Save
function getDb() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (!s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  const db = JSON.parse(s);
  if (!db.users) db.users = initialData.users; // Ensure users exist
  if (!db.projectSecretRegistry) db.projectSecretRegistry = []; // Ensure registry exists
  if (!db.projectMembers) db.projectMembers = []; // Ensure members key exists
  return db;
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const api = {
  // ---------------------------------------------------------------------------
  // Auth Methods (Supabase Integration)
  // ---------------------------------------------------------------------------
  signup: async (email, name) => {
    if (!supabase) return api._mockSignup(email, name);

    // 1. Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) throw new Error('User already exists');

    // 2. Insert User (admin check)
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const userId = uuidv4();
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        display_full_name: name,
        is_admin: isAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw new Error(error.message);

    // 2.5 Link existing invites
    const { error: linkError } = await supabase
      .from('project_members')
      .update({ user_id: userId, status: 'ACTIVE' })
      .eq('invite_email', email)
      .is('user_id', null);

    if (linkError) console.error('[API] Error linking invites:', linkError);

    // 3. Auto Login
    return api.login(email);
  },

  login: async (email) => {
    // If Supabase not configured, fallback to mock
    if (!supabase) return api._mockLogin(email);

    // 1. Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // 2. If user not found, auto-signup
    if (!user) {
      const name = email.split('@')[0];
      return api.signup(email, name);
    }

    // 3. Create Session Token (Stateless Mock)
    // In a real app, this would be a JWT signed by the server.
    // Here, we'll just base64 encode the user ID and email to simulate a token we can parse later.
    const sessionToken = btoa(JSON.stringify({ userId: user.id, email: user.email, isAdmin: user.isAdmin || user.is_admin, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

    return { user: { ...user, isAdmin: user.isAdmin || user.is_admin }, sessionToken };
  },

  checkSession: async (sessionToken) => {
    if (!supabase) return api._mockCheckSession(sessionToken);

    // Stateless check: Decode token
    try {
      const payload = JSON.parse(atob(sessionToken));
      if (payload.exp < Date.now()) throw new Error('Session expired');

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error || !user) throw new Error('Invalid session');

      // Normalize isAdmin field
      return { user: { ...user, isAdmin: user.isAdmin || user.is_admin }, sessionToken };
    } catch (e) {
      throw new Error('Invalid session');
    }
  },

  logout: async () => {
    // Stateless: Nothing to do on server
    return;
  },

  // ---------------------------------------------------------------------------
  // Fallback Mock Methods (Internal)
  // ---------------------------------------------------------------------------
  _mockSignup: async (email, name) => {
    const db = getDb();
    if (db.users.find(u => u.email === email)) throw new Error('User already exists (Mock)');

    const newUser = {
      id: uuidv4(),
      email,
      name: name,
      isAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    };
    db.users.push(newUser);

    // Link existing invites
    if (db.projectMembers) {
      db.projectMembers.forEach(m => {
        if (m.inviteEmail === email && !m.userId) {
          m.userId = newUser.id;
          m.status = 'ACTIVE';
        }
      });
    }

    saveDb(db);
    return api._mockLogin(email);
  },

  _mockLogin: async (email) => {
    const db = getDb();
    const user = db.users.find(u => u.email === email);

    if (!user) {
      const name = email.split('@')[0];
      return api._mockSignup(email, name);
    }
    const sessionToken = btoa(JSON.stringify({ userId: user.id, email: user.email, isAdmin: user.isAdmin, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
    return { user, sessionToken };
  },

  _mockCheckSession: async (sessionToken) => {
    try {
      const payload = JSON.parse(atob(sessionToken));
      if (payload.exp < Date.now()) throw new Error('Session expired');

      const db = getDb();
      const user = db.users.find(u => u.id === payload.userId);
      if (!user) throw new Error('User not found');

      return { user, sessionToken };
    } catch (e) {
      throw new Error('Invalid session (Mock)');
    }
  },

  _mockLogout: async () => {
    // Nothing to do
  },

  // ---------------------------------------------------------------------------
  // Project / Secrets Methods (Supabase Integration)
  // ---------------------------------------------------------------------------
  getProjects: async (userId, isAdmin) => {
    if (!supabase) {
      const db = getDb();
      if (isAdmin) return db.projects;
      // For non-admins, filter by project_members
      const memberProjectIds = (db.projectMembers || []).filter(m => m.userId === userId && m.hasPermission).map(m => m.projectId);
      return db.projects.filter(p => memberProjectIds.includes(p.id));
    }

    if (isAdmin) {
      const { data, error } = await supabase.from('projects').select('*').is('deleted_at', null);
      if (error) throw new Error(error.message);
      return data.map(p => ({ id: p.id, name: p.display_name, slug: p.slug, description: p.description }));
    }

    // Non-admin: join with project_members
    const { data, error } = await supabase
      .from('project_members')
      .select('project_id, projects(id, display_name, slug, description)')
      .eq('user_id', userId)
      .eq('has_permission', true);
    if (error) throw new Error(error.message);
    return data.map(m => ({ id: m.projects.id, name: m.projects.display_name, slug: m.projects.slug, description: m.projects.description }));
  },

  createProject: async (name, description) => {
    const id = uuidv4();
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      const newProject = { id, name, slug, description };
      db.projects.push(newProject);
      const envs = ['Development', 'Staging', 'Production'];
      envs.forEach(envName => {
        db.environments.push({
          id: uuidv4(),
          projectId: id,
          name: envName,
          slug: envName.toLowerCase(),
          isProduction: envName === 'Production'
        });
      });
      saveDb(db);
      return newProject;
    }

    const { data, error } = await supabase.from('projects').insert({
      id, display_name: name, slug, description, created_at: now, updated_at: now
    }).select().single();
    if (error) throw new Error(error.message);

    // Create default environments
    const envs = ['Development', 'Staging', 'Production'];
    for (const envName of envs) {
      await supabase.from('environments').insert({
        id: uuidv4(),
        project_id: id,
        display_name: envName,
        slug: envName.toLowerCase(),
        created_at: now
      });
    }
    return { id: data.id, name: data.display_name, slug: data.slug, description: data.description };
  },

  getProject: async (slug, userId, isAdmin) => {
    if (!supabase) {
      const db = getDb();
      const project = db.projects.find(p => p.slug === slug);
      if (!project) return null;
      let envs = db.environments.filter(e => e.projectId === project.id);

      if (!isAdmin && userId) {
        const member = db.projectMembers.find(m => m.projectId === project.id && m.userId === userId);
        const allowedEnvIds = member ? member.environments : [];
        envs = envs.filter(e => allowedEnvIds.includes(e.id));
      }
      return { ...project, environments: envs };
    }

    // 1. Fetch Project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;

    // 2. Fetch Environments
    const { data: envs, error: envError } = await supabase
      .from('environments')
      .select('*')
      .eq('project_id', project.id);
    if (envError) throw new Error(envError.message);

    let filteredEnvs = envs;

    // 3. Filter if not admin
    if (!isAdmin && userId) {
      // Fetch member permissions
      const { data: member, error: memberError } = await supabase
        .from('project_members')
        .select('environments')
        .eq('project_id', project.id)
        .eq('user_id', userId)
        .maybeSingle();

      // If member not found or error, strict default to NO access (empty list)
      // Or should we throw? For now, empty list is safer (UI will show "No Access")
      const allowedEnvIds = member ? member.environments : [];
      filteredEnvs = envs.filter(e => allowedEnvIds.includes(e.id));
    }

    return {
      id: project.id,
      name: project.display_name,
      slug: project.slug,
      description: project.description,
      environments: filteredEnvs.map(e => ({ id: e.id, projectId: e.project_id, name: e.display_name, slug: e.slug }))
    };
  },

  createEnvironment: async (projectId, name, slug, parentId = null) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      const newEnv = { id, projectId, name, slug, isProduction: false, parentId };
      db.environments.push(newEnv);
      saveDb(db);
      return newEnv;
    }

    const { data, error } = await supabase.from('environments').insert({
      id, project_id: projectId, display_name: name, slug, created_at: now, parent_id: parentId
    }).select().single();
    if (error) throw new Error(error.message);
    return { id: data.id, projectId: data.project_id, name: data.display_name, slug: data.slug, parentId: data.parent_id };
  },

  getSecrets: async (projectId, envId) => {
    let rawData;
    // ... your existing fetching logic for rawData (Supabase or Mock) ...

    // NEW LOGIC: Decrypt every secret before sending to UI
    return await Promise.all(rawData.map(async (s) => {
      try {
        // If the value is encrypted (format includes colons), decrypt it
        if (s.value && s.value.includes(':')) {
          const decrypted = await decryptSecret(s.value, MASTER_PASSPHRASE);
          return { ...s, value: decrypted };
        }
        return s; // Fallback for old plain-text data
      } catch (e) {
        console.error("Decryption failed", e);
        return { ...s, value: "🔑 [DECRYPTION_ERROR]" };
      }
    }));
  },

  getSecretRegistry: async (projectId) => {
    if (!supabase) {
      const db = getDb();
      const registryList = db.projectSecretRegistry.filter(r => r.projectId === projectId);
      const registryObj = {};
      registryList.forEach(r => {
        registryObj[r.key] = { lastUpdatedAt: r.lastUpdatedAt, description: r.description };
      });
      return registryObj;
    }

    const { data, error } = await supabase
      .from('project_secret_registry')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw new Error(error.message);
    const registryObj = {};
    data.forEach(r => {
      registryObj[r.key_name] = { lastUpdatedAt: r.last_updated_at, description: r.description };
    });
    return registryObj;
  },



  getEnvironmentSyncStatus: async (projectId) => {
    // 1. Get Registry (Global Truth)
    const registry = await api.getSecretRegistry(projectId);

    // 2. Get All Secrets for Project
    const db = getDb();
    const allSecrets = db.secrets.filter(s => s.projectId === projectId);

    // 3. Get Project Environments
    const project = db.projects.find(p => p.id === projectId);
    const envs = db.environments.filter(e => e.projectId === projectId);

    // 4. Compute Status per Env per Key
    const results = [];

    envs.forEach(env => {
      Object.entries(registry).forEach(([key, regData]) => {
        const secret = allSecrets.find(s => s.environmentId === env.id && s.key === key);
        let status = 'SYNCED';
        let value = secret ? secret.value : null;

        if (!secret) {
          status = 'MISSING';
        } else if (new Date(secret.updatedAt) < new Date(regData.lastUpdatedAt)) {
          status = 'OUTDATED';
        }

        results.push({
          environment_id: env.id,
          environment_name: env.name,
          project_id: projectId,
          key_name: key,
          global_last_updated: regData.lastUpdatedAt,
          description: regData.description,
          local_last_updated: secret ? secret.updatedAt : null,
          value,
          sync_status: status
        });
      });
    });

    return results;
  },

  // -----------------------------old code---------------------------------------
  // saveSecret: async (projectId, envId, key, value, user = null) => {
  //   const now = new Date().toISOString();
  //   const userEmail = user?.email || 'Unknown';

  //   const MASTER_PASSPHRASE = "sm2-demo-master-passphrase";
  //   // NEW LOGIC: Encrypt before saving
  //   const encryptedValue = await encryptSecret(value, MASTER_PASSPHRASE);
  //   const valueHash = await generateValueHash(value); // For comparing values without decrypting

  //   if (!supabase) {
  //     const db = getDb();
  //     let secret = db.secrets.find(s => s.projectId === projectId && s.environmentId === envId && s.key === key);
  //     let registryEntry = db.projectSecretRegistry.find(r => r.projectId === projectId && r.key === key);

  //     // Update Registry
  //     if (registryEntry) {
  //       registryEntry.lastUpdatedAt = now;
  //     } else {
  //       registryEntry = { id: uuidv4(), projectId, key, description: '', lastUpdatedAt: now };
  //       db.projectSecretRegistry.push(registryEntry);
  //     }

  //     //Update/Insert Secret with ENCRYPTED value
  //     if (secret) {
  //       secret.value = value;
  //       secret.updatedAt = now;
  //       secret.version += 1;
  //       secret.lastChangedBy = userEmail;
  //     } else {
  //       secret = { id: uuidv4(), projectId, environmentId: envId, key, value, version: 1, updatedAt: now, lastChangedBy: userEmail };
  //       db.secrets.push(secret);
  //     }

  //     db.auditLogs.unshift({
  //       id: uuidv4(),
  //       projectId,
  //       environmentId: envId,
  //       action: 'SECRET_UPDATE',
  //       description: `Updated secret ${key}`,
  //       timestamp: now,
  //       performedBy: userEmail
  //     });
  //     saveDb(db);
  //     return {...secret, value};
  //   }

  //   // Supabase: Upsert registry
  //   const { data: existingReg } = await supabase
  //     .from('project_secret_registry')
  //     .select('id')
  //     .eq('project_id', projectId)
  //     .eq('key_name', key)
  //     .maybeSingle();

  //   if (existingReg) {
  //     await supabase.from('project_secret_registry').update({ last_updated_at: now }).eq('id', existingReg.id);
  //   } else {
  //     await supabase.from('project_secret_registry').insert({
  //       id: uuidv4(), project_id: projectId, key_name: key, description: '', last_updated_at: now
  //     });
  //   }

  //   // Supabase: Upsert secret
  //   const { data: existingSec } = await supabase
  //     .from('secrets')
  //     .select('id, version, deleted_at')
  //     .eq('project_id', projectId)
  //     .eq('environment_id', envId)
  //     .eq('key_name', key)
  //     .maybeSingle();

  //   let result;
  //   const secretData = {
  //     value,
  //     updated_at: now,
  //     // map 'lastChangedBy' to a generic 'metadata' json column if it exists, or assume loose schema.
  //     // For now, I'll attempt to add it to a 'metadata' column if it exists, roughly standard in my patterns.
  //     // Or if I can't, I will rely on audit logs.
  //     // Actually, let's just use Audit Logs for the "Who" for Supabase to avoid schema errors if column missing.
  //     // BUT the user wants to see it on the secret object likely.
  //     // Let's assume we can't easily add columns. We will use `audit_logs` for history.
  //     // BUT for the "Outdated" check in UI, we need it on the secret.
  //     // I will try to pass `last_changed_by` in the insert/update and catch error? No that's risky.
  //     // I'll skip adding it to `secrets` table for Supabase path and rely on audit logs.
  //     // Wait, for Mock I added `lastChangedBy`. For Supabase I'm stuck.
  //     // I will implement `getSecretHistory` to fetch from audit logs.

  //     // Let's TRY to see if `audit_logs` can be used 
  //   };

  //   if (existingSec) {
  //     const { data, error } = await supabase
  //       .from('secrets')
  //       .update({
  //         value,
  //         updated_at: now,
  //         deleted_at: null,
  //         version: existingSec.version + 1
  //       })
  //       .eq('id', existingSec.id)
  //       .select()
  //       .single();
  //     if (error) throw new Error(error.message);
  //     result = data;
  //   } else {
  //     const { data, error } = await supabase
  //       .from('secrets')
  //       .insert({
  //         id: uuidv4(), project_id: projectId, environment_id: envId,
  //         key_name: key, value, version: 1, created_at: now, updated_at: now
  //       })
  //       .select()
  //       .single();
  //     if (error) throw new Error(error.message);
  //     result = data;
  //   }

  //   // Audit log - Including performed_by if possible, or just description
  //   // Assuming audit_logs table has a 'performed_by' or similar. 
  //   // I'll put it in description for safety if I don't know schema
  //   const { error: auditError } = await supabase.from('audit_logs').insert({
  //     id: uuidv4(), project_id: projectId, environment_id: envId, action: 'SECRET_UPDATE',
  //     entity_type: 'SECRET', entity_id: result.id, timestamp: now,
  //     description: `Updated secret ${key} by ${userEmail}`
  //   });
  //   if (auditError) console.error('Audit Log Error:', auditError);

  //   return {
  //     id: result.id,
  //     projectId: result.project_id,
  //     environmentId: result.environment_id,
  //     key: result.key_name,
  //     value: result.value,
  //     version: result.version,
  //     updatedAt: result.updated_at,
  //     // For Supabase, we won't have lastChangedBy on the object immediately unless we fetch from audit logs
  //     lastChangedBy: userEmail // We can return what we just did
  //   };
  // },
  // -------------------------------------------------------------------------------

  saveSecret: async (projectId, envId, key, value, user = null) => {
    const now = new Date().toISOString();
    const userEmail = user?.email || 'Unknown';

    // In a professional application, this passphrase would be dynamic.
    // For your demo, we use this master key to encrypt the secret.
    const MASTER_PASSPHRASE = "sm2-demo-master-passphrase";

    // 1. Encrypt the secret value using your crypto utility before storage
    const encryptedValue = await encryptSecret(value, MASTER_PASSPHRASE);
    // 2. Generate a deterministic hash for checking sync status without decrypting
    const valueHash = await generateValueHash(value);

    // --- MOCK DATABASE PATH (LocalStorage) ---
    if (!supabase) {
      const db = getDb();
      let secret = db.secrets.find(s => s.projectId === projectId && s.environmentId === envId && s.key === key);
      let registryEntry = db.projectSecretRegistry.find(r => r.projectId === projectId && r.key === key);

      // Update the Global Registry for this key
      if (registryEntry) {
        registryEntry.lastUpdatedAt = now;
      } else {
        registryEntry = { id: uuidv4(), projectId, key, description: '', lastUpdatedAt: now };
        db.projectSecretRegistry.push(registryEntry);
      }

      // Update or Insert the secret with the ENCRYPTED value
      if (secret) {
        secret.value = encryptedValue;
        secret.updatedAt = now;
        secret.version += 1;
        secret.lastChangedBy = userEmail;
      } else {
        secret = { id: uuidv4(), projectId, environmentId: envId, key, value: encryptedValue, version: 1, updatedAt: now, lastChangedBy: userEmail };
        db.secrets.push(secret);
      }

      // Log the action to Audit Logs
      db.auditLogs.unshift({
        id: uuidv4(),
        projectId,
        environmentId: envId,
        action: 'SECRET_UPDATE',
        description: `Updated secret ${key}`,
        timestamp: now,
        performedBy: userEmail
      });

      saveDb(db);
      // Return the plain value to the UI so the dashboard updates immediately
      return { ...secret, value };
    }

    // --- SUPABASE DATABASE PATH (PostgreSQL) ---

    // 1. Update or Insert the Master Registry Entry
    const { data: existingReg } = await supabase
      .from('project_secret_registry')
      .select('id')
      .eq('project_id', projectId)
      .eq('key_name', key)
      .maybeSingle();

    if (existingReg) {
      await supabase.from('project_secret_registry').update({ last_updated_at: now }).eq('id', existingReg.id);
    } else {
      await supabase.from('project_secret_registry').insert({
        id: uuidv4(), project_id: projectId, key_name: key, description: '', last_updated_at: now
      });
    }

    // 2. Update or Insert the specific Environment Secret with the ENCRYPTED value
    const { data: existingSec } = await supabase
      .from('secrets')
      .select('id, version, deleted_at')
      .eq('project_id', projectId)
      .eq('environment_id', envId)
      .eq('key_name', key)
      .maybeSingle();

    let result;
    if (existingSec) {
      const { data, error } = await supabase
        .from('secrets')
        .update({
          value: encryptedValue, // The encrypted ciphertext
          updated_at: now,
          deleted_at: null,
          version: existingSec.version + 1
        })
        .eq('id', existingSec.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from('secrets')
        .insert({
          id: uuidv4(), project_id: projectId, environment_id: envId,
          key_name: key, value: encryptedValue, version: 1, created_at: now, updated_at: now
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    }

    // 3. Create an Audit Log entry for traceability
    await supabase.from('audit_logs').insert({
      id: uuidv4(), project_id: projectId, environment_id: envId, action: 'SECRET_UPDATE',
      entity_type: 'SECRET', entity_id: result.id, timestamp: now,
      description: `Updated secret ${key} by ${userEmail}`
    });

    return {
      id: result.id,
      projectId: result.project_id,
      environmentId: result.environment_id,
      key: result.key_name,
      value: value, // Return original plain value so the UI doesn't show ciphertext
      version: result.version,
      updatedAt: result.updated_at,
      lastChangedBy: userEmail
    };
  },

  deleteSecret: async (secretId) => {
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      const idx = db.secrets.findIndex(s => s.id === secretId);
      if (idx !== -1) {
        const secret = db.secrets[idx];
        db.secrets.splice(idx, 1);
        db.auditLogs.unshift({
          id: uuidv4(), projectId: secret.projectId, environmentId: secret.environmentId,
          action: 'SECRET_DELETE', description: `Deleted secret ${secret.key}`, timestamp: now
        });
        saveDb(db);
      }
      return true;
    }

    // Soft delete
    const { data: delSecret } = await supabase
      .from('secrets')
      .update({ deleted_at: now })
      .eq('id', secretId)
      .select()
      .single();
    if (delSecret) {
      const { error: auditError } = await supabase.from('audit_logs').insert({
        id: uuidv4(), project_id: delSecret.project_id, environment_id: delSecret.environment_id,
        action: 'SECRET_DELETE', entity_type: 'SECRET', entity_id: secretId, timestamp: now,
        description: `Deleted secret ${delSecret.key_name}`
      });
      if (auditError) console.error('Audit Log Error:', auditError);
    }
    return true;
  },

  deleteEnvironment: async (envId) => {
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      // Delete environment
      const idx = db.environments.findIndex(e => e.id === envId);
      if (idx !== -1) {
        db.environments.splice(idx, 1);
      }
      // Delete all secrets in this environment
      db.secrets = db.secrets.filter(s => s.environmentId !== envId);
      saveDb(db);
      return true;
    }

    // Soft delete secrets in environment
    await supabase.from('secrets').update({ deleted_at: now }).eq('environment_id', envId);
    // Soft delete environment
    const { error } = await supabase.from('environments').update({ deleted_at: now }).eq('id', envId);
    if (error) throw new Error(error.message);
    return true;
  },

  getProjectMembers: async (projectId) => {
    console.log('[API] getProjectMembers', projectId, !!supabase);
    if (!supabase) {
      const db = getDb();
      const members = db.projectMembers.filter(m => m.projectId === projectId);
      console.log('[API] Found members mock:', members);

      // Enrich with user details
      return members.map(m => {
        const user = db.users.find(u => u.id === m.userId);
        return {
          id: m.id,
          userId: m.userId,
          email: user ? user.email : m.inviteEmail, // Fallback for pending invites
          name: user ? user.name : null,
          environments: m.environments,
          status: m.status,
          invitedAt: m.invitedAt
        };
      });
    }
    // Supabase impl
    const { data, error } = await supabase
      .from('project_members')
      .select(`
            id, user_id, invite_email, status, environments, invited_at,
            users ( email, display_full_name )
        `)
      .eq('project_id', projectId);

    if (error) throw new Error(error.message);

    return data.map(m => ({
      id: m.id,
      userId: m.user_id,
      email: m.users ? m.users.email : m.invite_email,
      name: m.users ? m.users.display_full_name : null,
      environments: m.environments || [],
      status: m.status,
      invitedAt: m.invited_at
    }));
  },

  addProjectMember: async (projectId, email, envIds) => {
    console.log('[API] addProjectMember called', { projectId, email, envIds, supabaseStatus: !!supabase });
    const now = new Date().toISOString();
    if (!supabase) {
      const db = getDb();
      console.log('[API] Mock DB loaded', { memberCount: db.projectMembers?.length });

      // Check if user exists
      let user = db.users.find(u => u.email === email);
      let userId = user ? user.id : null;
      let status = user ? 'ACTIVE' : 'INVITED';

      // Check if already a member
      const existing = db.projectMembers.find(m => m.projectId === projectId && (m.userId === userId || m.inviteEmail === email));
      if (existing) {
        console.error('[API] Member already exists', existing);
        throw new Error('User is already a member of this project');
      }

      const newMember = {
        id: uuidv4(),
        projectId,
        userId,       // Null if invited
        inviteEmail: email,
        environments: envIds,
        status,
        hasPermission: true,
        invitedAt: now
      };

      db.projectMembers.push(newMember);
      console.log('[API] Pushed new member', newMember);

      // Audit Log
      db.auditLogs.unshift({
        id: uuidv4(), projectId, environmentId: null,
        action: 'MEMBER_ADD', description: `Added member ${email}`, timestamp: now
      });

      saveDb(db);
      console.log('[API] DB Saved');
      return newMember;
    }

    // Supabase implementation
    // 1. Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    let userId = user ? user.id : null;
    let status = user ? 'ACTIVE' : 'INVITED';

    // 2. Insert member
    const { data: newMember, error } = await supabase
      .from('project_members')
      .insert({
        id: uuidv4(),
        project_id: projectId,
        user_id: userId,
        invite_email: email,
        environments: envIds,
        status: status,
        has_permission: true,
        invited_at: now
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 3. Audit Log
    await supabase.from('audit_logs').insert({
      id: uuidv4(),
      project_id: projectId,
      action: 'MEMBER_ADD',
      description: `Added member ${email}`,
      timestamp: now
    });

    return {
      id: newMember.id,
      projectId: newMember.project_id,
      userId: newMember.user_id,
      inviteEmail: newMember.invite_email,
      environments: newMember.environments,
      status: newMember.status,
      invitedAt: newMember.invited_at
    };
  },

  updateProjectMember: async (projectId, memberId, envIds) => {
    const now = new Date().toISOString();
    if (!supabase) {
      const db = getDb();
      const member = db.projectMembers.find(m => m.id === memberId);
      if (member) {
        member.environments = envIds;

        // Audit Log
        db.auditLogs.unshift({
          id: uuidv4(), projectId, environmentId: null,
          action: 'MEMBER_UPDATE', description: `Updated access for member ${member.userId || member.inviteEmail}`, timestamp: now
        });

        saveDb(db);
      }
      return true;
    }

    // Supabase implementation
    const { error } = await supabase
      .from('project_members')
      .update({ environments: envIds })
      .eq('id', memberId);

    if (error) throw new Error(error.message);

    // Audit Log (simplified, not fetching member details for desc)
    await supabase.from('audit_logs').insert({
      id: uuidv4(),
      project_id: projectId,
      action: 'MEMBER_UPDATE',
      description: `Updated access for member ${memberId}`,
      timestamp: now
    });

    return true;
  },

  removeProjectMember: async (projectId, memberId) => {
    const now = new Date().toISOString();
    if (!supabase) {
      const db = getDb();
      const idx = db.projectMembers.findIndex(m => m.id === memberId);
      if (idx !== -1) {
        const member = db.projectMembers[idx];
        db.projectMembers.splice(idx, 1);

        // Audit Log
        db.auditLogs.unshift({
          id: uuidv4(), projectId, environmentId: null,
          action: 'MEMBER_REMOVE', description: `Removed member ${member.userId || member.inviteEmail}`, timestamp: now
        });

        saveDb(db);
      }
      return true;
    }

    // Supabase implementation
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    if (error) throw new Error(error.message);

    await supabase.from('audit_logs').insert({
      id: uuidv4(),
      project_id: projectId,
      action: 'MEMBER_REMOVE',
      description: `Removed member ${memberId}`,
      timestamp: now
    });

    return true;
  },

  updateSecretDescription: async (projectId, keyName, description) => {
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      const reg = db.projectSecretRegistry.find(r => r.projectId === projectId && r.key === keyName);
      if (reg) {
        reg.description = description;
        saveDb(db);
      }
      return true;
    }

    const { error } = await supabase
      .from('project_secret_registry')
      .update({ description, last_updated_at: now })
      .eq('project_id', projectId)
      .eq('key_name', keyName);
    if (error) throw new Error(error.message);
    return true;
  },

  // Mark a secret as synced by touching its updated_at timestamp
  syncSecret: async (secretId) => {
    const now = new Date().toISOString();

    if (!supabase) {
      const db = getDb();
      const secret = db.secrets.find(s => s.id === secretId);
      if (secret) {
        secret.updatedAt = now;
        saveDb(db);
      }
      return true;
    }

    const { error } = await supabase
      .from('secrets')
      .update({ updated_at: now })
      .eq('id', secretId);
    if (error) throw new Error(error.message);
    return true;
  },

  getSecretHistory: async (secretId) => {
    if (!supabase) {
      const db = getDb();
      return db.auditLogs
        .filter(log => log.entity_id === secretId || (log.description && log.description.includes(secretId))) // broad match for mock
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', secretId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  getAuditLogs: async (projectId, envId = null) => {
    if (!supabase) {
      const db = getDb();
      let logs = db.auditLogs.filter(log => log.projectId === projectId);
      if (envId) {
        logs = logs.filter(log => log.environmentId === envId);
      }
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('project_id', projectId);

    if (envId) {
      query = query.eq('environment_id', envId);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
    return data;
  },

  getSecretKeyValues: async (projectId, keyName) => {
    if (!supabase) {
      const db = getDb();
      return db.secrets
        .filter(s => s.projectId === projectId && s.key === keyName)
        .map(s => ({
          environmentId: s.environmentId,
          value: s.value,
          updatedAt: s.updatedAt,
          version: s.version
        }));
    }

    // Security Note: In a real app, RLS would filter this automatically. 
    // If not using RLS, we'd need to manually join permissions.
    // Assuming RLS or Admin privileges for now based on ProjectView logic.

    const { data, error } = await supabase
      .from('secrets')
      .select('environment_id, value, updated_at, version')
      .eq('project_id', projectId)
      .eq('key_name', keyName)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);

    return data.map(s => ({
      environmentId: s.environment_id,
      value: s.value,
      updatedAt: s.updated_at,
      version: s.version
    }));
  },

  searchGlobal: async (query) => {
    if (!query || query.length < 2) return { projects: [], secrets: [] };
    const q = query.toLowerCase();

    if (!supabase) {
      const db = getDb();
      // Search Projects
      const projects = db.projects.filter(p =>
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      ).map(p => ({
        id: p.id, name: p.name, slug: p.slug, type: 'PROJECT'
      }));

      // Search Secrets (Registry & Secrets table for usage)
      // 1. Find keys matching query
      const matchingSecretKeys = [...new Set(
        db.secrets.filter(s => s.key.toLowerCase().includes(q)).map(s => s.key)
      )];

      // 2. Aggregate usage
      const secrets = matchingSecretKeys.map(key => {
        const usage = db.secrets.filter(s => s.key === key);
        const projectIds = [...new Set(usage.map(u => u.projectId))];
        const usedIn = projectIds.map(pid => {
          const proj = db.projects.find(p => p.id === pid);
          return proj ? { id: proj.id, name: proj.name, slug: proj.slug } : null;
        }).filter(Boolean);

        return {
          key,
          type: 'SECRET',
          count: usage.length,
          usedIn
        };
      });

      return { projects, secrets };
    }

    // Supabase Implementation
    // 1. Search Projects
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('id, display_name, slug, description')
      .or(`display_name.ilike.%${query}%,slug.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(10);

    if (pError) throw new Error(pError.message);

    const mappedProjects = projects.map(p => ({
      id: p.id, name: p.display_name, slug: p.slug, description: p.description, type: 'PROJECT'
    }));

    // 2. Search Secrets (Registry)
    // We want to find keys matching the query, then find where they are used.
    // This is complex in one query. Let's find matching unique keys first.

    // Using RPC or distinct select is better, but let's try standard select on secrets
    const { data: foundSecrets, error: sError } = await supabase
      .from('secrets')
      .select('key_name, project_id, projects(display_name, slug)')
      .ilike('key_name', `%${query}%`)
      .is('deleted_at', null);

    if (sError) throw new Error(sError.message);

    // Group by Key
    const secretMap = {};
    foundSecrets.forEach(item => {
      if (!secretMap[item.key_name]) {
        secretMap[item.key_name] = {
          key: item.key_name,
          type: 'SECRET',
          usedInMap: {} // Use map to deduplicate projects
        };
      }
      if (item.projects) {
        secretMap[item.key_name].usedInMap[item.project_id] = {
          id: item.project_id,
          name: item.projects.display_name,
          slug: item.projects.slug
        };
      }
    });

    const mappedSecrets = Object.values(secretMap).map(s => ({
      key: s.key,
      type: 'SECRET',
      usedIn: Object.values(s.usedInMap),
      count: Object.values(s.usedInMap).length // Project count
    }));

    return { projects: mappedProjects, secrets: mappedSecrets };
  }
};
