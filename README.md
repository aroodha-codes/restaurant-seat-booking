# Lumière Bistro — Restaurant Management System

A full-stack restaurant management web app with seat reservations, WhatsApp food ordering, menu management, reviews, UPI payment support, and an admin dashboard.

🔗 **Live Demo:** [lumiere-bistro.netlify.app](https://lumiere-bistro.netlify.app)

---

## Features

- 🍽️ **Food Ordering via WhatsApp** — customers add items to cart and send order directly to restaurant WhatsApp
- 📅 **Table Reservations** — book seats with date, time, and guest count
- 💳 **UPI Payments** — deposit payment for bookings via UPI
- 📋 **Admin Dashboard** — manage orders, bookings, and menu items in real time
- ⭐ **Reviews** — display customer reviews
- 📱 **Fully Responsive** — works on mobile and desktop

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python), Motor (async MongoDB driver) |
| Database | MongoDB Atlas |
| Payments | UPI + Stripe Checkout |
| Deployment | Netlify (frontend) + Render (backend) |

---

## Project Structure

```
├── backend/
│   ├── server.py          # FastAPI app (bookings, orders, menu, reviews, payments)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js        # Menu, cart, WhatsApp ordering, booking
│   │   │   ├── AdminDashboard.js  # Orders, bookings, menu management
│   │   │   └── PaymentSuccess.js  # Stripe success page
│   │   ├── components/
│   │   │   └── BookingDialog.js   # Table reservation dialog
│   │   └── App.js
│   ├── netlify.toml
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
cp .env.example .env           # Set REACT_APP_BACKEND_URL=http://localhost:8001
npm install
npm start
```

---

## Deployment

### Backend → Render (Web Service)
1. New Web Service → connect GitHub repo
2. Root directory: `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (see below)

### Frontend → Netlify (Static Site)
1. New site → connect GitHub repo
2. Base directory: `frontend/`
3. Build command: `npm run build`
4. Publish directory: `frontend/build`
5. Add `REACT_APP_BACKEND_URL` environment variable

---

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name |
| `STRIPE_API_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) |
| `RESTAURANT_NAME` | Restaurant display name |
| `RESTAURANT_WHATSAPP` | WhatsApp number with country code (e.g. `919876543210`) |
| `UPI_ID` | UPI payment ID |

### Frontend

| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Full URL of deployed backend |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Get all menu items |
| POST | `/api/menu` | Add menu item (admin) |
| GET | `/api/bookings` | Get all bookings (admin) |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/orders` | Get all orders (admin) |
| POST | `/api/orders` | Save a WhatsApp order |
| PATCH | `/api/orders/{id}` | Update order status |
| GET | `/api/reviews` | Get all reviews |
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/config` | Get restaurant config |

---

## Admin Dashboard

Visit `/admin` — Default password: `admin123`

> ⚠️ Change `ADMIN_PASSWORD_HASH` in `server.py` before going to production.

**Admin features:**
- 📦 **Orders tab** — view WhatsApp orders, confirm / mark ready / cancel
- 📅 **Bookings tab** — manage reservations, verify UPI payments
- 🍴 **Menu tab** — add, edit, delete menu items

---

## WhatsApp Ordering Flow

```
Customer browses menu
        ↓
Adds items to cart (with quantity controls)
        ↓
Enters name + phone number
        ↓
Clicks "Order via WhatsApp"
        ↓
Order saved to MongoDB
        ↓
WhatsApp opens with pre-filled order message
        ↓
Restaurant receives and confirms the order
```

---

## Screenshots

> Homepage, menu with cart, admin orders dashboard

---

## License

MIT