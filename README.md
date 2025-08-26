# SecureVars

![Status](https://img.shields.io/badge/status-active-success) ![Node](https://img.shields.io/badge/node-%3E=18.0-green) ![License](https://img.shields.io/badge/license-TBD-lightgrey) ![PRs](https://img.shields.io/badge/PRs-welcome-blue) ![Security](https://img.shields.io/badge/encryption-AES--GCM-important)

Full‑stack Secret Management application (backend: Node/Express/Mongo, frontend: React + Vite + TypeScript + shadcn/ui) providing encrypted storage, version history, rotation reminders, import/export, and environment comparison.

> Security Notice: The master password cannot be recovered. If lost, you must re‑initialize and re‑import secrets. Plaintext secret values are never stored—only transiently in memory until encryption.

---

## Quick Navigation

| Section                     | Link                                     |
| --------------------------- | ---------------------------------------- |
| 0. Why SecureVars           | [Go](#0-why-securevars)                  |
| Quick Start                 | [Go](#quick-start)                       |
| Quick Commands              | [Go](#quick-commands)                    |
| 1. Core Features            | [Go](#1-core-features)                   |
| 2. Tech Stack               | [Go](#2-tech-stack)                      |
| 3. High-Level Architecture  | [Go](#3-high-level-architecture)         |
| 4. Data Flow Overview       | [Go](#4-data-flow-overview)              |
| 5. Security Model           | [Go](#5-security-model)                  |
| 6. Environment Variables    | [Go](#6-environment-variables-backend)   |
| 7. Data Models              | [Go](#7-data-models-current)             |
| 8. Encryption Lifecycle     | [Go](#8-encryption-lifecycle)            |
| 9. API Endpoint Summary     | [Go](#9-api-endpoint-summary-key)        |
| 10. Frontend Structure      | [Go](#10-frontend-structure-highlights)  |
| 11. Authentication Flow     | [Go](#11-authentication-flow-sequence)   |
| 12. Secret Lifecycle        | [Go](#12-secret-lifecycle-detailed)      |
| 13. Running Locally         | [Go](#13-running-locally)                |
| 14. Development Guidelines  | [Go](#14-development-guidelines)         |
| 15. Migration Plan          | [Go](#15-migration-plan-v2-models)       |
| 16. Production Hardening    | [Go](#16-production-hardening-checklist) |
| 17. Troubleshooting         | [Go](#17-troubleshooting)                |
| 18. Roadmap                 | [Go](#18-roadmap-proposed)               |
| 19. Contributing            | [Go](#19-contributing-internal)          |
| 20. License                 | [Go](#20-license)                        |
| 21. Quick Command Reference | [Go](#21-quick-command-reference)        |

## 0. Why SecureVars

Traditional .env files and ad‑hoc secret sharing (chat, email) create drift, lack auditability, and risk exposure. SecureVars focuses on:

- Developer velocity: Import/export, quick copy formats, environment diff.
- Operational safety: Version history & rollback, rotation reminders.
- Security posture: AES‑GCM encryption at rest, HTTP‑only cookie auth.
- Clarity: Rich metadata (priority, category, usage) for triage & audits.
- Extensibility: Planned multi-user, API keys, rotation automation.

If you outgrow plain dotenv but aren’t ready for a full enterprise vault—this fills the gap.

## Quick Start

```bash
# Clone
git clone <your-repo-url> SecureVars
cd SecureVars

# Backend env
cp backend/.env.example backend/.env   # or create manually (see section 6)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # generate ENCRYPTION_KEY

# Install (can use npm or pnpm)
cd backend && npm install
cd ../frontend && npm install

# Run both (Windows)
../start-dev.bat
# or *nix
../start-dev.sh

# Open frontend and set master password
open http://localhost:5173  # (or manually in browser)
```

### First Secret via API (example)

```bash
curl -X POST http://localhost:4000/api/auth/login \
   -H 'Content-Type: application/json' \
   -d '{"password":"YourStrongPass!"}' -c cookies.txt

curl -X POST http://localhost:4000/api/secrets \
   -H 'Content-Type: application/json' -b cookies.txt \
   -d '{
      "name":"Stripe API Key",
      "identifier":"STRIPE_API_KEY",
      "value":"sk_live_xxx",
      "project": {"name":"E-commerce API"},
      "environment":"production",
      "meta": {"tags":["payment","stripe"],"priority":"high"}
   }'
```

---

## Quick Commands

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# (Planned) Reset master password script
node backend/resetMasterPassword.js
```

---

<!-- Navigation table consolidated above -->

---

## 1. Core Features

- Master password–secured system (single administrative user)
- AES-GCM encryption at rest (value never stored unencrypted)
- Cookie (HTTP‑only) based JWT auth (access + refresh tokens)
- Secrets: metadata, categories, tags, priority, strength, rotation reminders
- Version history & rollback
- Access tracking (last accessed, count)
- Import / export: .env, JSON, CSV
- Environment diff & (future) sync tooling
- Project grouping (name + module + environments)
- Extended frontend UX (search, filter, bulk operations, quick copy formats)

---

## 2. Tech Stack

| Layer     | Tech                                                          |
| --------- | ------------------------------------------------------------- |
| Backend   | Node.js (ESM), Express 5, Mongoose 8, JWT, bcryptjs           |
| Database  | MongoDB                                                       |
| Frontend  | React 18 + Vite, TypeScript, Tailwind, shadcn/ui, React Query |
| Build/Dev | pnpm / npm, scripts, Axios, ESLint                            |
| Logging   | winston                                                       |

---

## 3. High-Level Architecture

Monorepo style:

```
SecureVars/
  backend/            # API + encryption + persistence
  frontend/           # SPA client
  start-dev.*         # Convenience scripts
```

Communication: Frontend -> (Axios, credentials) -> Backend (REST JSON) -> MongoDB.
Tokens managed via secure HTTP-only cookies (no localStorage). Encryption handled server-side before validation & persistence.

---

## 4. Data Flow Overview

1. Initialization:
   - User POST /auth/initialize with master password (only if not already set) → hash stored in backend .env; ENCRYPTION_KEY already present.
2. Login:
   - POST /auth/login → sets `accessToken` (short-lived) & `refreshToken` cookies.
3. Authenticated Requests:
   - Cookies automatically included (CORS allows credentials); middleware validates access token.
4. Secret Creation:
   - Frontend sends plaintext `value` + metadata.
   - Model setter stores temp `_value`.
   - pre('validate') encrypts -> sets `encryptedValue`, `iv`, `authTag`; clears `_value`.
   - History entry created.
5. Fetch List:
   - GET /secrets excludes encrypted fields; value not sent.
6. Fetch Single Secret:
   - GET /secrets/:id returns decrypted virtual `value` (derived) or may be adjusted for on-demand reveal.
7. Update / Rollback:
   - New value triggers encrypt + history version increment.
8. Rotation Reminder:
   - On save, if enabled & nextDue missing → auto-compute nextDue = lastRotated + intervalDays.
9. Refresh Token:
   - Frontend either proactive interval or 401 retry → POST /auth/refresh sets new access token.
10. Logout:

- POST /auth/logout clears cookies.

---

## 5. Security Model

| Aspect                    | Detail                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Master Password           | Single admin credential; bcrypt hash persisted in `.env`                                             |
| Encryption Key            | `ENCRYPTION_KEY` (hex) used for AES-GCM (stored server-side only)                                    |
| Encryption Fields         | `encryptedValue`, `iv`, `authTag` per secret & history record                                        |
| Token Transport           | HTTP-only, SameSite cookies; CORS `credentials: true`                                                |
| Attack Surface Mitigation | Rate limiting on auth, centralized error handling, input trimming, identifier uniqueness per project |

Plaintext secret value _never_ stored—only transient in memory until encrypted.

---

## 6. Environment Variables (Backend)

Create `backend/.env` (example):

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/securevars
JWT_SECRET=change_me_jwt
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=<64-hex-chars>
NODE_ENV=development
MASTER_PASSWORD_HASH=<auto-added after initialize>
```

Generate a 32-byte encryption key:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Frontend `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

---

## 7. Data Models (Current)

### Secret

- name, identifier, project { name, module, \_id }, environment
- encryptedValue, iv, authTag
- meta: description, tags[], createdAt, lastUpdated, isActive, isFavorite, lastAccessed, accessCount, version
- Extended meta: category, priority, strength, rotationReminder{ enabled, intervalDays, lastRotated, nextDue }, personalNotes, quickCopyFormat, usagePattern{ frequency, lastUsedInProject }
- Virtual: value (decrypted)

### SecretHistory

- secretId (ref), version, encryptedValue, iv, authTag, changedAt, changeDescription
- Virtual: value

### Project

- name, modules[], environments[], counts (derived by queries)

### (Planned v2 Models)

- Expanded indexing, soft delete, slugs, denormalized aggregates.

---

## 8. Encryption Lifecycle

1. Controller sets plaintext via `secret.setValue(value)`.
2. Schema pre('validate') hook checks `_value` sentinel.
3. Encrypts using AES-GCM → sets `encryptedValue`, `iv`, `authTag`.
4. Clears `_value` (plaintext discarded).
5. Virtual getter decrypts on demand.

Failure mode: missing ENCRYPTION_KEY → decryption returns null (value not exposed).

---

## 9. API Endpoint Summary (Key)

| Method | Path                             | Description                      | Auth                   |
| ------ | -------------------------------- | -------------------------------- | ---------------------- |
| POST   | /api/auth/initialize             | Set master password              | No (blocked after set) |
| POST   | /api/auth/login                  | Login, set cookies               | No                     |
| POST   | /api/auth/refresh                | Refresh access token             | Refresh cookie         |
| POST   | /api/auth/logout                 | Clear cookies                    | Yes                    |
| GET    | /api/auth/check                  | Verify access token              | Yes                    |
| GET    | /api/secrets                     | List secrets (no plaintext)      | Yes                    |
| POST   | /api/secrets                     | Create secret                    | Yes                    |
| GET    | /api/secrets/:id                 | Secret + decrypted virtual value | Yes                    |
| PUT    | /api/secrets/:id                 | Update (possibly new version)    | Yes                    |
| DELETE | /api/secrets/:id                 | Delete secret                    | Yes                    |
| POST   | /api/secrets/bulk-delete         | Bulk delete                      | Yes                    |
| PATCH  | /api/secrets/:id/toggle-status   | Activate/deactivate              | Yes                    |
| PATCH  | /api/secrets/:id/toggle-favorite | Favorite toggle                  | Yes                    |
| GET    | /api/secrets/:id/history         | Versions (no value fields)       | Yes                    |
| POST   | /api/secrets/:id/rollback        | Rollback to version              | Yes                    |
| GET    | /api/secrets/recent              | Recently accessed                | Yes                    |
| GET    | /api/projects                    | List projects                    | Yes                    |
| POST   | /api/import-export/env           | Import .env content              | Yes                    |
| GET    | /api/import-export/env           | Export .env                      | Yes                    |
| POST   | /api/import-export/json          | Import JSON                      | Yes                    |
| GET    | /api/import-export/json          | Export JSON                      | Yes                    |
| GET    | /api/import-export/csv           | Export CSV                       | Yes                    |

---

## 10. Frontend Structure Highlights

```
frontend/src/
  pages/ (Dashboard, SecretsList, SecretDetail, EnvCompare, Login)
  contexts/ (AuthProvider, SecretsProvider)
  hooks/ (use-auth, use-secrets, use-mobile, use-toast)
  services/ (api-client, auth-service, secret-service, project-service, import-export-service)
  components/ (secret dialogs, forms, layout, UI)
  lib/ (secretUtils, diff helpers)
```

Data loaded through providers, cached in context state, enriched with derived sets (tags, recently accessed).

---

## 11. Authentication Flow (Sequence)

```
User -> POST /auth/login (password)
Backend -> Verify bcrypt hash
Backend -> Issue access + refresh cookies (httpOnly)
User -> Subsequent /secrets requests with cookies
Backend -> Middleware validates JWT access token
If expired -> Frontend POST /auth/refresh -> new access cookie
Logout -> POST /auth/logout -> clear cookies
```

---

## 12. Secret Lifecycle (Detailed)

| Step | Action       | Notes                                              |
| ---- | ------------ | -------------------------------------------------- |
| 1    | Create       | plaintext value included once                      |
| 2    | pre-validate | encryption executed (sentinel)                     |
| 3    | Save         | metadata timestamps updated                        |
| 4    | History      | initial version stored                             |
| 5    | Access       | viewing increments access count, sets lastAccessed |
| 6    | Update       | New value triggers version++ & history record      |
| 7    | Rollback     | Re-applies prior value -> new version created      |
| 8    | Delete       | Removes secret + history cascade                   |

---

## 13. Running Locally

### Prerequisites

- Node 18+/20+
- MongoDB running locally

### Install

```
cd backend && npm install
cd ../frontend && npm install
```

### Dev (two terminals or scripts)

```
./start-dev.sh   # mac/linux
start-dev.bat    # windows
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

Initialize via UI or:

```
curl -X POST http://localhost:4000/api/auth/initialize -H "Content-Type: application/json" -d '{"password":"YourStrongPass!"}'
```

Login afterwards using same password.

---

## 14. Development Guidelines

| Task                | Guidance                                                                    |
| ------------------- | --------------------------------------------------------------------------- |
| Add meta field      | Update Secret schema + history if tracked; expose in controller mapping     |
| Add endpoint        | Create controller fn + route + (optional) validator + integrate in services |
| Extend encryption   | Keep plaintext only via `_value`; never store directly                      |
| Frontend API change | Update services & types; propagate to contexts                              |

Use pre('validate') for transformations that must precede Mongoose required validators.

---

## 15. Migration Plan (v2 Models)

Planned improvements:

- Denormalized counts & indexes for faster querying
- Soft deletion (deletedAt)
- Slug/UID fields for stable references
- Enhanced history auto-capture (post-save diff detection)

Migration Steps:

1. Deploy v2 models in parallel (already scaffolded).
2. Write migration script iterating Secrets -> SecretV2.
3. Dual-write (optional period) then flip read path.
4. Archive old collections; remove after validation.

---

## 16. Production Hardening Checklist

- Enable HTTPS + secure cookie flags (secure, sameSite=strict)
- Rotate JWT secret & encryption key policy (manual rotation plan w/ re-encrypt script)
- Add audit log collection (who/when acted)
- Implement brute-force lockout (incremental backoff) for login
- Add per-secret ACL (future multi-user expansion)
- Monitoring: aggregated logs + metrics (latency, error rate)
- Backups: schedule mongodump + off-site storage

---

## 17. Troubleshooting

| Symptom                               | Likely Cause                           | Resolution                                                        |
| ------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| 401 on every request                  | Missing cookies / CORS credentials off | Ensure `withCredentials: true` & backend CORS `credentials: true` |
| Secret validation: missing iv/authTag | Encryption hook not running            | Ensure setValue called before save                                |
| Token not refreshing                  | refresh endpoint blocked by CORS       | Confirm origin list includes frontend URL                         |
| Decryption returns null               | Wrong ENCRYPTION_KEY / corrupted data  | Verify key & stored fields                                        |
| Duplicate identifier error            | Same project+identifier exists         | Change identifier or project                                      |

---

## 18. Roadmap (Proposed)

- Secret value on-demand reveal endpoint (separate from metadata fetch)
- Granular user roles (read-only, auditor)
- API key management for automation
- Rotation automation + notification scheduler
- Advanced search (regex, full-text)
- Export / Import encryption (PGP, age integration)
- Dashboard analytics (usage trends, rotation compliance)
- Webhooks / event stream (secret updated/rotated)

---

## 19. Contributing (Internal)

1. Branch naming: `feat/`, `fix/`, `chore/`
2. PR includes: description, testing notes, screenshots for UI
3. Run lint before commit

---

## 20. License

(Define internal / MIT / proprietary here.)

---

## 21. Quick Command Reference

```
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Reset master password hash (dev script suggestion)
node backend/resetMasterPassword.js
```

---

**Status:** Active development. See roadmap for planned enhancements.
