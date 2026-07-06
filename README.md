<div align="center">

# 🏗️ Construction Industry Solutions

**Control sites, materials and contractors with confidence.**

A unified, multi-tenant construction management platform — Construction ERP · Project Management · Site Attendance · Material Tracking · Contractor Management — plus Tendering, Equipment, QHSE, Documents, Client Billing and Analytics. Every transaction flows into one **cost ledger**, so budget vs committed vs actual is live on every project, every day.

</div>

---

## ✨ What's inside

| # | Module | Highlights |
|---|--------|-----------|
| 1 | **Construction ERP** | Projects, budgets, procurement (Indent→RFQ→PO→GRN→Invoice→Payment), three‑way match, cost ledger |
| 2 | **Project Management** | WBS/tasks, milestones, physical progress, Daily Progress Reports (DPR) |
| 3 | **Site Attendance** | Geo‑tagged, selfie‑verified mobile attendance, musters, wage sheets, anti‑fraud flags |
| 4 | **Material Tracking** | Item master, site stock (weighted‑avg), indents, GRN, issues/consumption |
| 5 | **Contractor Mgmt** | Work Orders, digital Measurement Book, RA bills with auto retention/advance/GST/TDS |
| 6 | **Tendering & Estimation** | Opportunity pipeline, win/loss, estimate → project budget |
| 7 | **Plant & Equipment** | Fleet, daily log sheets, running hours, fuel, equipment cost posting |
| 8 | **Quality & Safety (QHSE)** | Inspections/checklists, NCR lifecycle, safety incidents |
| 9 | **Documents & Drawings** | Version‑controlled drawings, folders, statuses |
| 10 | **Client Billing & Finance** | Client RA bills, certification, receivables, DSO |
| 11 | **Reports & Analytics** | Role dashboards, exception alerts, standard report pack |

Plus a **Mobile Live** view proving the site‑app ⇆ office‑web sync (see below).

## 📱 Mobile activity tracked in the web app

Site actions (attendance, progress, indents) are captured on the mobile app and stream into the web app in real time. The **Mobile Live** page includes an in‑app simulator: tap an action on the phone mock and watch it appear in the office feed within seconds. Every mobile‑originated record is stamped `source = MOBILE` with GPS + device id and is visible across the web app (activity feed, attendance muster, DPR, indents). The REST API the simulator uses (`/api/mobile/*`) is the **same API the future Android/tablet apps will call**.

## 🧱 Tech stack

- **Next.js 14** (App Router) + **TypeScript** — one server for the premium web UI **and** the JSON REST API (mobile‑ready)
- **Prisma** ORM + **SQLite** (dev; portable to PostgreSQL for production)
- **Tailwind CSS** + **Framer Motion** (premium design system + animations), **Recharts**, **lucide-react**
- **JWT auth** (`jose` + bcrypt), permission‑matrix **RBAC**, per‑project data scoping, immutable audit trail
- **TanStack Query** + **Zod**

## 🚀 Getting started

Requires **Node.js 18+**.

```bash
# 1. Install dependencies
npm install

# 2. Generate the Prisma client, create the SQLite DB, and seed rich demo data
npm run setup

# 3. Run the app
npm run dev
```

Open the URL printed in the terminal (default http://localhost:3000). If 3000 is busy, run `npx next dev -p 3210`.

### Demo accounts

All demo accounts use password **`password123`**. The login screen has one‑tap buttons for each role.

| Role | Email |
|------|-------|
| Managing Director | `md@apexinfra.in` |
| Project Manager | `pm@apexinfra.in` |
| Site Engineer | `site@apexinfra.in` |
| Storekeeper | `store@apexinfra.in` |
| Billing / QS | `billing@apexinfra.in` |
| Accounts | `accounts@apexinfra.in` |
| HR / Time Office | `hr@apexinfra.in` |
| QHSE Officer | `qhse@apexinfra.in` |
| Administrator | `admin@apexinfra.in` |

Each role sees a different navigation and set of dashboards (RBAC), scoped to their assigned projects.

### Useful scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server |
| `npm run setup` | Generate client + reset DB + seed (one command) |
| `npm run db:seed` | Re‑seed demo data |
| `npm run db:reset` | Wipe + re‑seed |
| `npm run build` | Production build (type‑checks everything) |
| `npm run start` | Run the production build |

## 🏛️ Architecture notes

- **One cost ledger** (`CostLedgerEntry`) keyed by Project → BOQ item → Cost head holds `Budget | Committed | Actual` entries. POs/WOs post *Committed*; GRNs/issues/wages/RA bills post *Actual* (commitments are released via contra entries). This single ledger is what makes "all flows connected" true (SRS §7.7).
- **Connected flows** implemented: Procure‑to‑Pay (Indent→PO→GRN→Invoice), Store‑to‑Structure (Issue→consumption→cost), Attendance‑to‑Wages‑to‑Cost, and Subcontract WO→MB→RA‑bill→cost.
- **Security:** every request is authenticated (JWT cookie); queries are scoped by `tenantId` **and** project assignment server‑side; route access is checked per module in the app layout; financial docs carry an audit trail.
- **Portability:** the Prisma schema targets SQLite for zero‑setup dev. For production, point `DATABASE_URL` at PostgreSQL and change the datasource `provider` — the models are written to port cleanly. Money is rounded to 2 dp via a central helper.

## 🌿 Branching & contributing

This repo uses a protected **`main` + `develop`** model. **Never commit directly to `main` or `develop`.** Always branch from `develop`:

```bash
git checkout develop && git pull
git checkout -b feature/my-change develop
# …work… then open a PR into develop
```

See **[`BRANCHING_WORKFLOW.md`](./BRANCHING_WORKFLOW.md)** for the full checklist and **[`CLAUDE.md`](./CLAUDE.md)** for the rules Claude Code follows automatically.

## 🗺️ Status & roadmap

This is a working, seeded MVP+ covering all 11 modules with the core connected flows functional end‑to‑end and a premium UI. Known simplifications / next steps for full production hardening:

- Native offline‑first Android/tablet app (the API is ready; the web "Mobile Live" page simulates it today)
- Deeper write‑workflows with approval routing on every document (several are read‑rich today)
- Accounting connectors (Tally/Zoho), WhatsApp/e‑invoice/e‑way‑bill integrations
- File uploads to S3‑compatible storage (schema + Attachment model in place)
- Swap SQLite → PostgreSQL + read‑replica for analytics at scale

Built to the SRS *Construction Industry Solutions — Software Requirements Specification v1.0*.
