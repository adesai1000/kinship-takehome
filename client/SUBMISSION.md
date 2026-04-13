# Ayush Desai - Customer Pipeline Tracker

## Current Direction

This repo is being used as the starting point for the fullstack version of the take-home.

The current milestone is the frontend:

- customer pipeline UI
- Supabase-backed persistence using the existing base project setup
- local fallback when Supabase is not configured

The next milestone is adding an Express backend that owns the customer API and talks to Supabase behind the scenes.

## What’s Working Now

- Five pipeline stages:
  - `Lead`
  - `Contacted`
  - `Qualified`
  - `Trial / Demo`
  - `Closed`
- Add customer
- Edit customer
- Delete customer
- Drag customers between stages
- Search by name, company, or email
- Filter by stage
- Anonymous Supabase session and per-user data when configured

## Data Model

Current frontend and Supabase schema use:

- `id`
- `name`
- `email`
- `company`
- `stage`
- `notes`
- `stage_changed_at`
- `created_at`
- `updated_at`

`notes` and `stage_changed_at` go a bit beyond the minimum spec, but they help the UI now and set up the later backend work cleanly.

## Next Backend Step

The next phase is to introduce an Express API with endpoints for:

- full customer CRUD
- moving a customer between stages
- listing customers with stage filtering

That backend will become the main application interface, while Supabase remains the persistence layer underneath.
