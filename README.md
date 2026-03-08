# Lumière Bistro — Restaurant Seat Booking

A full-stack restaurant booking website with seat reservations, menu display, reviews, and Stripe + UPI payment support.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, shadcn/ui, React Router
- **Backend**: FastAPI (Python), MongoDB (Motor async driver)
- **Payments**: Stripe Checkout + UPI

---

## Project Structure

```
├── backend/
│   ├── server.py          # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/         # HomePage, AdminDashboard, PaymentSuccess
│   │   ├── components/    # BookingDialog, UI components
│   │   └── App.js
│   └── .env.example
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Fill in your values
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend
cp .env.example .env           # Set REACT_APP_BACKEND_URL
yarn install
yarn start
```

---

## Deployment Options

### Option 1 — Railway (Easiest)

**Backend:**
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Root directory: `backend/`
3. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add a MongoDB plugin → copy the `MONGO_URL`
5. Add all env vars from `.env.example`

**Frontend:**
1. New Service → same repo, root directory `frontend/`
2. Build command: `yarn build`, publish: `build/`
3. Set `REACT_APP_BACKEND_URL` to your backend Railway URL

### Option 2 — Render

**Backend (Web Service):**
- Root: `backend/` | Build: `pip install -r requirements.txt`
- Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Add env vars

**Frontend (Static Site):**
- Root: `frontend/` | Build: `yarn build` | Publish: `build`
- Set `REACT_APP_BACKEND_URL`

### Option 3 — Vercel (Frontend) + Render (Backend)

Frontend auto-deploys on Vercel (detects Create React App). Add `REACT_APP_BACKEND_URL` in Vercel settings.

### Option 4 — Docker / VPS

Add a `Dockerfile` to `backend/`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

Add a `Dockerfile` to `frontend/`:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

---

## Stripe Webhook Setup

After deploying, register in [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
- Endpoint: `https://your-backend.com/api/webhook/stripe`
- Event: `checkout.session.completed`
- Copy signing secret → set as `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

### Backend
| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `STRIPE_API_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CORS_ORIGINS` | Allowed origins (comma-separated) |
| `RESTAURANT_NAME` | Restaurant display name |
| `RESTAURANT_WHATSAPP` | WhatsApp number with country code |
| `UPI_ID` | UPI payment ID |

### Frontend
| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Full URL of deployed backend |

---

## Admin Access

Visit `/admin`. Default password: `admin123`

> ⚠️ Change `ADMIN_PASSWORD_HASH` in `server.py` before going to production.
