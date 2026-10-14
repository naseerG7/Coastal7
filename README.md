# E-Commerce Frontend — Day 11

React frontend for the Day 10 FastAPI e-commerce backend.

## Day 11 topics covered

- React components and JSX
- Props and component composition
- Conditional rendering
- List rendering
- `useState`
- `useEffect`
- Controlled forms and event handling
- React Router
- Nested routes and `Outlet`
- `useParams`
- `useNavigate`
- Axios service layer
- Axios request/response interceptors
- JWT authentication
- Protected routes
- FastAPI integration
- Product CRUD
- Product image upload
- Final frontend/backend integration

## Start in VS Code

Open this folder in VS Code.

Open a terminal:

```powershell
npm install
npm run dev
```

Vite normally uses `http://localhost:5173/`. If that port is busy, it may use another port such as `5174`.

## Backend

The frontend expects FastAPI at:

```text
http://127.0.0.1:8000
```

Start the Day 10 backend separately:

```powershell
cd "C:\Users\nasee\OneDrive\Desktop\DOWNLOADS\ecommerce_backend_day10_phase1\ecommerce_backend"
& ..\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

Verify:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/products/
```

## Main pages

- `/` — Home
- `/register` — Registration
- `/login` — Login
- `/products` — Product list
- `/products/:productId` — Product details
- `/dashboard` — Protected dashboard
- `/dashboard/profile` — Current user
- `/dashboard/products` — Product CRUD and image upload

## Important

Login stores the JWT in `localStorage` under:

```text
access_token
```

Axios automatically sends it as:

```text
Authorization: Bearer <token>
```

The Day 10 backend CORS configuration must allow the frontend origin (for example `http://localhost:5173` or `http://localhost:5174`).
