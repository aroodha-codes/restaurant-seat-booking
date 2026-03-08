import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);
  
  const checkPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }
    
    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setPaymentInfo(response.data);
        setStatus('success');
        return;
      }
      
      setTimeout(() => checkPaymentStatus(attempts + 1), 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };
  
  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-6">
      <div className="bg-forest-light border-2 border-gold p-8 rounded-md max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={64} className="text-gold mx-auto mb-6 animate-spin" />
            <h1 className="text-3xl font-serif text-gold mb-4">Processing Payment...</h1>
            <p className="text-sage">Please wait while we confirm your payment.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-serif text-gold mb-4">Payment Successful!</h1>
            <p className="text-cream mb-2">Your table booking has been confirmed.</p>
            {paymentInfo && (
              <p className="text-sage text-sm mb-6">
                Amount paid: ₹{(paymentInfo.amount_total / 100).toFixed(0)}
              </p>
            )}
            <p className="text-sage mb-6">
              We'll send you a confirmation via WhatsApp shortly.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
            >
              Back to Home
            </Button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-6">✕</div>
            <h1 className="text-3xl font-serif text-gold mb-4">Payment Error</h1>
            <p className="text-sage mb-6">
              There was an error processing your payment. Please contact us if the issue persists.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
            >
              Back to Home
            </Button>
          </>
        )}
        
        {status === 'timeout' && (
          <>
            <div className="text-yellow-500 text-5xl mb-6">⚠</div>
            <h1 className="text-3xl font-serif text-gold mb-4">Payment Pending</h1>
            <p className="text-sage mb-6">
              We're still processing your payment. Please check your email for confirmation.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-gold text-forest hover:bg-gold-dark px-8 py-4 rounded-sm font-serif tracking-wider uppercase text-sm transition-all duration-300"
            >
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;