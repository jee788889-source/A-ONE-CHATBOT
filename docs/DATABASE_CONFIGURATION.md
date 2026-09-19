# Database & Environment Configuration Technical Note

## Overview
This document clarifies the database connections and environment variable precedence for Localhost development and Production deployments (Hostinger / Netlify / Docker).

---

### 1. Environment Variable Precedence
Next.js App Router loads environment variables in the following priority order:
1. **System Environment Variables** (Hostinger Cloud / Netlify panel / Docker ENV)
2. **`.env.local`** (Local machine overrides — ignored by Git)
3. **`.env`** (Base production & default config)
4. **`.env.example`** (Committed reference template)

---

### 2. Database & Supabase Mapping

| Setting | Localhost (`.env.local`) | Production (`.env` / Hostinger) |
| :--- | :--- | :--- |
| **Project Ref** | `ydjpujhmhfkwfmjidypd` (Supabase) | `ydjpujhmhfkwfmjidypd` (Supabase) |
| **Database Type** | PostgreSQL 15+ (Pooled) | PostgreSQL 15+ (Pooled / Direct) |
| **Variable Name (`DATABASE_URL`)** | `DATABASE_URL` (Port 6543 / Pooler) | `DATABASE_URL` (Port 6543 / Pooler) |
| **Variable Name (`DIRECT_DATABASE_URL`)** | `DIRECT_DATABASE_URL` (Port 5432) | `DIRECT_DATABASE_URL` (Port 5432) |
| **Shared Database?** | **YES** — Both localhost and production target the central Supabase PostgreSQL project instance. |

---

### 3. Connection Resilience Architecture
- **Automatic Fallback Store**: When external network latency, IPv6/DNS restrictions, or database cold-start pauses occur, the application utilizes zero-downtime in-memory fallback stores (`settings-store`, `customer-store`, `order-store`, `menu-store`).
- **Clean State**: All fallback stores are initialized to a **100% clean state** (0 demo customers, 0 demo orders, 0 demo conversations).
- **Customer Creation Guarantee**: Customer records are only created when a real WhatsApp message arrives or when staff manually creates an order.
