import React, { useState } from 'react';
import {
  Check, X, Sparkles, CreditCard, Smartphone, Loader2, CheckCircle,
  AlertCircle, Mail, ArrowLeft
} from 'lucide-react';
import { membershipPlans, MembershipPlan } from '../cmsData';
import { Button, Dialog, DialogHeader, TextField } from './ui';

export default function MembershipPlans() {
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;
    setError(null);
    setLoading(true);

    try {
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
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment could not be processed.');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while processing payment.');
    } finally {
      setLoading(false);
    }
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
              onClick={() => setActivePlan(plan)}
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
                <div className="animate-slideup">
                  <div className="bg-gradient-to-r from-navy to-corp-blue px-6 py-8 text-white text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-3 ring-4 ring-emerald-500/20">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                    <h2 className="text-lg font-bold font-heading">Payment Successful</h2>
                    <p className="text-pale-blue text-xs mt-1">{successData.planName} is now active.</p>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-pale-blue/40 border border-corp-blue/10 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold">Membership No.</span>
                        <span className="font-mono font-bold text-navy">{successData.membershipNo}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold">Transaction ID</span>
                        <span className="font-mono font-bold text-navy">{successData.paymentId}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold">Amount Paid</span>
                        <span className="font-bold text-navy">₹{successData.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase font-semibold">Payment Method</span>
                        <span className="font-bold text-navy">{successData.paymentRef}</span>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-2 text-[11px] text-slate-600 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-corp-blue" />
                        Simulated Confirmation Email
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[10px] whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                        {successData.emailLog}
                      </div>
                    </div>
                    <Button onClick={closeModal} className="w-full justify-center">
                      Done
                    </Button>
                  </div>
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

                    <div className="pt-2 flex gap-2.5">
                      <Button type="button" variant="outline" onClick={closeModal} className="flex-1 justify-center">
                        Cancel
                      </Button>
                      <Button type="submit" variant="accent" loading={loading} className="flex-1 justify-center">
                        {loading ? 'Processing...' : `Pay ₹${activePlan.price.toLocaleString('en-IN')}`}
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
