import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lock, LogOut, Plus, Trash2, Edit, CheckCircle, XCircle, ShoppingBag, Clock, CheckCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/lib/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: 'Starters', image_url: '', is_popular: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
      fetchMenu();
      fetchOrders();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/login`, { password });
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error) {
      toast.error('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    navigate('/');
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch menu');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API}/orders/${orderId}`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await axios.delete(`${API}/orders/${orderId}`);
      toast.success('Order deleted');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.patch(`${API}/bookings/${bookingId}`, { status });
      toast.success('Booking updated');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await axios.delete(`${API}/bookings/${bookingId}`);
      toast.success('Booking deleted');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/menu`, { ...newItem, price: parseFloat(newItem.price) });
      toast.success('Menu item added');
      setNewItem({ name: '', description: '', price: '', category: 'Starters', image_url: '', is_popular: false });
      fetchMenu();
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const updateMenuItem = async (itemId) => {
    try {
      await axios.put(`${API}/menu/${itemId}`, { ...editingItem, price: parseFloat(editingItem.price) });
      toast.success('Menu item updated');
      setEditingItem(null);
      fetchMenu();
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await axios.delete(`${API}/menu/${itemId}`);
      toast.success('Menu item deleted');
      fetchMenu();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const getStatusColor = (status) => {
    if (status === 'confirmed' || status === 'ready') return 'bg-green-600 text-white';
    if (status === 'cancelled') return 'bg-red-600 text-white';
    return 'bg-yellow-600 text-white';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center px-6">
        <div className="bg-forest-light border-2 border-gold p-8 rounded-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Lock size={48} className="text-gold" />
          </div>
          <h1 className="text-3xl font-serif text-gold text-center mb-8">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="bg-transparent border-b border-forest-light text-cream placeholder:text-sage rounded-none px-0 py-3 focus:ring-0 focus:border-gold transition-all"
              required
            />
            <Button type="submit" className="w-full bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300">
              Login
            </Button>
          </form>
          <p className="text-sage text-xs text-center mt-4">Default password: admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest">
      <div className="border-b border-forest-light bg-forest-light">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif text-gold">Lumière Admin</h1>
          <Button onClick={handleLogout} variant="outline" className="border border-gold text-gold hover:bg-gold hover:text-forest transition-colors duration-300 flex items-center gap-2">
            <LogOut size={18} /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-forest-light overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-serif text-lg transition-colors duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'orders' ? 'text-gold border-b-2 border-gold' : 'text-sage hover:text-cream'}`}
          >
            <ShoppingBag size={18} />
            Orders
            {pendingOrders > 0 && (
              <span className="bg-yellow-500 text-forest text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingOrders}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-serif text-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'bookings' ? 'text-gold border-b-2 border-gold' : 'text-sage hover:text-cream'}`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 font-serif text-lg transition-colors duration-300 whitespace-nowrap ${activeTab === 'menu' ? 'text-gold border-b-2 border-gold' : 'text-sage hover:text-cream'}`}
          >
            Menu ({menuItems.length})
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center text-sage font-body py-20">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No orders yet</p>
                <p className="text-sm mt-1">Orders placed via WhatsApp will appear here</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-forest-light border border-forest-light p-6 rounded-md hover:border-gold transition-colors duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-serif text-cream">{order.customer_name}</h3>
                      <p className="text-sage text-sm">📞 {order.customer_phone}</p>
                      <p className="text-sage text-xs mt-1">ID: {order.id}</p>
                      <p className="text-sage text-xs">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-body ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-gold font-serif text-lg">₹{order.total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-forest rounded-md p-4 mb-4 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-cream">{item.name} <span className="text-sage">x{item.qty}</span></span>
                        <span className="text-gold">₹{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="border-t border-forest-light pt-2 flex justify-between font-serif">
                      <span className="text-cream">Total</span>
                      <span className="text-gold">₹{order.total.toFixed(0)}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <p className="text-sage text-sm mb-4"><span className="text-cream">Notes:</span> {order.notes}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2" size="sm">
                        <CheckCircle size={16} /> Confirm
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" size="sm">
                        <CheckCheck size={16} /> Mark Ready
                      </Button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'ready' && (
                      <Button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" size="sm">
                        <XCircle size={16} /> Cancel
                      </Button>
                    )}
                    <Button onClick={() => deleteOrder(order.id)} variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2" size="sm">
                      <Trash2 size={16} /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-forest-light border border-forest-light p-6 rounded-md hover:border-gold transition-colors duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-serif text-cream">{booking.name}</h3>
                    <p className="text-sage text-sm">ID: {booking.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-body ${booking.status === 'confirmed' ? 'bg-green-600 text-white' : booking.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                      {booking.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-body ${booking.payment_status === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {booking.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sage text-sm mb-4">
                  <p>Phone: {booking.phone}</p>
                  <p>Email: {booking.email || 'N/A'}</p>
                  <p>Date: {booking.date}</p>
                  <p>Time: {booking.time}</p>
                  <p>Guests: {booking.guests}</p>
                  <p>Created: {new Date(booking.created_at).toLocaleDateString()}</p>
                  {booking.payment_method && <p>Payment: <span className="text-cream">{booking.payment_method}</span></p>}
                  {booking.utr_number && <p>UTR: <span className="text-cream">{booking.utr_number}</span></p>}
                </div>
                {booking.special_requests && (
                  <p className="text-sage text-sm mb-4"><span className="text-cream">Special Requests:</span> {booking.special_requests}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {booking.status !== 'confirmed' && (
                    <Button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2" size="sm">
                      <CheckCircle size={16} /> Confirm
                    </Button>
                  )}
                  {booking.payment_status === 'pending_verification' && booking.payment_method === 'UPI' && (
                    <Button onClick={async () => {
                      try {
                        await axios.post(`${API}/admin/upi/confirm`, { booking_id: booking.id });
                        toast.success('UPI payment confirmed!');
                        fetchBookings();
                      } catch (error) {
                        toast.error('Failed to confirm payment');
                      }
                    }} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" size="sm">
                      <CheckCircle size={16} /> Verify UPI
                    </Button>
                  )}
                  {booking.status !== 'cancelled' && (
                    <Button onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" size="sm">
                      <XCircle size={16} /> Cancel
                    </Button>
                  )}
                  <Button onClick={() => deleteBooking(booking.id)} variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2" size="sm">
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="bg-forest-light border border-gold p-6 rounded-md mb-6">
              <h3 className="text-xl font-serif text-gold mb-4">Add New Menu Item</h3>
              <form onSubmit={addMenuItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="bg-transparent border-b border-forest-light text-cream" required />
                  <Input placeholder="Price" type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="bg-transparent border-b border-forest-light text-cream" required />
                </div>
                <Textarea placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="bg-transparent border border-forest-light text-cream" required />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="bg-forest-light border-b border-forest-light text-cream px-0 py-3">
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                  <label className="flex items-center gap-2 text-cream">
                    <input type="checkbox" checked={newItem.is_popular} onChange={(e) => setNewItem({ ...newItem, is_popular: e.target.checked })} className="w-4 h-4" />
                    Popular Item
                  </label>
                </div>
                <Input placeholder="Image URL" value={newItem.image_url} onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} className="bg-transparent border-b border-forest-light text-cream" required />
                <Button type="submit" className="bg-gold text-forest hover:bg-gold-dark flex items-center gap-2">
                  <Plus size={18} /> Add Menu Item
                </Button>
              </form>
            </div>
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-forest-light border border-forest-light p-6 rounded-md hover:border-gold transition-colors duration-300">
                  {editingItem?.id === item.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="bg-transparent border-b border-forest-light text-cream" />
                        <Input type="number" step="0.01" value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })} className="bg-transparent border-b border-forest-light text-cream" />
                      </div>
                      <Textarea value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} className="bg-transparent border border-forest-light text-cream" />
                      <div className="flex gap-2">
                        <Button onClick={() => updateMenuItem(item.id)} className="bg-gold text-forest hover:bg-gold-dark">Save</Button>
                        <Button onClick={() => setEditingItem(null)} variant="outline" className="border-gold text-gold">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-serif text-cream">{item.name}</h3>
                          <p className="text-gold text-lg">₹{item.price.toFixed(0)}</p>
                        </div>
                        <span className="px-3 py-1 bg-gold text-forest rounded-full text-xs font-body">{item.category}</span>
                      </div>
                      <p className="text-sage text-sm mb-4">{item.description}</p>
                      <div className="flex gap-2">
                        <Button onClick={() => setEditingItem(item)} className="bg-gold text-forest hover:bg-gold-dark flex items-center gap-2" size="sm">
                          <Edit size={16} /> Edit
                        </Button>
                        <Button onClick={() => deleteMenuItem(item.id)} variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center gap-2" size="sm">
                          <Trash2 size={16} /> Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;