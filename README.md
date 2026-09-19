# A-ONE Restaurant — Private WhatsApp Chatbot & Staff Management Portal

Production-ready private restaurant operations platform built exclusively for **A-ONE Restaurant** ([Instagram Reference](https://www.instagram.com/aone_foods/)).

---

## 🚀 System Overview

This system is an **Owner-Controlled Private Restaurant Operations & WhatsApp Chatbot Platform**.
It is **NOT a public SaaS**. Only authorized A-ONE Restaurant staff and the Owner can access it.

### Core Features

1. **Owner-Controlled RBAC (No Public Registration)**
   - Role tiers: `OWNER` (Super Admin), `MANAGER`, `STAFF`.
   - Protected Owner identity (`OWNER_EMAIL`) enforced server-side.
   - Owner can add, invite, change roles, enable/disable, and remove staff members.
   - Public registration is permanently disabled.

2. **WhatsApp Cloud API Integration & 3-Pane Live Inbox**
   - Webhook with idempotency protection and SHA-256 HMAC signature verification.
   - Interactive ordering workflow: Browse dishes $\to$ Add to cart $\to$ Delivery/Pickup address $\to$ Confirmation.
   - Live 3-pane WhatsApp inbox with real-time multi-staff responses and customer context.

3. **Grounded Multi-Lingual AI Assistant**
   - Multi-lingual intelligence: English, Urdu (اردو), and Roman Urdu.
   - Strict Zero-Hallucination Guardrails: dynamically injected menu, prices, and business hours.
   - Never invents prices or dishes.

4. **Kitchen Order Workflow Management**
   - Live status pipeline: `NEW` $\to$ `CONFIRMED` $\to$ `PREPARING` $\to$ `READY` $\to$ `OUT_FOR_DELIVERY` $\to$ `COMPLETED` / `CANCELLED`.
   - Real-time kitchen queue with print slip support and staff assignment.

5. **Menu & Pricing Management**
   - Categories and items management with Urdu names, descriptions, and preparation times.
   - In-stock / Out-of-stock kitchen availability toggles.

6. **Security & Audit Logs**
   - Immutable audit logging of all staff logins, order updates, menu edits, and system changes.

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your database URL (`DATABASE_URL`), `OWNER_EMAIL`, and API keys.

### 3. Initialize Database & Seed
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and sign in via `/login`.

---

## 🐳 Docker Deployment

```bash
docker compose up -d --build
```

---

## 🔒 Production Verification Checklist

- [x] Public registration disabled (403).
- [x] Owner-controlled staff account management.
- [x] Server-side owner protection (`OWNER_EMAIL`).
- [x] WhatsApp Cloud API webhook with idempotency.
- [x] Zero foreign or sample company credentials.
- [x] All data models and interfaces branded exclusively for A-ONE Restaurant.
