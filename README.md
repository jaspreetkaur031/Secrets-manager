# 🔐 VaultFlow (Secrets Manager)

<div align="center">
  <p><strong>A Zero-Knowledge, Multi-Environment Secrets Manager & Injector SDK</strong></p>
</div>

## 🚀 The Problem it Solves
Managing environment variables via `.env` files is a security risk and an operational nightmare. Secrets get leaked in version control, fall out of sync across team members' machines, and require manual server restarts to update in production. 

**VaultFlow** solves this by centralizing environment variables in a highly secure, end-to-end encrypted registry. It dynamically injects decrypted secrets directly into your application's memory at runtime—eliminating the need for `.env` files entirely.

---

## ✨ Key Features

* **Zero-Knowledge Architecture:** Secrets are encrypted and decrypted purely on the client-side (in the browser or via the Node.js SDK). The database only ever stores scrambled ciphertext.
* **The "Registry Pattern":** A smart database design that acts as a global source of truth, instantly detecting when a secret falls "Out of Sync" across Development, Staging, and Production environments.
* **Runtime Injection SDK:** A custom Node.js script (`vaultflow-inject.js`) that securely fetches and injects secrets into consumer applications at boot time.
* **Audit Logging:** Comprehensive tracking of every mutation (create, update, delete) for compliance and rollback capabilities.
* **Stateless Authentication:** Secure JWT-style session management without requiring heavy server-side state.

---

## 🏗️ Architecture & Security Model

VaultFlow is built on a modern, scalable tech stack, prioritizing security above all else.

### Tech Stack
* **Frontend:** React 19, Vite, Wouter (for lightweight routing), Tailwind-style utility CSS.
* **Backend / Database:** PostgreSQL (hosted via Supabase), leveraging Row Level Security (RLS).
* **Cryptography:** Native Web Crypto API (`window.crypto.subtle`) and Node.js `crypto` module.

### How the Zero-Knowledge Encryption Works
We utilize **AES-256-GCM** authenticated encryption to ensure both the confidentiality and integrity of your data.
1. **Key Derivation:** When a project is locked, the user's Master Passphrase is run through **PBKDF2** with a random salt and 100,000 iterations to generate a robust 256-bit cryptographic key.
2. **Encryption at Rest:** The plain-text secret is encrypted using this derived key and a unique Initialization Vector (IV). 
3. **Storage:** Only the resulting payload (`base64(salt) : base64(iv) : base64(ciphertext)`) is sent to the Supabase PostgreSQL database. The Master Passphrase never leaves the client's device.

---

## 🛠️ Getting Started (Local Development)

Want to run VaultFlow locally? Follow these steps.

### Prerequisites
* Node.js (v18+)
* A Supabase account (or local Supabase instance)

### 1. Database Setup
1. Create a new project in Supabase.
2. Run the SQL scripts found in `/Secrets Manager 2/schema.sql` and the associated migration files in your Supabase SQL Editor to generate the `projects`, `environments`, `secrets`, `project_secret_registry`, and `audit_logs` tables.

### 2. Frontend Setup
```bash
# Clone the repository
git clone [https://github.com/yourusername/vaultflow.git](https://github.com/yourusername/vaultflow.git)
cd vaultflow/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.staging .env.local