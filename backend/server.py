from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import stripe
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime, timezone
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsInsecure=True)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD_HASH = hashlib.sha256("admin123".encode()).hexdigest()

class BookingCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    date: str
    time: str
    guests: int
    special_requests: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    date: str
    time: str
    guests: int
    special_requests: Optional[str] = None
    created_at: str
    status: str = "pending"
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    is_popular: bool = False

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    is_popular: bool = False

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_name: str
    rating: int
    comment: str
    date: str

class AdminLogin(BaseModel):
    password: str

class PaymentRequest(BaseModel):
    booking_id: str
    origin_url: str

class BookingUpdate(BaseModel):
    status: Optional[str] = None

# --- Order Models ---
class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    qty: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    total: float
    notes: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_name: str
    customer_phone: str
    items: List[dict]
    total: float
    notes: Optional[str] = None
    status: str = "pending"
    created_at: str

class OrderStatusUpdate(BaseModel):
    status: str


@api_router.get("/")
async def root():
    return {"message": "Lumière Bistro API"}

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    if not booking.name or not booking.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not booking.phone or not booking.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not booking.date or not booking.date.strip():
        raise HTTPException(status_code=400, detail="Date is required")
    if not booking.time or not booking.time.strip():
        raise HTTPException(status_code=400, detail="Time is required")
    if booking.guests < 1 or booking.guests > 50:
        raise HTTPException(status_code=400, detail="Number of guests must be between 1 and 50")

    try:
        booking_date = datetime.strptime(booking.date, '%Y-%m-%d').date()
        if booking_date < datetime.now(timezone.utc).date():
            raise HTTPException(status_code=400, detail="Booking date cannot be in the past")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    booking_dict = booking.model_dump()
    booking_dict['id'] = f"BK{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    booking_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    booking_dict['status'] = 'pending'
    booking_dict['payment_status'] = 'pending'
    booking_dict['payment_session_id'] = None

    await db.bookings.insert_one(booking_dict)
    result = await db.bookings.find_one({"id": booking_dict['id']}, {"_id": 0})
    return result

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings

