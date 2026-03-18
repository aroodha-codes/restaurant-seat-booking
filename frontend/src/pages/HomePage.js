import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, MapPin, Instagram, Facebook, Twitter, ChevronDown, Star, ShoppingCart, Plus, Minus, X, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import BookingDialog from '@/components/BookingDialog';
import { API } from '@/lib/api';

const HomePage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('919876543210');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [menuSearch, setMenuSearch] = useState('');

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    fetchMenu();
    fetchReviews();
    fetchConfig();

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data);

      if (response.data.length > 0) {
        const firstCategory = response.data[0].category;
        setActiveCategory((prev) => prev || firstCategory);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config`);
      if (response.data.restaurant_whatsapp) {
        setWhatsappNumber(response.data.restaurant_whatsapp);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryEntries = Object.entries(groupedMenu);
  const availableCategories = categoryEntries.map(([category]) => category);
  const selectedCategory = activeCategory || availableCategories[0] || '';
  const visibleItems = (groupedMenu[selectedCategory] || []).filter((item) => {
    const search = menuSearch.trim().toLowerCase();
    if (!search) return true;
    return (`${item.name} ${item.description}`).toLowerCase().includes(search);
  });

  // Cart functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added to cart!`);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  };

  const deleteFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const getCartQty = (itemId) => {
    const item = cart.find(c => c.id === itemId);
    return item ? item.qty : 0;
  };

  const orderViaWhatsApp = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsSubmittingOrder(true);

    try {
      try {
        await axios.post(`${API}/orders`, {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            qty: item.qty,
          })),
          total: Number(cartTotal.toFixed(2)),
        });
      } catch (error) {
        console.error('Error saving order:', error);
        toast.error('Could not save order to dashboard. Sending WhatsApp message anyway.');
      }

      const orderLines = cart.map(item =>
        `• ${item.name} x${item.qty} — ₹${(item.price * item.qty).toFixed(0)}`
      ).join('\n');

      const message = `Hello! I'd like to place a food order at Lumière Bistro.\n\n*Customer Details:*\nName: ${customerName}\nPhone: ${customerPhone}\n\n*Order:*\n${orderLines}\n\n*Total: ₹${cartTotal.toFixed(0)}*\n\nPlease confirm my order. Thank you! 🍽️`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Opening WhatsApp with your order!');

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowCart(false);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: scrollY > 100 ? -100 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
          background: scrollY > 50 ? 'rgba(15, 31, 28, 0.85)' : 'transparent',
          borderBottom: scrollY > 50 ? '1px solid rgba(212, 175, 55, 0.2)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif text-gold tracking-tight">Lumière</h1>
          <div className="hidden md:flex gap-8 font-body text-sm tracking-wide text-cream">
            <a href="#menu" className="hover:text-gold transition-colors duration-300">Menu</a>
            <a href="#gallery" className="hover:text-gold transition-colors duration-300">Gallery</a>
            <a href="#about" className="hover:text-gold transition-colors duration-300">About</a>
            <a href="#reviews" className="hover:text-gold transition-colors duration-300">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative text-cream hover:text-gold transition-colors duration-300"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-forest text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowBooking(true)}
              className="bg-gold text-forest hover:bg-gold-dark px-6 py-2 rounded-sm font-serif tracking-wider uppercase text-xs transition-all duration-300 hover:tracking-widest"
            >
              Reserve
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1745549670488-6852ef218009?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
            alt="Lumière Bistro Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/60 via-forest/40 to-forest"></div>
        </motion.div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.1, y: 0 }}
            transition={{ duration: 1 }}
            className="absolute text-[12rem] md:text-[20rem] font-serif text-cream font-bold tracking-tight select-none"
          >
            Lumière
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative text-4xl sm:text-5xl lg:text-6xl font-serif text-cream mb-6 tracking-tight"
          >
            Where Culinary Art<br />Meets Rustic Elegance
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative text-base md:text-lg text-sage font-body tracking-wide mb-8 max-w-2xl"
          >
            A sensory experience for the modern epicurean
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="relative flex gap-4 flex-wrap justify-center"
          >
            <button
              onClick={() => setShowBooking(true)}
              className="bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300 hover:tracking-widest"
            >
              Book Your Table
            </button>
            <a
              href="#menu"
              className="border border-gold text-gold hover:bg-gold hover:text-forest px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
            >
              Order Food
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8"
          >
            <ChevronDown className="text-gold animate-bounce" size={32} />
          </motion.div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 px-6 md:px-12 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.22), transparent 40%), radial-gradient(circle at 80% 0%, rgba(245,230,211,0.09), transparent 45%)' }} />
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-cream mb-4 tracking-tight">The House Menu</h2>
            <p className="text-sage font-body tracking-wide">Designed like a classic table menu, easy to browse and quick to order</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[#f4e8cf] text-[#2e2012] border border-[#e3c788] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.28)] relative z-10 overflow-hidden"
          >
            <div className="border-b border-[#d8ba78] bg-gradient-to-r from-[#f2dfb4] via-[#f7ebcc] to-[#f0ddb0] px-4 md:px-8 py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.28em] text-[#7d5a2d]">Lumiere Bistro</p>
                  <h3 className="font-serif text-2xl md:text-3xl tracking-tight">A La Carte</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    type="text"
                    placeholder="Search dishes"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full sm:w-56 bg-[#fff8e8] border border-[#d8bb7e] rounded-md px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#c19a4e]"
                  />
                  <div className="bg-[#fff8e8] border border-[#d8bb7e] rounded-md px-3 py-2 text-xs font-body text-[#6f5229]">
                    {cartCount} item{cartCount === 1 ? '' : 's'} in cart
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-xs font-body tracking-wide whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-[#402712] text-[#f7eac8] shadow-md' : 'bg-[#ead4a6] text-[#5a3a18] hover:bg-[#e1c18a]'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 md:px-8 py-6 md:py-8">
              <div className="flex items-center justify-between border-b border-[#d7b87a] pb-3 mb-5">
                <h4 className="font-serif text-xl md:text-2xl tracking-tight text-[#311f10]">{selectedCategory || 'Menu'}</h4>
                <div className="text-xs font-body uppercase tracking-[0.2em] text-[#7d5a2d]">{visibleItems.length} dishes</div>
              </div>

              {visibleItems.length === 0 ? (
                <div className="text-center py-10 text-[#6e532f] font-body">
                  No dishes found for this search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {visibleItems.map((item, itemIdx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: itemIdx * 0.03, duration: 0.35 }}
                      className="border-b border-dashed border-[#c7a263] pb-3"
                    >
                      <div className="flex items-baseline gap-2">
                        <h5 className="font-serif text-base md:text-lg text-[#2b1b0f] flex items-center gap-2">
                          {item.name}
                          {item.is_popular && <span className="text-[10px] font-body uppercase tracking-widest bg-[#402712] text-[#f5dfb6] px-2 py-0.5 rounded-full">Popular</span>}
                        </h5>
                        <span className="flex-1 border-b border-dotted border-[#bb9655] mb-1" />
                        <span className="font-serif text-[#7a511f]">₹{Number(item.price).toFixed(0)}</span>
                      </div>
                      <p className="text-[#6a4d2a] font-body text-xs md:text-sm leading-relaxed mt-1">{item.description}</p>

                      <div className="pt-2">
                        {getCartQty(item.id) === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="inline-flex items-center gap-1.5 border border-[#876231] text-[#5a3818] hover:bg-[#4b2f14] hover:text-[#f6e7c6] px-3 py-1 rounded-sm text-xs font-body tracking-wide transition-all duration-200"
                          >
                            <Plus size={13} /> Add
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="bg-[#e7cc9d] border border-[#b48a4c] text-[#4c2d12] hover:bg-[#d9b675] w-7 h-7 rounded-sm flex items-center justify-center transition-all duration-200"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-[#4c2d12] font-body text-sm w-4 text-center">{getCartQty(item.id)}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-[#4b2f14] text-[#f6e7c6] hover:bg-[#36210e] w-7 h-7 rounded-sm flex items-center justify-center transition-all duration-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="mt-6 bg-[#f8edd3] border border-[#dfc182] rounded-md px-4 py-3 flex items-center gap-3">
                <MessageCircle size={18} className="text-[#7c5423]" />
                <p className="text-[#6a4d2a] text-xs md:text-sm font-body">Choose items from this card-style menu, then place your order instantly on WhatsApp.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 px-6 md:px-12 bg-forest-light">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-cream mb-4 tracking-tight">Gallery</h2>
            <p className="text-sage font-body tracking-wide">Moments captured in time</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { url: 'https://images.unsplash.com/photo-1707334724033-e997675f8c10?w=600', span: 'md:col-span-2 md:row-span-2' },
              { url: 'https://images.pexels.com/photos/19119934/pexels-photo-19119934.jpeg?w=400', span: '' },
              { url: 'https://images.unsplash.com/photo-1748012199657-3f34292cdf70?w=400', span: '' },
              { url: 'https://images.pexels.com/photos/9659592/pexels-photo-9659592.jpeg?w=400', span: '' },
              { url: 'https://images.unsplash.com/photo-1764397514747-8272f2da3f36?w=400', span: '' }
            ].map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className={`${img.span} h-64 md:h-auto overflow-hidden rounded-md group cursor-pointer`}
              >
                <img
                  src={img.url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 md:px-12 bg-forest">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-serif text-cream mb-6 tracking-tight">Our Story</h2>
            <div className="space-y-4 text-sage font-body leading-relaxed tracking-wide">
              <p>
                At Lumière, we believe dining is an art form. Every dish is crafted with precision,
                passion, and the finest seasonal ingredients sourced from local artisans.
              </p>
              <p>
                Our intimate atmosphere combines rustic elegance with modern sophistication,
                creating the perfect backdrop for life's most memorable moments.
              </p>
              <p>
                Led by our award-winning culinary team, we transform traditional techniques into
                contemporary masterpieces that delight all the senses.
              </p>
            </div>
            <div className="mt-8 space-y-2 text-cream font-body text-sm">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gold" />
                <span>Tuesday - Sunday: 12:00 PM - 11:00 PM</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-gold" />
                <span>MG Road, Bangalore, Karnataka 560001</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-gold" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-96 rounded-md overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1707334724033-e997675f8c10?w=800"
              alt="Restaurant Interior"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 px-6 md:px-12 bg-forest-light">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-cream mb-4 tracking-tight">What Our Guests Say</h2>
            <p className="text-sage font-body tracking-wide">Experiences that speak for themselves</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {reviews.slice(0, 6).map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="bg-forest border border-forest-light p-8 rounded-md hover:border-gold transition-colors duration-300 group"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-sage italic font-serif text-sm leading-relaxed mb-4">
                  "{review.comment}"
                </p>
                <div className="text-cream font-body text-sm">
                  <p className="font-medium">{review.customer_name}</p>
                  <p className="text-xs text-sage">{new Date(review.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest border-t border-forest-light py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <h3 className="text-2xl font-serif text-gold mb-4 tracking-tight">Lumière</h3>
              <p className="text-sage font-body text-sm leading-relaxed tracking-wide">
                Where culinary art meets rustic elegance. A sensory experience for the modern epicurean.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-serif text-cream mb-4 tracking-tight">Contact</h4>
              <div className="space-y-2 text-sage font-body text-sm">
                <p>MG Road</p>
                <p>Bangalore, Karnataka 560001</p>
                <p>+91 98765 43210</p>
                <p>hello@lumierebistro.com</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-serif text-cream mb-4 tracking-tight">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-gold transition-colors duration-300">
                  <Instagram size={24} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-gold transition-colors duration-300">
                  <Facebook size={24} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sage hover:text-gold transition-colors duration-300">
                  <Twitter size={24} />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-forest-light pt-8 text-center text-sage font-body text-sm tracking-wide">
            <p>© 2025 Lumière Bistro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 z-40 bg-gold text-forest px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-serif text-sm hover:bg-gold-dark transition-all duration-300"
          >
            <ShoppingCart size={18} />
            {cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal.toFixed(0)}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-forest border-l border-forest-light z-50 flex flex-col"
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b border-forest-light">
                <h2 className="text-2xl font-serif text-cream tracking-tight flex items-center gap-2">
                  <ShoppingCart size={20} className="text-gold" /> Your Order
                </h2>
                <button onClick={() => setShowCart(false)} className="text-sage hover:text-cream transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-sage font-body py-12">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Your cart is empty</p>
                    <p className="text-sm mt-1">Add items from the menu</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-forest-light p-4 rounded-md">
                      <div className="flex-1">
                        <p className="text-cream font-serif text-sm">{item.name}</p>
                        <p className="text-gold text-sm font-body">₹{item.price.toFixed(0)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeFromCart(item.id)} className="bg-forest border border-gold/30 text-gold w-7 h-7 rounded-sm flex items-center justify-center hover:bg-gold hover:text-forest transition-all">
                          <Minus size={12} />
                        </button>
                        <span className="text-cream font-body text-sm w-5 text-center">{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="bg-gold text-forest w-7 h-7 rounded-sm flex items-center justify-center hover:bg-gold-dark transition-all">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => deleteFromCart(item.id)} className="ml-2 text-sage hover:text-red-400 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Details & Order Button */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-forest-light space-y-4">
                  <div className="flex justify-between text-cream font-serif text-lg mb-2">
                    <span>Total</span>
                    <span className="text-gold">₹{cartTotal.toFixed(0)}</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light focus:border-gold text-cream placeholder-sage px-4 py-2.5 rounded-sm font-body text-sm outline-none transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone Number *"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full bg-forest-light border border-forest-light focus:border-gold text-cream placeholder-sage px-4 py-2.5 rounded-sm font-body text-sm outline-none transition-colors"
                  />

                  <button
                    onClick={orderViaWhatsApp}
                    disabled={isSubmittingOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-sm font-serif tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    <MessageCircle size={18} />
                    {isSubmittingOrder ? 'Saving Order...' : 'Order via WhatsApp'}
                  </button>
                  <p className="text-sage text-xs text-center font-body">
                    Your order will be sent to our WhatsApp. We'll confirm shortly!
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Booking Dialog */}
      <BookingDialog open={showBooking} onClose={() => setShowBooking(false)} />
    </div>
  );
};

export default HomePage;