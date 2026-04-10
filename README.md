<div align="center">

# 🔐 VaultFlow

**The Zero-Knowledge, Multi-Environment Secrets Manager & Injector SDK**

[![React](https://img.shields.io/badge/React-19.0-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-SDK-339933.svg?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

<p align="center">
  Stop committing <code>.env</code> files. Start injecting secrets directly into memory.
</p>

</div>

---

## 🚀 The Problem vs. The VaultFlow Solution

| ❌ The Old Way (`.env` files) | ✅ The VaultFlow Way |
| :--- | :--- |
| **Security Risk:** Plain-text secrets scattered across developer laptops. | **Zero-Knowledge:** Secrets encrypted client-side; DB only sees ciphertext. |
| **Sync Nightmares:** "Hey, can you slack me the new API key?" | **Global Registry:** Centralized truth detects outdated environments instantly. |
| **Manual Updates:** Requires SSHing into servers to edit config files. | **Runtime Injection:** SDK fetches and decrypts directly into memory on boot. |

---

## 🏗️ System Architecture

VaultFlow is designed to keep your secrets entirely out of your codebase and configuration files. Here is how data moves through the system:

```mermaid
graph TD
    subaxis
        UI[VaultFlow Web UI]
    end
    
    subgraph Zero-Knowledge Boundary
        Crypt[Client-Side Web Crypto API]
    end

    subgraph Storage
        DB[(Supabase PostgreSQL)]
    end

    subgraph Consumer Application
        SDK[vaultflow-inject.js]
        App[Node.js Server]
    end

    UI -->|Plain-text Secret| Crypt
    UI -.->|Master Passphrase| Crypt
    Crypt -->|AES-GCM Ciphertext| DB
    
    DB -->|AES-GCM Ciphertext| SDK
    SDK -.->|Master Passphrase| SDK
    SDK -->|Decrypts in RAM| SDK
    SDK -->|Injects process.env| App
    
    style DB fill:#1e1e1e,stroke:#3ECF8E,stroke-width:2px,color:#fff
    style Crypt fill:#1e1e1e,stroke:#646CFF,stroke-width:2px,color:#fff
    style SDK fill:#1e1e1e,stroke:#339933,stroke-width:2px,color:#fff

    🔒 Security Model: Zero-Knowledge Encryption
We never see your secrets. VaultFlow uses AES-256-GCM authenticated encryption to ensure both the confidentiality and integrity of your data.

sequenceDiagram
    participant Dev as Developer
    participant Browser as Browser (RAM)
    participant DB as Supabase DB

    Dev->>Browser: Enters Master Passphrase & Secret
    Note over Browser: PBKDF2 Derivation<br/>(100,000 iterations + Salt)
    Browser->>Browser: Generates 256-bit Key
    Note over Browser: AES-GCM Encryption<br/>(Secret + Key + IV)
    Browser->>DB: Sends payload: [Base64 Salt : Base64 IV : Ciphertext]
    Note over DB: Database stores scrambled text.<br/>Cannot decrypt without Passphrase.

    🧬 Database Schema & The Registry Pattern
To efficiently track when a secret is "out of sync" across multiple environments (Dev, Staging, Prod) without complex O(N*M) logic, VaultFlow implements a Registry Pattern.

🧬 Database Schema & The Registry Pattern
To efficiently track when a secret is "out of sync" across multiple environments (Dev, Staging, Prod) without complex O(N*M) logic, VaultFlow implements a Registry Pattern.

💡 How the Sync Check Works: Whenever a secret is updated anywhere, the project_secret_registry.last_updated_at is updated. To check if Environment A is synced, the UI simply compares secrets.updated_at against the master registry timestamp.

🛠️ Quick Start Guide
<details>
<summary><b>1. Database Setup (Supabase)</b></summary>


Create a new project in Supabase.

Open the SQL Editor and execute the contents of schema.sql.

Apply any subsequent migrations found in migration_*.sql.

</details>

<details>
<summary><b>2. Frontend Dashboard Setup</b></summary>

# Clone the repository
git clone [https://github.com/yourusername/vaultflow.git](https://github.com/yourusername/vaultflow.git)
cd vaultflow/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.staging .env.local

Open .env.local and add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start the development server
npm run dev
</details>

🪄 Using the Runtime Injector SDK
Stop using .env files in your backend projects. Use the VaultFlow Injector to pull secrets dynamically at boot.

1. Configure the Injector
Copy vaultflow-inject.js into your backend repository. Update the configuration block at the top of the file:

const SUPABASE_URL = '[https://your-project.supabase.co](https://your-project.supabase.co)'; 
const SUPABASE_ANON_KEY = 'your-anon-key'; 
const PROJECT_ID = 'your-vaultflow-project-uuid'; 
const ENVIRONMENT_ID = 'your-target-environment-uuid';

2. Boot Your Server
Instead of running node server.js, wrap your execution in the injector:
node vaultflow-inject.js

Output:

Code snippet
🔒 VaultFlow Injector: Booting up...
📦 Found 12 encrypted secrets. Decrypting...
   ✅ Decrypted & Injected: DATABASE_URL
   ✅ Decrypted & Injected: STRIPE_API_KEY
   ✅ Decrypted & Injected: AWS_ACCESS_KEY
🚀 Starting target application...
-----------------------------------
🟢 Application running on http://localhost:3000

<div align="center">
<i>Designed and engineered with a focus on developer experience and zero-trust security.</i>
</div>