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
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Team
- Person A — Backend
- Person B — Frontend