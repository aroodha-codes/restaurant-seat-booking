import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, User, Phone, Mail, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: 2,
    special_requests: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingId, setBookingId] = useState(null);
  const [config, setConfig] = useState({ 
    restaurant_whatsapp: '919876543210', 
    currency: 'INR', 
    deposit_amount: 500,
    upi_id: 'lumierebistro@paytm',
    restaurant_name: 'Lumiere Bistro'
  });
  const [showUpiDialog, setShowUpiDialog] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);
  
  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config`);
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/bookings`, formData);
      setBookingId(response.data.id);
      setStep(2);
      setLoading(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
      setLoading(false);
    }
  };
  
  const handleUpiPayment = () => {
    const amount = config.deposit_amount;
    const upiUrl = `upi://pay?pa=${config.upi_id}&pn=${encodeURIComponent(config.restaurant_name)}&am=${amount}&cu=INR&tn=Booking-${bookingId}`;
    
    // Try to open UPI app
    window.location.href = upiUrl;
    
    // Show dialog for UTR number
    setTimeout(() => {
      setShowUpiDialog(true);
    }, 1000);
  };
  
  const handleUpiVerification = async () => {
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR/Transaction ID');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/payment/upi/verify`, {
        booking_id: bookingId,
        utr_number: utrNumber
      });
      
      toast.success(response.data.message);
      setShowUpiDialog(false);
      
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          email: '',
          date: '',
          time: '',
          guests: 2,
          special_requests: ''
        });
        setStep(1);
        setBookingId(null);
        setUtrNumber('');
        onClose();
      }, 2000);
    } catch (error) {
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePayment = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/payment/create-checkout`, {
        booking_id: bookingId,
        origin_url: originUrl
      });
      
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment session');
      setLoading(false);
    }
  };
  
  const handleWhatsAppOnly = () => {
    const message = `Hello! I'd like to book a table at Lumière Bistro.

Name: ${formData.name}
Phone: ${formData.phone}
Date: ${formData.date}
Time: ${formData.time}
Guests: ${formData.guests}${formData.special_requests ? `\nSpecial Requests: ${formData.special_requests}` : ''}

Booking ID: ${bookingId}`;
    
    const restaurantNumber = config.restaurant_whatsapp;
    const encodedMessage = encodeURIComponent(message);
    
    // Check if mobile (try app first)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile 
      ? `whatsapp://send?phone=${restaurantNumber}&text=${encodedMessage}`
      : `https://web.whatsapp.com/send/?phone=${restaurantNumber}&text=${encodedMessage}&type=phone_number&app_absent=0`;
    
    // Open in new tab
    const newWindow = window.open(whatsappUrl, '_blank');
    
    // If popup blocked or failed, show manual copy option
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Copy message to clipboard
      navigator.clipboard.writeText(message).then(() => {
        toast.success('Message copied! Please paste in WhatsApp manually.');
      }).catch(() => {
        toast.info(`Please send this message to +${restaurantNumber} on WhatsApp`);
      });
    } else {
      toast.success('Opening WhatsApp...');
    }
    
    setTimeout(() => {
      setFormData({
        name: '',
        phone: '',
        email: '',
        date: '',
        time: '',
        guests: 2,
        special_requests: ''
      });
      setStep(1);
      setBookingId(null);
      onClose();
    }, 1500);
  };
  
  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      date: '',
      time: '',
      guests: 2,
      special_requests: ''
    });
    setStep(1);
    setBookingId(null);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby="booking-dialog-desc" className="bg-forest-light border-2 border-gold text-cream max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-gold tracking-tight">
            {step === 1 ? 'Reserve Your Table' : 'Choose Payment Method'}
          </DialogTitle>
        </DialogHeader>
        <p id="booking-dialog-desc" className="sr-only">Book a table at Lumière Bistro</p>
        
        {step === 1 ? (
          <form onSubmit={handleBooking} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-cream font-body flex items-center gap-2">
                <User size={16} className="text-gold" />
                Full Name *
              </Label>
              <Input
                id="name"
                data-testid="booking-name-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="bg-transparent border-b border-forest-light text-cream placeholder:text-sage rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-cream font-body flex items-center gap-2">
                <Phone size={16} className="text-gold" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                data-testid="booking-phone-input"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="bg-transparent border-b border-forest-light text-cream placeholder:text-sage rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cream font-body flex items-center gap-2">
                <Mail size={16} className="text-gold" />
                Email
              </Label>
              <Input
                id="email"
                data-testid="booking-email-input"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="bg-transparent border-b border-forest-light text-cream placeholder:text-sage rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-cream font-body flex items-center gap-2">
                  <Calendar size={16} className="text-gold" />
                  Date *
                </Label>
                <Input
                  id="date"
                  data-testid="booking-date-input"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-transparent border-b border-forest-light text-cream rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time" className="text-cream font-body flex items-center gap-2">
                  <Clock size={16} className="text-gold" />
                  Time *
                </Label>
                <Input
                  id="time"
                  data-testid="booking-time-input"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="bg-transparent border-b border-forest-light text-cream rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guests" className="text-cream font-body flex items-center gap-2">
                <Users size={16} className="text-gold" />
                Number of Guests *
              </Label>
              <Input
                id="guests"
                data-testid="booking-guests-input"
                name="guests"
                type="number"
                min="1"
                max="20"
                value={formData.guests}
                onChange={handleChange}
                className="bg-transparent border-b border-forest-light text-cream rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="special_requests" className="text-cream font-body">
                Special Requests
              </Label>
              <Textarea
                id="special_requests"
                data-testid="booking-requests-input"
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                placeholder="Any dietary restrictions, allergies, or special occasions..."
                className="bg-transparent border border-forest-light text-cream placeholder:text-sage rounded-sm p-3 focus:ring-0 focus:border-gold transition-all min-h-[100px]"
              />
            </div>
            
            <Button
              data-testid="booking-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-forest p-4 rounded-md border border-forest-light">
              <p className="text-cream text-sm mb-2">Booking ID: <span className="text-gold">{bookingId}</span></p>
              <p className="text-sage text-xs">Your table reservation has been created!</p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Pay ₹{config.deposit_amount} via Card
              </Button>
              
              <Button
                onClick={handleUpiPayment}
                disabled={loading}
                className="w-full bg-green-600 text-white hover:bg-green-700 px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Pay ₹{config.deposit_amount} via UPI
              </Button>
              
              <Button
                onClick={handleWhatsAppOnly}
                disabled={loading}
                variant="outline"
                className="w-full border-2 border-gold text-gold hover:bg-gold hover:text-forest px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
              >
                Confirm via WhatsApp (Free)
              </Button>
              
              <Button
                onClick={() => {
                  const msg = `Hello! I'd like to book a table at Lumière Bistro.\n\nName: ${formData.name}\nPhone: ${formData.phone}\nDate: ${formData.date}\nTime: ${formData.time}\nGuests: ${formData.guests}${formData.special_requests ? `\nSpecial Requests: ${formData.special_requests}` : ''}\n\nBooking ID: ${bookingId}`;
                  navigator.clipboard.writeText(msg);
                  toast.success('Message copied to clipboard!');
                }}
                variant="outline"
                className="w-full border border-sage text-sage hover:bg-sage hover:text-forest px-6 py-3 rounded-sm font-body text-xs transition-all duration-300"
              >
                Copy Message (Manual)
              </Button>
            </div>
            
            <div className="bg-forest-light p-3 rounded border border-forest-light">
              <p className="text-sage text-xs mb-2">
                <span className="text-gold">UPI ID:</span> {config.upi_id}
              </p>
              <p className="text-sage text-xs">
                <span className="text-gold">WhatsApp:</span> +{config.restaurant_whatsapp}
              </p>
              <p className="text-sage text-xs mt-2">
                Pay via Card/UPI for instant confirmation or use WhatsApp for free booking.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* UPI Verification Dialog */}
      <Dialog open={showUpiDialog} onOpenChange={setShowUpiDialog}>
        <DialogContent aria-describedby="upi-dialog-desc" className="bg-forest-light border-2 border-green-600 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-green-500 tracking-tight">Verify UPI Payment</DialogTitle>
          </DialogHeader>
          <p id="upi-dialog-desc" className="sr-only">Enter UPI transaction reference number</p>
          
          <div className="space-y-4 mt-4">
            <div className="bg-forest p-4 rounded-md border border-forest-light">
              <p className="text-cream text-sm mb-2">Booking ID: <span className="text-gold">{bookingId}</span></p>
              <p className="text-cream text-sm mb-2">Amount: <span className="text-green-500">₹{config.deposit_amount}</span></p>
              <p className="text-cream text-sm">UPI ID: <span className="text-gold">{config.upi_id}</span></p>
            </div>
            
            <p className="text-sage text-sm">
              After completing the UPI payment, please enter your 12-digit UTR/Transaction Reference Number below:
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="utr" className="text-cream font-body">
                UTR / Transaction ID *
              </Label>
              <Input
                id="utr"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR number"
                className="bg-transparent border-b border-forest-light text-cream placeholder:text-sage rounded-none px-0 py-3 focus:ring-0 focus:border-green-500 transition-all"
                maxLength={12}
              />
            </div>
            
            <p className="text-sage text-xs">
              Your booking will be confirmed once admin verifies the payment.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleUpiVerification}
                disabled={loading}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
              >
                {loading ? 'Verifying...' : 'Submit'}
              </Button>
              <Button
                onClick={() => setShowUpiDialog(false)}
                variant="outline"
                className="border-sage text-sage hover:bg-sage hover:text-forest px-6 py-3 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default BookingDialog;