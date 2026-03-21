import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import AdminDashboard from '@/pages/AdminDashboard';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { Toaster } from '@/components/ui/sonner';
import FloatingButton from '@/components/ui/FloatingButton';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
      <Toaster position="top-center" />
      <FloatingButton />
    </BrowserRouter>
  );
}

export default App;