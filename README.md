# TransitOps

A centralized transport operations platform for managing vehicle registry, driver profiles, trip dispatching, maintenance, and fuel/expense tracking — with role-based access control and real-time fleet analytics.

Built for the TransitOps hackathon challenge (8-hour build).

## Features
- Secure login with JWT-based Role-Based Access Control (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
- Vehicle Registry & Driver Management (CRUD)
- Trip lifecycle management with automated business rule validation (capacity checks, license expiry, status transitions)
- Maintenance workflow with automatic vehicle status updates
- Fuel & expense logging with automated cost calculation
- Dashboard with live KPIs and filters
- Reports & analytics (fuel efficiency, fleet utilization, operational cost, ROI)
- CSV export

## Tech Stack
**Backend:** FastAPI, PostgreSQL (Supabase), SQLAlchemy, JWT Auth
**Frontend:** React, React Router, Axios, Chart.js

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL and JWT_SECRET
uvicorn main:app --reload
```

Required backend env vars (see `backend/.env.example`):
- `DATABASE_URL` — Postgres connection string (Supabase or local)
- `JWT_SECRET` — random secret used to sign JWTs
- `JWT_ALGORITHM` — defaults to `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` — defaults to `60`

Run `backend/schema.sql` against your Postgres/Supabase database before starting the server.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # defaults to http://localhost:8000, adjust if needed
npm start
```

Required frontend env var (see `frontend/.env.example`):
- `REACT_APP_API_URL` — base URL of the backend API

## Roles & Permissions

| Role | Fleet | Drivers | Trips | Maintenance | Fuel & Expenses | Analytics |
|---|---|---|---|---|---|---|
| Fleet Manager | Full | View | — | Full | — | — |
| Dispatcher | — | View | Full | — | — | — |
| Safety Officer | — | Full | — | — | — | View |
| Financial Analyst | View | — | — | — | Full | Full |

Dashboard is visible to all roles. Settings is Fleet Manager only. This matrix is the single source of truth in `frontend/src/permissions.js` and mirrors the Screen 8 (Settings & RBAC) mockup.

## Team
- Person A — Backend
- Person B — Frontend