import React, { useState } from 'react';
import {
  MapPin, Phone, Mail, CheckCircle, MessageSquare, Clock
} from 'lucide-react';
import { Button, Card, TextField, PageHero } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useFormVerification } from '../hooks/useFormVerification';
import EmailVerification from '../components/EmailVerification';

const EXEMPT_ADMIN_EMAIL = 'vendhanftpwatch@gmail.com';

export default function Contact() {
  useDocumentMeta('Contact', 'Reach the AICAIML Executive Secretariat for course support, institutional registrations, or general enquiries.');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { step: verificationStep, verificationCode, requestCode, confirmCode, reset: resetVerification, message: verificationMessage, setVerificationCode, isConfirming } = useFormVerification({
    email: form.email,
    onVerified: () => {
      submitVerifiedForm();
    }
  });

  const submitVerifiedForm = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch('/api/enquiry/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, honeypot }),
        signal: controller.signal,
        credentials: 'include'
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }
      setSuccess(data);
      setForm({ name: '', email: '', phone: '', message: '' });
      resetVerification();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    if (!form.email) {
      setError('Please provide your email address.');
      return;
    }
    const isExempt = form.email.trim().toLowerCase() === EXEMPT_ADMIN_EMAIL;
    if (isExempt || verificationStep === 'verified') {
      await submitVerifiedForm();
      return;
    }
    if (verificationStep === 'requesting' || verificationStep === 'verifying') {
      return;
    }
    const sent = await requestCode();
    if (!sent) {
      setError('Failed to send verification code. Please try again.');
    }
  };

  const handleResetVerification = () => {
    resetVerification();
    setSuccess(null);
    setError(null);
  };

  return (
    <div id="contact-page" className="animate-slideup">

      <PageHero
        eyebrow="Get in Touch"
        eyebrowIcon={MessageSquare}
        title="Contact AICAIML"
        description="Questions about courses, membership, or partnerships? Reach out and our team will get back to you within 48 hours."
        align="center"
        size="lg"
      />

      {/* CONTACT DETAILS + FORM */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Parameters block */}
            <div className="space-y-8">
              <div>
                <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Reach the Secretariat</span>
                <h3 className="text-3xl font-extrabold text-navy font-heading mt-1">Contact Information</h3>
                <p className="text-slate-600 text-sm mt-2">For institutional registrations, course support, or general help.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-corp-blue border border-slate-100">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy font-heading text-sm">Contact Address</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      52A First Floor, Vijay Block, Laxmi Nagar, Delhi 110092
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-corp-blue border border-slate-100">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy font-heading text-sm">Official Email Desk</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      <a href="mailto:info@aicaiml.org" className="text-corp-blue hover:underline">info@aicaiml.org</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-corp-blue border border-slate-100">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy font-heading text-sm">Direct Phone Channel</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      <a href="tel:+917305764999" className="hover:text-corp-blue hover:underline">+91 73057 64999</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-corp-blue border border-slate-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy font-heading text-sm">Response Time</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Monday–Saturday, 9:00 AM–6:00 PM IST. We typically respond within 48 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
                <div className="rounded-xl overflow-hidden shadow-md border border-slate-200">
                  <div className="bg-navy px-4 py-2.5 text-white text-xs font-semibold flex items-center justify-between">
                    <span>Secretariat Map Coordinates</span>
                    <span className="text-[10px] text-gold font-mono">28.6365° N, 77.2783° E</span>
                  </div>
                  <div className="bg-slate-200 h-48 flex items-center justify-center flex-col text-center p-6 relative">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0B2D5B_2px,transparent_2px)] [background-size:12px_12px] bg-slate-100"></div>
                    <div className="relative z-10 space-y-2">
                      <MapPin className="w-8 h-8 text-rose-600 mx-auto animate-bounce" />
                      <p className="text-xs font-bold text-navy font-heading">Laxmi Nagar, Delhi 110092</p>
                      <a
                        href="https://maps.google.com/?q=52A+Vijay+Block+Laxmi+Nagar+Delhi+110092"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 px-3 py-1 bg-navy text-white text-[10px] font-bold rounded hover:bg-corp-blue transition-colors"
                      >
                        Open in External Map
                      </a>
                    </div>
                  </div>
                </div>
            </div>

            {/* Enquiry Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
              <h4 className="font-bold text-navy font-heading text-lg mb-2">Send Us a Message</h4>
              <p className="text-xs text-slate-500 mb-6">Fill the quick form and we will revert back within 48 hours.</p>

              {success ? (
                <Card className="bg-emerald-50 border-emerald-200 space-y-4 animate-slideup" padding="none">
                  <div className="p-5 space-y-4">
                    <div className="flex gap-2.5 items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h5 className="font-bold text-emerald-900 text-sm">Enquiry Registered Successfully</h5>
                        <p className="text-xs text-emerald-700 mt-1">Your query has been recorded. Reference ID: <strong>{success.referenceId}</strong></p>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-200 p-3 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                      {success.emailLog}
                    </div>
                    <Button variant="ghost" className="w-full justify-center bg-slate-100 hover:bg-slate-200" onClick={() => { setSuccess(null); setForm({ name: '', email: '', phone: '', message: '' }); }}>
                      Submit Another Enquiry
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div role="alert" className="bg-rose-50 text-rose-800 p-3 rounded text-xs">
                      {error}
                    </div>
                  )}

                  {/* Anti-spam Honeypot field */}
                  <div className="hidden">
                    <label htmlFor="contact-honeypot">Do not fill this if you are human</label>
                    <input
                      id="contact-honeypot"
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      label="Your Full Name *"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <TextField
                      label="Email ID *"
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <TextField
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="e.g., +91 9999999999"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-gray-700 mb-1">Your Message / Enquiry Details *</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder="Specify your inquiry details..."
                      className="w-full text-xs rounded-md border border-gray-300 p-2.5 focus:border-accent-sky focus:outline-none bg-white transition-colors"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

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

                  <div className="pt-2">
                    <Button
                      type="button"
                      id="btn-contact-submit"
                      loading={loading}
                      className="w-full justify-center"
                      onClick={handleSubmit}
                      disabled={verificationStep !== 'idle' && verificationStep !== 'verified' && form.email.trim().toLowerCase() !== EXEMPT_ADMIN_EMAIL}
                    >
                      {loading ? 'Submitting...' : 'Submit Query'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
