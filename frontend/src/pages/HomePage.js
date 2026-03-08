import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Mail, MapPin, Instagram, Facebook, Twitter, ChevronDown, Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import BookingDialog from '@/components/BookingDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [hoveredDish, setHoveredDish] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  
  useEffect(() => {
    fetchMenu();
    fetchReviews();
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data);
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
  
  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  
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
          <button
            data-testid="nav-book-table-btn"
            onClick={() => setShowBooking(true)}
            className="bg-gold text-forest hover:bg-gold-dark px-6 py-2 rounded-sm font-serif tracking-wider uppercase text-xs transition-all duration-300 hover:tracking-widest"
          >
            Reserve
          </button>
        </div>
      </motion.nav>
      
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0"
        >
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
          
          <motion.button
            data-testid="hero-book-table-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            onClick={() => setShowBooking(true)}
            className="relative bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300 hover:tracking-widest"
          >
            Book Your Table
          </motion.button>
          
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
      <section id="menu" className="py-20 px-6 md:px-12 bg-forest">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-cream mb-4 tracking-tight">Our Menu</h2>
            <p className="text-sage font-body tracking-wide">Crafted with passion, served with elegance</p>
          </motion.div>
          
          {Object.entries(groupedMenu).map(([category, items], idx) => (
            <div key={category} className="mb-16">
              <h3 className="text-3xl font-serif text-gold mb-8 tracking-tight border-b border-forest-light pb-4">{category}</h3>
              <div className="space-y-6">
                {items.map((item, itemIdx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: itemIdx * 0.1, duration: 0.6 }}
                    onMouseEnter={() => setHoveredDish(item.id)}
                    onMouseLeave={() => setHoveredDish(null)}
                    className="grid md:grid-cols-2 gap-8 items-center group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-serif text-cream tracking-tight flex items-center gap-2">
                          {item.name}
                          {item.is_popular && <Star size={16} className="text-gold fill-gold" />}
                        </h4>
                        <span className="text-gold font-body text-lg">₹{item.price.toFixed(0)}</span>
                      </div>
                      <p className="text-sage text-sm font-body leading-relaxed tracking-wide">{item.description}</p>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredDish === item.id ? 1 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="hidden md:block h-48 rounded-md overflow-hidden"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
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
      
      {/* Booking Dialog */}
      <BookingDialog open={showBooking} onClose={() => setShowBooking(false)} />
    </div>
  );
};

export default HomePage;