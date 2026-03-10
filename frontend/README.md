# Lumière Bistro — Restaurant Management System

A full-stack restaurant management web app with table reservations, WhatsApp food ordering, menu management, customer reviews, UPI payments, and a complete admin dashboard.

🔗 **Live Demo:** [lumiere-bistro.netlify.app](https://lumiere-bistro.netlify.app)

---

## Features

- 🍽️ **WhatsApp Food Ordering** — cart system with quantity controls, order saved to DB and sent to restaurant WhatsApp
- 📅 **Table Reservations** — book seats with date, time, guest count and special requests
- 💳 **UPI Payments** — deposit payment for bookings with admin verification
- 📋 **Admin Dashboard** — manage orders (confirm/ready/cancel), bookings, and menu in real time
- ⭐ **Customer Reviews** — display and manage reviews
- 📱 **Fully Responsive** — works on mobile and desktop

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Framer Motion, React Router |
| Backend | FastAPI (Python 3.11), Motor (async MongoDB) |
| Database | MongoDB Atlas |
| Payments | UPI + Stripe Checkout |
| Deployment | Netlify (frontend) + Render (backend) |

---

## Project Structure

```
├── backend/
│   ├── server.py          # FastAPI app
│   ├── requirements.txt
│   ├── runtime.txt        # python-3.11.0
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js        # Menu, cart, WhatsApp ordering
│   │   │   ├── AdminDashboard.js  # Orders, bookings, menu management
│   │   │   └── PaymentSuccess.js
│   │   ├── components/
│   │   │   └── BookingDialog.js
│   │   └── App.js
│   ├── netlify.toml
│   └── .env.example
```

---

## Deployment

### Backend → Render (Web Service)

1. New Web Service → connect GitHub repo
2. Root directory: `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:

| Variable | Value |
|---|---|
| `MONGO_URL` | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0` |
| `DB_NAME` | `restaurant_db` |
| `CORS_ORIGINS` | `https://your-site.netlify.app` |
| `RESTAURANT_NAME` | `Lumière Bistro` |
| `RESTAURANT_WHATSAPP` | `919876543210` |
| `UPI_ID` | `yourupi@bank` |
| `STRIPE_API_KEY` | `sk_test_...` (optional) |
| `STRIPE_WEBHOOK_SECRET` | (optional) |

### Frontend → Netlify (Static Site)

1. New site → connect GitHub repo
2. Base directory: `frontend/`
3. Build command: `npm run build`
4. Publish directory: `frontend/build`
5. Add environment variable:

| Variable | Value |
|---|---|
| `REACT_APP_BACKEND_URL` | `https://your-backend.onrender.com` |

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in values
uvicorn server:app --reload --port 8001
```

### Frontend
```bash
cd frontend
cp .env.example .env        # set REACT_APP_BACKEND_URL=http://localhost:8001
npm install --legacy-peer-deps
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/menu` | Get all menu items |
| POST | `/api/menu` | Add menu item |
| PUT | `/api/menu/{id}` | Update menu item |
| DELETE | `/api/menu/{id}` | Delete menu item |
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/{id}` | Update booking status |
| DELETE | `/api/bookings/{id}` | Delete booking |
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Save WhatsApp order |
| PATCH | `/api/orders/{id}` | Update order status |
| DELETE | `/api/orders/{id}` | Delete order |
| GET | `/api/reviews` | Get all reviews |
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/config` | Restaurant config |
| POST | `/api/payment/upi/verify` | Submit UPI payment |
| POST | `/api/admin/upi/confirm` | Confirm UPI payment |

---

## Admin Dashboard

Visit `/admin` — Default password: `admin123`

> ⚠️ Change `ADMIN_PASSWORD_HASH` in `server.py` before going to production.

**Tabs:**
- 📦 **Orders** — view WhatsApp orders, confirm / mark ready / cancel (shows pending count badge)
- 📅 **Bookings** — manage reservations, verify UPI payments
- 🍴 **Menu** — add, edit, delete menu items

---

## WhatsApp Ordering Flow

```
Customer adds items to cart
        ↓
Enters name + phone number
        ↓
Clicks "Order via WhatsApp"
        ↓
Order saved to MongoDB
        ↓
WhatsApp opens with pre-filled message
        ↓
Restaurant confirms the order in admin dashboard
```

---

## Notes

- Render free tier sleeps after inactivity — first request may take 30–60s to wake up
- Stripe is invite-only in India — UPI is the primary payment method
- MongoDB Atlas free tier (M0) is sufficient for this app

---

## License

MIT