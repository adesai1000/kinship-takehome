# Customer Pipeline Tracker

Take-home for Kinship. Fullstack CRM pipeline — customers move through Lead → Contacted → Qualified → Trial/Demo → Closed.

## Track

**Fullstack** — Next.js frontend + Express backend, Supabase for auth and storage.

## Structure

```
client/   Next.js app
api/      Express REST API
```

## What's built

**Frontend**
- Kanban board across all five stages
- Add, edit, delete customers
- Drag and drop between stages
- Search by name, company, or email; filter by stage

**Backend**
- `GET /api/customers?stage=` — list customers, optional stage filter
- `POST /api/customers` — create
- `PUT /api/customers/:id` — update fields
- `PATCH /api/customers/:id/stage` — move stage (records history)
- `DELETE /api/customers/:id` — delete

Every stage move gets logged to `stage_history`, so there's a full audit trail per customer — not just the last move.

## Running it

**1. Supabase**

Create a project, run `supabase/schema.sql` in the SQL editor, enable anonymous sign-ins under Authentication → Providers.

**2. API**

```bash
cd api
cp .env.example .env   # add SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev            # http://localhost:3001
```

**3. Frontend**

```bash
cd client
cp .env.local.example .env.local   # add Supabase URL + anon key
npm install
npm run dev                        # http://localhost:3000
```

The header badge shows **API live** when both are running, **Local fallback** otherwise.

## Auth

Frontend signs in anonymously via Supabase, gets a JWT, sends it as `Authorization: Bearer` on every API request. Express validates it with Supabase, pulls the user ID, and scopes all queries to that user. The service role key never leaves the backend.

## What I'd add with more time

- Stage history timeline on each customer card
- Real accounts instead of anonymous auth
- Tests for the API routes and drag-and-drop
- Deployment setup (Railway for the API, Vercel for the frontend)
