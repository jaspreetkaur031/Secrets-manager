<div align="center">

# 🔐 VaultFlow

**The Zero-Knowledge, Multi-Environment Secrets Manager & Injector SDK**

[![React](https://img.shields.io/badge/React-19.0-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-SDK-339933.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

<p>
  Stop committing <code>.env</code> files. Start injecting secrets directly into memory.
</p>

</div>

---

## 🚀 The Problem vs. The VaultFlow Solution

Managing environment variables via `.env` files is a security risk and an operational nightmare. Secrets get leaked in version control, fall out of sync across team members' machines, and require manual server restarts to update in production.

| ❌ The Old Way (`.env` files) | ✅ The VaultFlow Way |
| :--- | :--- |
| **Security Risk:** Plain-text secrets scattered across developer laptops. | **Zero-Knowledge:** Secrets encrypted client-side; DB only sees ciphertext. |
| **Sync Nightmares:** "Hey, can you slack me the new API key?" | **Global Registry:** Centralized truth detects outdated environments instantly. |
| **Manual Updates:** Requires SSHing into servers to edit config files. | **Runtime Injection:** SDK fetches and decrypts directly into memory on boot. |

---

## ✨ Key Features

* 🛡️ **Zero-Knowledge Architecture:** Secrets are encrypted and decrypted purely on the client-side (in the browser or via the Node.js SDK). The database only ever stores scrambled ciphertext.
* 🔄 **The "Registry Pattern":** A smart database design that acts as a global source of truth, instantly detecting when a secret falls "Out of Sync" across Development, Staging, and Production environments.
* 💉 **Runtime Injection SDK:** A custom Node.js script (`vaultflow-inject.js`) that securely fetches and injects secrets into consumer applications at boot time.
* 📝 **Audit Logging:** Comprehensive tracking of every mutation (create, update, delete) for compliance and rollback capabilities.
* 🔐 **Stateless Authentication:** Secure JWT-style session management without requiring heavy server-side state.

---

## 🔒 Security Model & Architecture

VaultFlow is built on a modern, scalable tech stack, prioritizing security above all else. We utilize **AES-256-GCM** authenticated encryption to ensure both the confidentiality and integrity of your data.

1. **Key Derivation:** When a project is locked, the user's Master Passphrase is run through **PBKDF2** with a random salt and 100,000 iterations to generate a robust 256-bit cryptographic key.
2. **Encryption at Rest:** The plain-text secret is encrypted using this derived key and a unique Initialization Vector (IV). 
3. **Storage:** Only the resulting payload (`base64(salt) : base64(iv) : base64(ciphertext)`) is sent to the Supabase PostgreSQL database. The Master Passphrase never leaves the client's device.

---

## 🛠️ Getting Started (Local Development)

Want to run VaultFlow locally? Follow these steps.

<details>
<summary><b>1. Database Setup (Supabase)</b></summary>

1. Create a new project in [Supabase](https://supabase.com).
2. Open the SQL Editor and execute the contents of `/Secrets Manager 2/schema.sql` to generate the `projects`, `environments`, `secrets`, `project_secret_registry`, and `audit_logs` tables.
3. Apply the associated migration files.
</details>

<details>
<summary><b>2. Frontend Setup</b></summary>

```bash
# Clone the repository
git clone [https://github.com/yourusername/vaultflow.git](https://github.com/yourusername/vaultflow.git)
cd vaultflow/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.staging .env.local

Open .env.local and add your Supabase URL and Anon Key.

# Start the development server
npm run dev

</details>

🪄 The Magic: VaultFlow Runtime Injector
The true power of VaultFlow is consuming secrets without .env files. Here is how to use the included custom SDK to inject secrets into any Node.js backend.

1. Configure the Script
Drop the vaultflow-inject.js script into your target backend project. Open it and add your specific IDs:

const SUPABASE_URL = '[https://your-project.supabase.co](https://your-project.supabase.co)'; 
const SUPABASE_ANON_KEY = 'your-anon-key'; 
const PROJECT_ID = 'your-vaultflow-project-uuid'; 
const ENVIRONMENT_ID = 'your-target-environment-uuid';

2. Boot your Application
Instead of starting your server with node server.js, wrap it in the injector:

node vaultflow-inject.js

What happens under the hood?

The script authenticates with Supabase and downloads the AES-256-GCM ciphertexts.

It uses the Master Passphrase to decrypt the secrets purely in RAM.

It injects the decrypted plain-text into process.env.

It spawns your target application (e.g., server.js) as a child process, leaving zero trace on the hard drive.

🗂️ Project Structure

├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components (Modals, Inputs, Cards)
│   │   ├── hooks/       # Custom React hooks (useDebounce, useSecretSync)
│   │   ├── lib/         # Core logic (api.js, crypto.js, supabase.js)
│   │   └── pages/       # Dashboard, Compare Secrets, Product Landing Pages
│   └── package.json
├── schema.sql           # Core PostgreSQL Database Schema
├── migration_*.sql      # Iterative database updates
└── vaultflow-inject.js  # The Node.js consumer SDK

<div align="center">
<i>Designed and engineered with a focus on developer experience and zero-trust security.</i>
</div> 