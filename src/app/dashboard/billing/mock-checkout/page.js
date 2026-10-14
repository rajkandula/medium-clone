'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ArrowLeft, CreditCard, Lock, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function MockCheckoutPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('•••');
  const [cardName, setCardName] = useState('Demo Writer');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');
    
    // Simulate minor network delay for realistic visual payment processing feedback
    await new Promise(resolve => setTimeout(resolve, 2200));

    try {
      const res = await fetch('/api/billing/mock-checkout/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setIsSuccess(true);
        // Refresh Auth Context so navbar, sidebar, and profile immediately detect Writer tier
        await refresh();
      } else {
        setErrorMessage(data.error || 'Simulated transaction rejection.');
      }
    } catch (err) {
      setErrorMessage('Sandbox connector error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-md w-full p-8 rounded-2xl text-center space-y-6 animate-scale-up"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' }}>
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-bounce-slow"
            style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}>
            <CheckCircle size={32} style={{ color: '#22c55e' }} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              Welcome to Writer Pro <Sparkles size={20} className="text-yellow-500 animate-pulse" />
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Stripe sandbox has simulated your payment successfully. Your professional writing suite is now fully activated!
            </p>
          </div>

          <div className="p-4 rounded-xl text-xs space-y-2 leading-relaxed"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-tertiary)' }}>
            <div className="flex justify-between">
              <span>Transaction Status:</span>
              <span className="font-bold text-green-500">SIMULATED_SUCCESS</span>
            </div>
            <div className="flex justify-between">
              <span>Plan Type:</span>
              <span className="font-bold">Writer Tier ($1/mo)</span>
            </div>
            <div className="flex justify-between">
              <span>Subscription ID:</span>
              <span className="font-mono">sub_sim_{Math.random().toString(36).substring(7)}</span>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard/billing')}
            className="w-full py-3 rounded-lg text-xs font-extrabold text-white gradient-brand shadow-lg transition-transform hover:scale-[1.02] active:scale-95">
            Return to Billing Suite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Back link */}
      <Link href="/dashboard/billing" className="mb-6 flex items-center gap-2 text-xs font-semibold hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
        <ArrowLeft size={14} /> Back to Plans
      </Link>

      <div className="max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        
        {/* Stripe Simulator Header */}
        <div className="p-6 text-white text-center space-y-2 relative" style={{ background: 'linear-gradient(135deg, #635bff 0%, #4339ca 100%)' }}>
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold bg-white/20 uppercase tracking-widest text-white">
            <Lock size={8} /> Sandbox Mode
          </div>
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            <CreditCard size={20} /> Stripe Checkout
          </h2>
          <p className="text-xs opacity-90">Simulated secure payment gateway for BlogWrite subscription</p>
        </div>

        {/* Transaction Summary */}
        <div className="p-5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Subscribe to</span>
            <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>Writer Pro Monthly</div>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold" style={{ color: 'var(--color-text-primary)' }}>$1.00</span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}> / mo</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSimulatePayment} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg text-xs font-medium text-center" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)' }}>
              {errorMessage}
            </div>
          )}

          {/* Prefilled Credit Card */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Card Details (Prefilled Testing)</label>
            <div className="relative">
              <input readOnly value={cardNumber}
                className="w-full pl-4 pr-10 py-3 rounded-lg text-xs font-semibold focus:outline-none"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} />
              <CreditCard size={14} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Expiration</label>
              <input readOnly value={expiry}
                className="w-full px-4 py-3 rounded-lg text-xs font-semibold focus:outline-none"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>CVC</label>
              <input readOnly value={cvc}
                className="w-full px-4 py-3 rounded-lg text-xs font-semibold focus:outline-none"
                style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Cardholder Name</label>
            <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} required
              className="w-full px-4 py-3 rounded-lg text-xs font-semibold focus:outline-none"
              style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isProcessing}
              className="w-full py-3.5 rounded-lg text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #635bff 0%, #4339ca 100%)' }}>
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Verifying Simulated Stripe Token...
                </>
              ) : (
                <>
                  Simulate Secure Payment ($1.00)
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Footer */}
        <div className="p-4 flex items-center justify-center gap-1.5" style={{ borderTop: '1px solid var(--color-border-primary)', background: 'var(--color-bg-tertiary)' }}>
          <ShieldCheck size={14} style={{ color: '#22c55e' }} />
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Encrypted simulator connection via SSL</span>
        </div>
      </div>
    </div>
  );
}