@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, update: BookingUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.bookings.update_one({"id": booking_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated_booking

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking deleted successfully"}

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    if not menu_items:
        default_menu = [
            {"id": "M001", "name": "Truffle Risotto", "description": "Creamy Arborio rice with black truffle shavings, parmesan, and wild mushrooms", "price": 850.00, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1764397514747-8272f2da3f36?w=400", "is_popular": True},
            {"id": "M002", "name": "Seared Scallops", "description": "Pan-seared scallops with cauliflower purée and crispy pancetta", "price": 950.00, "category": "Starters", "image_url": "https://images.pexels.com/photos/9659592/pexels-photo-9659592.jpeg?w=400", "is_popular": False},
            {"id": "M003", "name": "Grilled Octopus", "description": "Tender octopus with smoked paprika, lemon, and roasted potatoes", "price": 750.00, "category": "Starters", "image_url": "https://images.unsplash.com/photo-1764397514747-8272f2da3f36?w=400", "is_popular": True},
            {"id": "M004", "name": "Wagyu Beef Tenderloin", "description": "8oz tenderloin with truffle mash, seasonal vegetables, and red wine jus", "price": 1850.00, "category": "Mains", "image_url": "https://images.pexels.com/photos/19119934/pexels-photo-19119934.jpeg?w=400", "is_popular": True},
            {"id": "M005", "name": "Wild Salmon Fillet", "description": "Pan-roasted salmon with asparagus, dill cream, and lemon butter", "price": 1250.00, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1748012199657-3f34292cdf70?w=400", "is_popular": False},
            {"id": "M006", "name": "Duck Confit", "description": "Slow-cooked duck leg with cherry glaze, sweet potato, and brussels sprouts", "price": 1150.00, "category": "Mains", "image_url": "https://images.pexels.com/photos/9659592/pexels-photo-9659592.jpeg?w=400", "is_popular": True},
            {"id": "M007", "name": "Lobster Linguine", "description": "Fresh linguine with lobster meat, cherry tomatoes, and garlic butter", "price": 1450.00, "category": "Mains", "image_url": "https://images.unsplash.com/photo-1748012199657-3f34292cdf70?w=400", "is_popular": True},
            {"id": "M008", "name": "Chocolate Fondant", "description": "Warm chocolate lava cake with vanilla ice cream and berry coulis", "price": 450.00, "category": "Desserts", "image_url": "https://images.pexels.com/photos/9659592/pexels-photo-9659592.jpeg?w=400", "is_popular": True},
            {"id": "M009", "name": "Crème Brûlée", "description": "Classic vanilla custard with caramelized sugar crust", "price": 350.00, "category": "Desserts", "image_url": "https://images.unsplash.com/photo-1764397514747-8272f2da3f36?w=400", "is_popular": False},
            {"id": "M010", "name": "Tiramisu", "description": "Italian classic with espresso-soaked ladyfingers and mascarpone", "price": 400.00, "category": "Desserts", "image_url": "https://images.pexels.com/photos/9659592/pexels-photo-9659592.jpeg?w=400", "is_popular": True}
        ]
        await db.menu_items.insert_many(default_menu)
        return default_menu
    return menu_items

@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate):
    item_dict = item.model_dump()
    item_dict['id'] = f"M{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    await db.menu_items.insert_one(item_dict)
    result = await db.menu_items.find_one({"id": item_dict['id']}, {"_id": 0})
    return result

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, item: MenuItemCreate):
    item_dict = item.model_dump()
    result = await db.menu_items.update_one({"id": item_id}, {"$set": item_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    updated_item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return updated_item

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted successfully"}

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).to_list(1000)
    if not reviews:
        default_reviews = [
            {"id": "R001", "customer_name": "Sarah Mitchell", "rating": 5, "comment": "Absolutely divine experience. The truffle risotto was perfection, and the ambiance made our anniversary unforgettable.", "date": "2024-12-15"},
            {"id": "R002", "customer_name": "James Anderson", "rating": 5, "comment": "Best fine dining in the city. The wagyu tenderloin melted in my mouth. Service was impeccable.", "date": "2024-12-20"},
            {"id": "R003", "customer_name": "Emily Chen", "rating": 5, "comment": "Every dish is a work of art. The attention to detail in both food and atmosphere is remarkable.", "date": "2024-12-28"},
            {"id": "R004", "customer_name": "Marcus Thompson", "rating": 4, "comment": "Wonderful evening with exceptional food. The wine pairing recommendations were spot on.", "date": "2025-01-05"},
            {"id": "R005", "customer_name": "Sophie Laurent", "rating": 5, "comment": "Reminds me of Michelin-starred restaurants in Paris. Lumière has my heart!", "date": "2025-01-10"},
            {"id": "R006", "customer_name": "David Kim", "rating": 5, "comment": "The chocolate fondant alone is worth the visit. Romantic, intimate, and absolutely delicious.", "date": "2025-01-12"}
        ]
        await db.reviews.insert_many(default_reviews)
        return default_reviews
    return reviews

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    password_hash = hashlib.sha256(credentials.password.encode()).hexdigest()
    if password_hash == ADMIN_PASSWORD_HASH:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid password")

# --- Orders Endpoints ---
@api_router.post("/orders")
async def create_order(order: OrderCreate):
    order_dict = order.model_dump()
    order_dict['id'] = f"ORD{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')[:18]}"
    order_dict['created_at'] = datetime.now(timezone.utc).isoformat()
    order_dict['status'] = 'pending'
    await db.orders.insert_one(order_dict)
    result = await db.orders.find_one({"id": order_dict['id']}, {"_id": 0})
    return result

@api_router.get("/orders")
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.patch("/orders/{order_id}")
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": update.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

@api_router.get("/config")
async def get_config():
    return {
        "restaurant_whatsapp": os.environ.get('RESTAURANT_WHATSAPP', '919876543210'),
        "currency": "INR",
        "deposit_amount": 500,
        "upi_id": os.environ.get('UPI_ID', 'lumierebistro@paytm'),
        "restaurant_name": os.environ.get('RESTAURANT_NAME', 'Lumiere Bistro')
    }

@api_router.post("/payment/upi/verify")
async def verify_upi_payment(request: Dict):
    booking_id = request.get('booking_id')
    utr_number = request.get('utr_number', '')
    if not booking_id:
        raise HTTPException(status_code=400, detail="Booking ID is required")
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    upi_payment = {
        "booking_id": booking_id,
        "utr_number": utr_number,
        "amount": 500.00,
        "currency": "INR",
        "payment_method": "UPI",
        "status": "pending_verification",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.upi_payments.insert_one(upi_payment)
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_status": "pending_verification", "payment_method": "UPI", "utr_number": utr_number}}
    )
    return {"success": True, "message": "UPI payment recorded. Admin will verify and confirm your booking shortly.", "booking_id": booking_id}

@api_router.post("/admin/upi/confirm")
async def confirm_upi_payment(request: Dict):
    booking_id = request.get('booking_id')
    if not booking_id:
        raise HTTPException(status_code=400, detail="Booking ID is required")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"payment_status": "paid", "status": "confirmed"}})
    await db.upi_payments.update_one({"booking_id": booking_id}, {"$set": {"status": "verified", "verified_at": datetime.now(timezone.utc).isoformat()}})
    return {"success": True, "message": "Payment confirmed"}

