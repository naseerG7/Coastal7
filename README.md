# E-Commerce Website — Day 10 + Day 11

This is the combined project:

- **Day 10:** FastAPI + PostgreSQL backend
- **Day 11:** React + Axios frontend

The browser application communicates with FastAPI through Axios.

## Project structure

```text
ecommerce_day10_day11/
├── backend/
│   ├── app/
│   ├── uploads/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 1. PostgreSQL

Create a database named:

```text
ecommerce
```

The backend expects PostgreSQL to be available locally.

## 2. Backend setup

Open a PowerShell terminal in the `backend` folder:

```powershell
cd backend
```

Create/activate your virtual environment if needed:

```powershell
python -m venv ..\venv
& ..\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create `.env` from `.env.example` and put your PostgreSQL password in `DATABASE_URL`.

Example:

```text
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/ecommerce
SECRET_KEY=change-this-secret-key
```

Start FastAPI:

```powershell
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

Products API:

```text
http://127.0.0.1:8000/products/
```

## 3. Frontend setup

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173/
```

If port 5173 is already in use, Vite may choose:

```text
http://localhost:5174/
```

## 4. What is connected

```text
React
  ↓
Axios
  ↓
FastAPI
  ↓
SQLAlchemy async
  ↓
PostgreSQL
```

Authentication:

```text
Register
  ↓
POST /auth/register
  ↓
Login
  ↓
POST /auth/login
  ↓
JWT
  ↓
localStorage
  ↓
Axios interceptor
  ↓
Authorization: Bearer <JWT>
  ↓
GET /auth/me
```

Products:

```text
React Products
  ↓
GET /products/
  ↓
FastAPI
  ↓
PostgreSQL
```

Product management:

```text
Create → POST /products/
Read   → GET /products/
Update → PUT /products/{id}
Delete → DELETE /products/{id}
Image  → POST /products/{id}/image
```

## 5. Day 11 pages

- `/`
- `/register`
- `/login`
- `/products`
- `/products/:productId`
- `/dashboard`
- `/dashboard/profile`
- `/dashboard/products`

## Important

The uploaded Day 10 ZIP was a partially scaffolded backend. This combined package wires the completed authentication and product-management pieces needed by the Day 11 frontend.

The scaffolded Redis cart, order-processing, Celery email, and WebSocket files from that upload are retained in `backend/app/`, but they are not exposed as working endpoints in this combined package yet.
