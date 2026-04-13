# Software Engineering Take-Home Project: Customer Pipeline Tracker

**Time Estimate:** 2-4 hours  
**Submission:** GitHub repo + 30-min walkthrough call

---

## The Challenge

Build a simple CRM pipeline tracker. Customers move through stages as they progress from lead to closed deal.

### Pipeline Stages

1. **Lead** — Initial contact info captured
2. **Contacted** — Reached out to the customer
3. **Qualified** — Confirmed they're a good fit
4. **Trial/Demo** — Scheduled or completed a demo
5. **Closed** — Won or lost

---

## Choose Your Focus

Pick the track that plays to your strengths:

| Track | What You'll Build |
|-------|-------------------|
| **Frontend** | Build the UI. Mock the data or use a simple JSON file. |
| **Backend** | Build the API and database. No UI required — Postman/curl is fine. |
| **Fullstack** | Build both. Doesn't need to be polished — just functional. |

All tracks are weighted equally. We'd rather see something done well than everything done halfway.

---

## Requirements

### If you choose Frontend:

1. Display customers organized by pipeline stage (kanban board, table, or list — your call)
2. Add a new customer (name, email, company, stage)
3. Move a customer between stages
4. Basic filtering or search (by name, company, or stage)

**Tech:** Use whatever you're comfortable with — React, Vue, vanilla JS, etc.

**Data:** Mock it however you want — hardcoded JSON, local storage, or a fake API.

### If you choose Backend:

1. REST API with full CRUD for customers
2. Endpoint to move a customer to a new stage (should track when they moved)
3. Endpoint to list customers, filterable by stage
4. Data persistence (SQLite is fine)

**Tech:** Use whatever you're comfortable with — Node/Express, Python/FastAPI, Go, etc.

### If you choose Fullstack:

Build both of the above. Keep it simple — we're looking for it to work end-to-end, not be production-ready.

---

## Data Model (minimum)

You can extend this, but at minimum:

- **Customer** — id, name, email, company, stage, created_at, updated_at

Bonus if you track stage history (when did they move from Lead → Contacted?), but not required.

---

## Deliverables

1. **Code** — Clean, readable code with comments explaining key decisions
2. **README** — Brief doc covering:
   - Which track you chose and why
   - How to run it
   - What you'd improve with more time
3. **Demo evidence** — Screenshots, screen recording, or example API requests showing it works

---

## What We're Looking For

| Track | We're Evaluating |
|-------|------------------|
| **Frontend** | Component structure, state management, UI/UX decisions |
| **Backend** | API design, data modeling, error handling |
| **Fullstack** | How you connect the pieces, tradeoffs you made |

**For everyone:** Code quality, communication in your README, product thinking.

---

## Not Required (But Nice to Have)

- Stage change history/audit log
- Drag-and-drop between stages
- Authentication
- Tests
- Deployment

---

## Notes for the Walkthrough Call

Come prepared to:

1. Demo what you built (live or screen share)
2. Walk through your code and explain key decisions
3. Discuss tradeoffs — what would you do differently with more time?
4. Talk through how you'd build the parts you didn't build

---

**Questions?** Email [YOUR EMAIL] before starting.
