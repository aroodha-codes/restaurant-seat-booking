# Lumiere Bistro - Restaurant Management System

Full-stack restaurant management web app with reservations, WhatsApp ordering, UPI/card payment flow, and an admin dashboard.

Live demo: `https://lumiere-bistro.netlify.app`

## Key Features

- Hardcopy-style compact menu UI with category tabs and search.
- Cart + WhatsApp ordering flow (orders are stored in backend before WhatsApp open).
- Table booking flow with card/UPI/WhatsApp options.
- Admin dashboard for orders, bookings, and menu CRUD.
- Reviews and restaurant config endpoints.
- Mobile-first responsive UI.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI, Motor, Pydantic |
| Database | MongoDB Atlas |
| Payments | UPI and Stripe Checkout |
| Deployment | Netlify (frontend), Render (backend) |

## Project Structure

```text
restaurant-clean/
|- backend/
|  |- server.py
|  |- requirements.txt
|  |- runtime.txt
|  |- .env.example
|  `- tests/
|- frontend/
|  |- src/
|  |  |- pages/
|  |  |- components/
|  |  `- lib/
|  |- package.json
|  |- .env.example
|  `- netlify.toml
`- README.md
```

## Local Setup

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Notes:
- If `REACT_APP_BACKEND_URL` is not set, frontend falls back to `http://localhost:8001`.
- Backend root health endpoint is available at `/`.

## Deployment

### Render Backend

Start command:

```bash
uvicorn server:app --host 0.0.0.0 --port $PORT
```

Required backend env vars:

| Variable | Example |
|---|---|
| `MONGO_URL` | `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/restaurant_db?retryWrites=true&w=majority&appName=Cluster0` |
| `DB_NAME` | `restaurant_db` |
| `CORS_ORIGINS` | `https://lumiere-bistro.netlify.app` |
| `RESTAURANT_NAME` | `Lumiere Bistro` |
| `RESTAURANT_WHATSAPP` | `919876543210` |
| `UPI_ID` | `yourupi@bank` |
| `STRIPE_API_KEY` | optional |
| `STRIPE_WEBHOOK_SECRET` | optional |

Atlas checklist:
- Add network access (for testing, `0.0.0.0/0`).
- Ensure DB user has access to `restaurant_db`.

### Netlify Frontend

Build settings:
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/build`

Frontend env var:

| Variable | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | your Render backend URL |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/menu` | Fetch menu |
| POST | `/api/menu` | Create menu item |
| PUT | `/api/menu/{id}` | Update menu item |
| DELETE | `/api/menu/{id}` | Delete menu item |
| GET | `/api/bookings` | Fetch bookings |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/{id}` | Update booking |
| DELETE | `/api/bookings/{id}` | Delete booking |
| GET | `/api/orders` | Fetch orders |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/{id}` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order |
| GET | `/api/reviews` | Fetch reviews |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/config` | Restaurant config |

## Admin Access

Route: `/admin`

Default password: `admin123`

Before production:
- Change `ADMIN_PASSWORD_HASH` in `backend/server.py`.

## License

MIT