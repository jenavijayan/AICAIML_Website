import React, { useState } from 'react';
import {
  Check, X, Sparkles, CreditCard, Smartphone, Loader2, CheckCircle,
  AlertCircle, Mail, ArrowLeft
} from 'lucide-react';
import { membershipPlans, MembershipPlan } from '../cmsData';
import { Button, Dialog, DialogHeader, TextField } from './ui';
import { useFormVerification } from '../hooks/useFormVerification';
import EmailVerification from './EmailVerification';

interface MembershipPlansProps {
  onJoinPlan?: (plan: MembershipPlan) => void;
}

export default function MembershipPlans({ onJoinPlan }: MembershipPlansProps) {
  const [activePlan, setActivePlan] = useState<MembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [form, setForm] = useState({ name: '', email: '', phone: '', cardNumber: '', expiry: '', cvv: '', upiId: '' });
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const closeModal = () => {
    setActivePlan(null);
    setError(null);
    setSuccessData(null);
    setForm({ name: '', email: '', phone: '', cardNumber: '', expiry: '', cvv: '', upiId: '' });
  };

  const {
    step: verificationStep,
    verificationCode,
    requestCode,
    confirmCode,
    reset: resetVerification,
    message: verificationMessage,
    setVerificationCode,
    isConfirming
  } = useFormVerification({
    email: form.email,
    onVerified: () => {
      submitCheckout();
    }
  });

  const submitCheckout = async () => {
    if (!activePlan) return;
    setError(null);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch('/api/membership/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan.id,
          planName: activePlan.name,
          price: activePlan.price,
          name: form.name,
          email: form.email,
          phone: form.phone,
          paymentMethod,
          cardNumber: form.cardNumber,
          upiId: form.upiId,
          honeypot
        }),
        signal: controller.signal,
        credentials: 'include'
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment could not be processed.');
      }
      setSuccessData(data);
      resetVerification();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred while processing payment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;
    if (verificationStep !== 'verified') {
      const sent = await requestCode();
      if (!sent) {
        setError('Failed to send verification code. Please try again.');
      }
      return;
    }
    await submitCheckout();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border p-6 flex flex-col bg-white transition-all ${
              plan.recommended
                ? 'border-accent-sky shadow-lg ring-2 ring-accent-sky/30 lg:-translate-y-2'
                : 'border-slate-200 hover:border-corp-blue/40 hover:shadow-md'
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-sky text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Recommended
              </span>
            )}
            <span className="text-[11px] font-bold text-corp-blue uppercase tracking-wide mb-2">{plan.badge}</span>
            <h3 className="text-navy font-bold text-lg font-heading">{plan.name}</h3>
            <div className="mt-3 mb-5">
              <span className="text-3xl font-extrabold text-navy">₹{plan.price.toLocaleString('en-IN')}</span>
              <span className="text-slate-500 text-sm">/{plan.billingPeriod}</span>
            </div>

            <ul className="space-y-2.5 flex-grow mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={feature.included ? 'text-slate-600' : 'text-slate-350 text-slate-400'}>{feature.label}</span>
                </li>
              ))}
            </ul>

            <button
              id={`join-plan-${plan.id}`}
              onClick={() => onJoinPlan?.(plan)}
              className={`w-full text-center py-2.5 text-sm font-bold rounded-lg transition-all ${
                plan.recommended
                  ? 'bg-accent-sky hover:bg-corp-blue text-white shadow-md'
                  : 'bg-navy hover:bg-corp-blue text-white'
              }`}
            >
              Join Now
            </button>
          </div>
        ))}
      </div>

      {/* PAYMENT / CHECKOUT MODAL */}
      <Dialog
        open={!!activePlan}
        onClose={closeModal}
        label={activePlan ? `${activePlan.name} checkout` : 'Membership checkout'}
        className="max-w-md"
      >
        {activePlan && (
              <>
              {successData ? (
                <div className="animate-slideup text-center space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-4 ring-emerald-500/20">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-heading text-navy">Registered Successfully!</h2>
                    <p className="text-slate-600 text-sm max-w-sm mx-auto">
                      Your registration has been successfully submitted.<br />
                      You will receive a confirmation email shortly.
                    </p>
                  </div>
                  <Button onClick={closeModal} className="w-full justify-center">
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <DialogHeader eyebrow="Checkout" title={activePlan.name} onClose={closeModal} />
                  <p className="text-pale-blue text-xs px-5 -mt-2 pb-3 bg-navy">
                    ₹{activePlan.price.toLocaleString('en-IN')} / {activePlan.billingPeriod}
                  </p>

                  <form onSubmit={handleCheckout} className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                      <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="hidden">
                      <label htmlFor="checkout-honeypot">Do not fill this field if you are human</label>
                      <input id="checkout-honeypot" type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} autoComplete="off" />
                    </div>

                    <TextField
                      label="Full Name *"
                      type="text"
                      required
                      placeholder="e.g., Anjali Sharma"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="Email *"
                        type="email"
                        required
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                      <TextField
                        label="Phone"
                        type="tel"
                        placeholder="10-digit number"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <span id="payment-method-label" className="block text-xs font-semibold text-gray-700 mb-2">Payment Method *</span>
                      <div role="group" aria-labelledby="payment-method-label" className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          aria-pressed={paymentMethod === 'card'}
                          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md border transition-all ${
                            paymentMethod === 'card' ? 'bg-corp-blue border-corp-blue text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          aria-pressed={paymentMethod === 'upi'}
                          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md border transition-all ${
                            paymentMethod === 'upi' ? 'bg-corp-blue border-corp-blue text-white' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" aria-hidden="true" /> UPI
                        </button>
                      </div>

                      {paymentMethod === 'card' ? (
                        <div className="space-y-3">
                          <TextField
                            label="Card Number"
                            className="font-mono"
                            type="text" required placeholder="Card Number" maxLength={19}
                            autoComplete="cc-number"
                            value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <TextField
                              label="Expiry (MM/YY)"
                              className="font-mono"
                              type="text" required placeholder="MM/YY" maxLength={5}
                              autoComplete="cc-exp"
                              value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                            />
                            <TextField
                              label="CVV"
                              className="font-mono"
                              type="text" required placeholder="CVV" maxLength={3}
                              autoComplete="cc-csc"
                              value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <TextField
                          label="UPI ID"
                          className="font-mono"
                          type="text" required placeholder="yourname@upi"
                          value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                        />
                      )}
                    </div>

                     <p className="text-[10px] text-slate-400 pt-1">
                       This is a demo checkout — no real payment is processed. Submitting confirms a simulated transaction for this membership plan.
                     </p>

                       <EmailVerification
                         email={form.email}
                         disabled={loading}
                         verification={{
                           step: verificationStep,
                           verificationCode,
                           requestCode,
                           confirmCode,
                           reset: resetVerification,
                           message: verificationMessage,
                           setVerificationCode,
                           isConfirming
                         }}
                       />

                     <div className="pt-2 flex gap-2.5">
                       <Button type="button" variant="outline" onClick={closeModal} className="flex-1 justify-center">
                         Cancel
                       </Button>
                       <Button type="submit" variant="accent" loading={loading} className="flex-1 justify-center" disabled={verificationStep !== 'verified'}>
                         {loading ? 'Processing...' : verificationStep === 'verified' ? `Pay ₹${activePlan.price.toLocaleString('en-IN')}` : 'Verify Email First'}
                       </Button>
                     </div>
                   </form>
                 </>
               )}
             </>
         )}
       </Dialog>
     </>
   );
 }