@api_router.post("/payment/create-checkout")
async def create_payment_checkout(payment_req: PaymentRequest, request: Request):
    booking = await db.bookings.find_one({"id": payment_req.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.get('payment_status') == 'paid':
        raise HTTPException(status_code=400, detail="Booking already paid")
    amount = 500.00
    currency = "inr"
    success_url = f"{payment_req.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payment_req.origin_url}/"
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    stripe.api_key = stripe_api_key
    metadata = {"booking_id": payment_req.booking_id, "customer_name": booking['name'], "booking_date": booking['date']}
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price_data": {"currency": currency, "product_data": {"name": "Restaurant Booking Deposit"}, "unit_amount": int(amount * 100)}, "quantity": 1}],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    payment_transaction = {"session_id": session.id, "booking_id": payment_req.booking_id, "amount": amount, "currency": currency, "payment_status": "pending", "created_at": datetime.now(timezone.utc).isoformat(), "metadata": metadata}
    await db.payment_transactions.insert_one(payment_transaction)
    await db.bookings.update_one({"id": payment_req.booking_id}, {"$set": {"payment_session_id": session.id}})
    return {"url": session.url, "session_id": session.id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    stripe.api_key = stripe_api_key
    session_obj = stripe.checkout.Session.retrieve(session_id)
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if transaction and transaction['payment_status'] != 'paid' and session_obj.payment_status == 'paid':
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}})
        await db.bookings.update_one({"id": transaction['booking_id']}, {"$set": {"payment_status": "paid", "status": "confirmed"}})
    return {"status": session_obj.status, "payment_status": session_obj.payment_status, "amount_total": session_obj.amount_total, "currency": session_obj.currency}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe API key not configured")
    stripe.api_key = stripe_api_key
    try:
        event = stripe.Webhook.construct_event(body, signature, webhook_secret) if webhook_secret else stripe.Event.construct_from(stripe.util.convert_to_stripe_object(stripe.util.json.loads(body), stripe_api_key, None), stripe_api_key)
        if event['type'] == 'checkout.session.completed':
            session_obj = event['data']['object']
            if session_obj.get('payment_status') == 'paid':
                session_id = session_obj['id']
                transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
                if transaction and transaction['payment_status'] != 'paid':
                    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}})
                    booking_id = session_obj.get('metadata', {}).get('booking_id')
                    if booking_id:
                        await db.bookings.update_one({"id": booking_id}, {"$set": {"payment_status": "paid", "status": "confirmed"}})
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
