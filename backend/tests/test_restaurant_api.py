"""
Comprehensive backend tests for Restaurant Booking API
Tests: Bookings CRUD, Menu CRUD, Config, Payments (UPI), Admin functions
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = (
    os.environ.get('BACKEND_URL')
    or os.environ.get('REACT_APP_BACKEND_URL')
    or 'http://localhost:8001'
).rstrip('/')

# Test booking data with TEST_ prefix for cleanup
TEST_BOOKING = {
    "name": "TEST_John Smith",
    "phone": "+919876543210",
    "email": "test@example.com",
    "date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),  # Tomorrow
    "time": "19:00",
    "guests": 4,
    "special_requests": "Window seat, anniversary dinner"
}

TEST_MENU_ITEM = {
    "name": "TEST_Truffle Pasta",
    "description": "Fresh pasta with black truffle and parmesan",
    "price": 850.00,  # INR
    "category": "Mains",
    "image_url": "https://images.unsplash.com/photo-test",
    "is_popular": True
}


class TestConfigEndpoint:
    """Test /api/config endpoint for restaurant configuration"""
    
    def test_get_config(self):
        """Should return restaurant config with INR currency and UPI ID"""
        response = requests.get(f"{BASE_URL}/api/config")
        assert response.status_code == 200, f"Config endpoint failed: {response.text}"
        
        data = response.json()
        # Verify INR currency
        assert data.get("currency") == "INR", f"Currency should be INR, got {data.get('currency')}"
        # Verify deposit amount
        assert "deposit_amount" in data, "Config should include deposit_amount"
        assert data["deposit_amount"] == 500, f"Deposit should be 500 INR, got {data['deposit_amount']}"
        # Verify UPI ID exists
        assert "upi_id" in data, "Config should include upi_id"
        # Verify WhatsApp number
        assert "restaurant_whatsapp" in data, "Config should include restaurant_whatsapp"
        print(f"Config endpoint working: {data}")


class TestMenuEndpoints:
    """Test /api/menu CRUD endpoints"""
    
    def test_get_menu(self):
        """Should return list of menu items"""
        response = requests.get(f"{BASE_URL}/api/menu")
        assert response.status_code == 200, f"Menu GET failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Menu should return a list"
        assert len(data) > 0, "Menu should have at least one item"
        
        # Check structure of first item
        item = data[0]
        required_fields = ["id", "name", "description", "price", "category"]
        for field in required_fields:
            assert field in item, f"Menu item missing field: {field}"
        print(f"Menu has {len(data)} items")
    
    def test_menu_prices_are_numeric(self):
        """Menu prices should be numeric (for INR display)"""
        response = requests.get(f"{BASE_URL}/api/menu")
        data = response.json()
        
        for item in data:
            assert isinstance(item["price"], (int, float)), f"Price should be numeric: {item['name']}"
            assert item["price"] > 0, f"Price should be positive: {item['name']}"
    
    def test_create_menu_item(self):
        """Should create a new menu item"""
        response = requests.post(f"{BASE_URL}/api/menu", json=TEST_MENU_ITEM)
        assert response.status_code == 200, f"Menu POST failed: {response.text}"
        
        data = response.json()
        assert data["name"] == TEST_MENU_ITEM["name"]
        assert data["price"] == TEST_MENU_ITEM["price"]
        assert "id" in data
        
        # Store for cleanup
        self.__class__.created_item_id = data["id"]
        print(f"Created menu item: {data['id']}")
        return data["id"]
    
    def test_update_menu_item(self):
        """Should update existing menu item"""
        # First create if not exists
        if not hasattr(self.__class__, 'created_item_id'):
            self.test_create_menu_item()
        
        item_id = self.__class__.created_item_id
        updated_data = TEST_MENU_ITEM.copy()
        updated_data["name"] = "TEST_Updated Truffle Pasta"
        updated_data["price"] = 950.00
        
        response = requests.put(f"{BASE_URL}/api/menu/{item_id}", json=updated_data)
        assert response.status_code == 200, f"Menu PUT failed: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_Updated Truffle Pasta"
        assert data["price"] == 950.00
        print(f"Updated menu item: {item_id}")
    
    def test_delete_menu_item(self):
        """Should delete menu item"""
        if not hasattr(self.__class__, 'created_item_id'):
            self.test_create_menu_item()
        
        item_id = self.__class__.created_item_id
        response = requests.delete(f"{BASE_URL}/api/menu/{item_id}")
        assert response.status_code == 200, f"Menu DELETE failed: {response.text}"
        print(f"Deleted menu item: {item_id}")


class TestBookingsEndpoints:
    """Test /api/bookings CRUD endpoints"""
    
    def test_create_booking_success(self):
        """Should create a booking with valid data"""
        response = requests.post(f"{BASE_URL}/api/bookings", json=TEST_BOOKING)
        assert response.status_code == 200, f"Booking POST failed: {response.text}"
        
        data = response.json()
        assert data["name"] == TEST_BOOKING["name"]
        assert data["phone"] == TEST_BOOKING["phone"]
        assert data["status"] == "pending"
        assert data["payment_status"] == "pending"
        assert "id" in data
        
        self.__class__.created_booking_id = data["id"]
        print(f"Created booking: {data['id']}")
        return data["id"]
    
    def test_get_bookings(self):
        """Should return list of bookings"""
        response = requests.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 200, f"Bookings GET failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Bookings should return a list"
        print(f"Found {len(data)} bookings")
    
    def test_create_booking_validates_required_fields(self):
        """Should reject booking with missing required fields"""
        # Missing name
        invalid_booking = TEST_BOOKING.copy()
        invalid_booking["name"] = ""
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=invalid_booking)
        assert response.status_code == 400, f"Should reject empty name: {response.status_code}"
        print("Validated: empty name rejected")
    
    def test_create_booking_validates_phone(self):
        """Should reject booking with missing phone"""
        invalid_booking = TEST_BOOKING.copy()
        invalid_booking["phone"] = ""
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=invalid_booking)
        assert response.status_code == 400, f"Should reject empty phone: {response.status_code}"
        print("Validated: empty phone rejected")
    
    def test_create_booking_validates_date(self):
        """Should reject booking with past date"""
        invalid_booking = TEST_BOOKING.copy()
        invalid_booking["date"] = "2020-01-01"  # Past date
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=invalid_booking)
        assert response.status_code == 400, f"Should reject past date: {response.status_code}"
        print("Validated: past date rejected")
    
    def test_create_booking_validates_guests(self):
        """Should reject booking with invalid guest count"""
        invalid_booking = TEST_BOOKING.copy()
        invalid_booking["guests"] = 0  # Invalid
        
        response = requests.post(f"{BASE_URL}/api/bookings", json=invalid_booking)
        assert response.status_code == 400, f"Should reject zero guests: {response.status_code}"
        print("Validated: zero guests rejected")
    
    def test_update_booking_status(self):
        """Should update booking status"""
        if not hasattr(self.__class__, 'created_booking_id'):
            self.test_create_booking_success()
        
        booking_id = self.__class__.created_booking_id
        
        response = requests.patch(
            f"{BASE_URL}/api/bookings/{booking_id}",
            json={"status": "confirmed"}
        )
        assert response.status_code == 200, f"Booking PATCH failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "confirmed"
        print(f"Updated booking status: {booking_id} -> confirmed")
    
    def test_delete_booking(self):
        """Should delete booking"""
        # Create a new booking for deletion test
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            **TEST_BOOKING,
            "name": "TEST_Delete Customer"
        })
        assert response.status_code == 200
        booking_id = response.json()["id"]
        
        delete_response = requests.delete(f"{BASE_URL}/api/bookings/{booking_id}")
        assert delete_response.status_code == 200, f"Booking DELETE failed: {delete_response.text}"
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/bookings")
        bookings = get_response.json()
        assert not any(b["id"] == booking_id for b in bookings), "Booking should be deleted"
        print(f"Deleted booking: {booking_id}")


class TestUPIPaymentFlow:
    """Test UPI payment verification endpoints"""
    
    def test_upi_payment_verify(self):
        """Should record UPI payment with UTR number"""
        # First create a booking
        response = requests.post(f"{BASE_URL}/api/bookings", json={
            **TEST_BOOKING,
            "name": "TEST_UPI Customer"
        })
        assert response.status_code == 200
        booking_id = response.json()["id"]
        
        # Verify UPI payment
        upi_response = requests.post(f"{BASE_URL}/api/payment/upi/verify", json={
            "booking_id": booking_id,
            "utr_number": "123456789012"
        })
        assert upi_response.status_code == 200, f"UPI verify failed: {upi_response.text}"
        
        data = upi_response.json()
        assert data["success"] == True
        assert "message" in data
        print(f"UPI payment recorded for booking: {booking_id}")
        
        # Store for admin test
        self.__class__.upi_booking_id = booking_id
    
    def test_upi_verify_requires_booking_id(self):
        """Should reject UPI verify without booking_id"""
        response = requests.post(f"{BASE_URL}/api/payment/upi/verify", json={
            "utr_number": "123456789012"
        })
        assert response.status_code == 400, f"Should reject missing booking_id: {response.status_code}"


class TestAdminEndpoints:
    """Test admin authentication and UPI confirmation"""
    
    def test_admin_login_success(self):
        """Should login with correct password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print("Admin login successful")
    
    def test_admin_login_invalid_password(self):
        """Should reject invalid password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Should reject wrong password: {response.status_code}"
        print("Validated: wrong password rejected")
    
    def test_admin_upi_confirm(self):
        """Should confirm UPI payment as admin"""
        # First create booking with UPI payment
        booking_response = requests.post(f"{BASE_URL}/api/bookings", json={
            **TEST_BOOKING,
            "name": "TEST_Admin UPI Confirm"
        })
        booking_id = booking_response.json()["id"]
        
        # Record UPI payment
        requests.post(f"{BASE_URL}/api/payment/upi/verify", json={
            "booking_id": booking_id,
            "utr_number": "987654321098"
        })
        
        # Admin confirms payment
        response = requests.post(f"{BASE_URL}/api/admin/upi/confirm", json={
            "booking_id": booking_id
        })
        assert response.status_code == 200, f"Admin UPI confirm failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print(f"Admin confirmed UPI payment for: {booking_id}")


class TestStripeCheckout:
    """Test Stripe payment checkout creation"""
    
    def test_create_checkout_session(self):
        """Should create Stripe checkout session"""
        # First create booking
        booking_response = requests.post(f"{BASE_URL}/api/bookings", json={
            **TEST_BOOKING,
            "name": "TEST_Stripe Customer"
        })
        booking_id = booking_response.json()["id"]
        
        # Create checkout
        response = requests.post(f"{BASE_URL}/api/payment/create-checkout", json={
            "booking_id": booking_id,
            "origin_url": BASE_URL
        })
        assert response.status_code == 200, f"Stripe checkout failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Should return checkout URL"
        assert "session_id" in data, "Should return session ID"
        print(f"Stripe checkout created: {data['session_id']}")
    
    def test_checkout_invalid_booking(self):
        """Should reject checkout for non-existent booking"""
        response = requests.post(f"{BASE_URL}/api/payment/create-checkout", json={
            "booking_id": "INVALID_ID",
            "origin_url": BASE_URL
        })
        assert response.status_code == 404, f"Should return 404 for invalid booking: {response.status_code}"


class TestReviewsEndpoint:
    """Test /api/reviews endpoint"""
    
    def test_get_reviews(self):
        """Should return list of reviews"""
        response = requests.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200, f"Reviews GET failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Reviews should return a list"
        
        if len(data) > 0:
            review = data[0]
            assert "customer_name" in review
            assert "rating" in review
            assert "comment" in review
        print(f"Found {len(data)} reviews")


# Cleanup fixture - runs after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup(request):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup bookings
    try:
        response = requests.get(f"{BASE_URL}/api/bookings")
        if response.status_code == 200:
            for booking in response.json():
                if booking["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/bookings/{booking['id']}")
    except:
        pass
    
    # Cleanup menu items
    try:
        response = requests.get(f"{BASE_URL}/api/menu")
        if response.status_code == 200:
            for item in response.json():
                if item["name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/menu/{item['id']}")
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
