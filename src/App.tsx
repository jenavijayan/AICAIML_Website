import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, X, CreditCard, Heart, CheckCircle, Mail, AlertCircle,
  ArrowRight, Info, Copy, Calendar, MapPin, DollarSign, Award, Clock, BookOpen, Loader2
} from 'lucide-react';

// Import components and pages
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import MembershipPlans from './components/MembershipPlans';
import { Button, IconButton, Dialog, DialogHeader, TextField } from './components/ui';
import EmailVerification from './components/EmailVerification';

import { UpcomingEvent } from './cmsData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFormVerification } from './hooks/useFormVerification';

import Home from './pages/Home';
const KnowAICAIML = lazy(() => import('./pages/KnowAICAIML'));
const Verification = lazy(() => import('./pages/Verification'));
const Contact = lazy(() => import('./pages/Contact'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Learners = lazy(() => import('./pages/Learners'));
const EventsProjects = lazy(() => import('./pages/EventsProjects'));
const Benefits = lazy(() => import('./pages/Benefits'));
const Login = lazy(() => import('./pages/Login'));
const Legal = lazy(() => import('./pages/Legal'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MembershipForms = lazy(() => import('./components/MembershipForms'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 text-corp-blue animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<'student' | 'msme' | 'corporate' | 'school' | 'university' | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  // Modal States
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [activeRegEvent, setActiveRegEvent] = useState<UpcomingEvent | null>(null);

  // Donation interactive state
  const [donationAmount, setDonationAmount] = useState('5000');
  const [customDonation, setCustomDonation] = useState('');
  const [donationHoneypot, setDonationHoneypot] = useState('');
  const [donationSuccess, setDonationSuccess] = useState<any | null>(null);
  const [donationForm, setDonationForm] = useState({ name: '', email: '', panNo: '' });

  // Form registration states (inside registration modal)
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', organization: '', designation: '' });
  const [regHoneypot, setRegHoneypot] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const {
    step: regVerificationStep,
    verificationCode: regVerificationCode,
    requestCode: requestRegCode,
    confirmCode: confirmRegCode,
    reset: resetRegVerification,
    message: regVerifyMessage,
    setVerificationCode: setRegVerificationCode,
    isConfirming: regIsConfirming
  } = useFormVerification({
    email: regForm.email,
    onVerified: () => {
      submitEventRegistration();
    }
  });

  const submitEventRegistration = async () => {
    if (!activeRegEvent) return;
    setRegLoading(true);
    setRegError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeRegEvent.id,
          eventTitle: activeRegEvent.title,
          ...regForm,
          honeypot: regHoneypot
        }),
        signal: controller.signal,
        credentials: 'include'
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit event registration.');
      }
      setRegSuccess(data);
      setRegForm({ name: '', email: '', phone: '', organization: '', designation: '' });
      resetRegVerification();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setRegError('Request timed out. Please check your connection and try again.');
      } else {
        setRegError(err.message || 'An unexpected server error occurred.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  // Event Register submit
  const handleEventRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegEvent) return;
    setRegError(null);
    if (regVerificationStep === 'verified') {
      await submitEventRegistration();
      return;
    }
    const sent = await requestRegCode();
    if (!sent) {
      setRegError('Failed to send verification code. Please try again.');
    }
  };

  // Donation submit
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (donationHoneypot) return; // Silent spam fail

    const amount = customDonation || donationAmount;
    const refNo = 'AIC-DON-' + Math.floor(100000 + Math.random() * 900000);

    const log = `
      Subject: [AICAIML] Donation Receipt Received - Ref: ${refNo}
      To: ${donationForm.email}
      
      Dear ${donationForm.name},
      
      We acknowledge receipt of your donation request to the All India Council for Artificial Intelligence and Machine Learning.
      
      DONATION RECEIPT SUMMARY:
      - Receipt Reference No: ${refNo}
      - Contributor: ${donationForm.name}
      - Pledged Amount: INR ${amount}
      - PAN Card Number: ${donationForm.panNo || 'Not provided'}
      - Council Tax Exemption Code: Sec 80G compliant
      
      Please complete the bank transfer (NEFT/RTGS) to the official Council bank account below to lock in this receipt.
      
      COUNCIL BANK DETAILS:
      - Account Name: All India Council for Artificial Intelligence and Machine Learning
      - Bank Name: State Bank of India
      - Branch: Noida Sector 62 Commercial Branch
      - Account No: 40991203456
      - IFSC Code: SBIN0001029
      
      Thank you for supporting deep-tech research and educational sandboxes in India.
      
      Sincerely,
      Treasury Desk, AICAIML Council
    `;

    setDonationSuccess({
      refNo,
      amount,
      log
    });
  };

  const handleCopyBank = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied to clipboard: ${text}`);
  };

  // Read hash fragment for back-links from components
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'know-aicaiml', 'courses', 'learners', 'events-projects', 'membership', 'login', 'verification', 'contact', 'privacy', 'terms', 'benefits-view'].includes(hash)) {
        setCurrentPage(hash);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (hash === 'admin') {
        setCurrentPage('admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentPage !== 'login') {
      setRedirectAfterLogin(null);
    }
  }, [currentPage]);

  return (
    <div id="aicaiml-root" className="min-h-screen bg-white flex flex-col font-sans">

      {/* Bypasses the header nav for keyboard users — visually hidden until focused */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* GLOBAL HEADER */}
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* RENDER ACTIVE PAGE */}
      <main id="main-content" className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + (selectedCategory || '')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentPage === 'home' && (
              <Home 
                setCurrentPage={setCurrentPage} 
                setSelectedCategory={setSelectedCategory}
                onOpenRegisterEventModal={(event) => {
                  setRegSuccess(null);
                  setRegError(null);
                  setActiveRegEvent(event);
                }}
              />
            )}

            {currentPage === 'know-aicaiml' && (
              <Suspense fallback={<RouteFallback />}>
                <KnowAICAIML />
              </Suspense>
            )}

            {currentPage === 'verification' && (
              <Suspense fallback={<RouteFallback />}>
                <Verification />
              </Suspense>
            )}

            {currentPage === 'contact' && (
              <Suspense fallback={<RouteFallback />}>
                <Contact />
              </Suspense>
            )}

            {currentPage === 'courses' && (
              <Suspense fallback={<RouteFallback />}>
                <Courses
                  setCurrentPage={setCurrentPage}
                  onSelectCourse={(courseId) => {
                    setSelectedCourseId(courseId);
                    setCurrentPage('course-detail');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Suspense>
            )}

            {currentPage === 'course-detail' && selectedCourseId && (
              <Suspense fallback={<RouteFallback />}>
                <CourseDetail
                  courseId={selectedCourseId}
                  setCurrentPage={setCurrentPage}
                  onBack={() => {
                    setCurrentPage('courses');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </Suspense>
            )}

            {currentPage === 'learners' && (
              <Suspense fallback={<RouteFallback />}>
                <Learners />
              </Suspense>
            )}

            {currentPage === 'events-projects' && (
              <Suspense fallback={<RouteFallback />}>
                <EventsProjects 
                  onOpenRegisterEventModal={(event) => {
                    setRegSuccess(null);
                    setRegError(null);
                    setActiveRegEvent(event);
                  }}
                />
              </Suspense>
            )}

            {currentPage === 'membership' && (
              <div className="py-12 md:py-20 bg-slate-50 min-h-[80vh]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {selectedCategory ? (
                    <Suspense fallback={<RouteFallback />}>
                      <MembershipForms
                        category={selectedCategory}
                        onBack={() => setSelectedCategory(null)}
                      />
                    </Suspense>
                  ) : (
                    <div className="space-y-16">
                      {/* Pricing Plans with live checkout */}
                      <div className="space-y-8">
                        <div className="text-center max-w-2xl mx-auto space-y-3">
                          <span className="text-xs uppercase text-accent-sky font-bold tracking-widest">Membership Plans</span>
                          <h1 className="text-3xl font-bold text-navy font-heading text-gradient-animate">Choose the Right Plan for You</h1>
                          <p className="text-slate-500 text-sm">
                            Pick a plan and pay securely to activate your membership instantly.
                          </p>
                        </div>
                        <MembershipPlans />
                      </div>

                      {/* Institutional registration (no fixed price, reviewed application) */}
                      <div className="space-y-8 pt-4 border-t border-slate-200">
                        <div className="text-center max-w-2xl mx-auto space-y-3">
                          <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Institutional Enrollment Registry</span>
                          <h2 className="text-2xl font-bold text-navy font-heading">Registering as an Institution or Organization?</h2>
                          <p className="text-slate-500 text-sm">
                            MSMEs, corporates, schools, colleges and universities go through a reviewed application instead of the plans above.
                          </p>
                        </div>

                      {/* 5 illustrated category cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[
                          { id: 'student' as const, title: 'Student', icon: Award, color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700', desc: 'Diploma, Undergraduate and Graduate enrollments for certification pipelines.' },
                          { id: 'msme' as const, title: 'MSME', icon: Shield, color: 'border-blue-200 bg-blue-50/40 text-blue-700', desc: 'Proprietorships, partnerships, LLPs seeking tech-transfer models.' },
                          { id: 'corporate' as const, title: 'Associate Partner', icon: CreditCard, color: 'border-purple-200 bg-purple-50/40 text-purple-700', desc: 'Established companies collaborating on CSR and FDP setups.' },
                          { id: 'school' as const, title: 'School / College', icon: BookOpen, color: 'border-amber-200 bg-amber-50/40 text-amber-700', desc: 'Secondary schools and polytechnics creating campus AI & Robotics clubs.' },
                          { id: 'university' as const, title: 'University', icon: Award, color: 'border-rose-200 bg-rose-50/40 text-rose-700', desc: 'Central, state and deemed universities launching advanced CoEs.' }
                        ].map((cat) => {
                          const IconComp = cat.icon;

                          return (
                            <div 
                              key={cat.id} 
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`rounded-2xl border p-5 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer bg-white border-slate-200/60 hover:border-corp-blue group`}
                            >
                              <div className="space-y-4">
                                <div className={`p-3 rounded-xl w-fit ${cat.color} group-hover:scale-105 transition-transform`}>
                                  <IconComp className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-navy text-base font-heading group-hover:text-corp-blue transition-colors">{cat.title}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">{cat.desc}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(cat.id);
                                }}
                                className="mt-6 w-full text-center py-2 bg-navy text-white hover:bg-corp-blue text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <span>Register Form</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Redirect to Benefits Page */}
                      <div className="bg-white border rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 max-w-4xl mx-auto shadow-sm">
                        <div className="space-y-1 text-center md:text-left">
                          <h4 className="font-bold text-navy font-heading text-lg">Unsure about membership privileges?</h4>
                          <p className="text-slate-500 text-xs">Read the detailed advantages and bullets tailored for each technical partner segment.</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            // Inject fake state to render Benefits inside dynamic view
                            setCurrentPage('benefits-view');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-5 py-2.5 bg-corp-blue hover:bg-navy text-white text-xs font-bold rounded-md transition-all inline-flex items-center gap-1.5 shrink-0"
                        >
                          <span>Explore Full Benefits Grid</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentPage === 'benefits-view' && (
              <Suspense fallback={<RouteFallback />}>
                <Benefits onJoinClick={(cat) => {
                  setSelectedCategory(cat);
                  setCurrentPage('membership');
                }} />
              </Suspense>
            )}

            {currentPage === 'login' && (
              <Suspense fallback={<RouteFallback />}>
                <Login 
                  setCurrentPage={setCurrentPage} 
                  redirectAfterLogin={redirectAfterLogin}
                />
              </Suspense>
            )}

             {currentPage === 'admin' && user?.role === 'admin' && (
               <Suspense fallback={<RouteFallback />}>
                 <AdminDashboard />
               </Suspense>
              )}

             {currentPage === 'admin' && !user?.role && (
               <Suspense fallback={<RouteFallback />}>
                 <Login 
                   setCurrentPage={(page) => {
                     setRedirectAfterLogin(null);
                     setCurrentPage(page);
                   }}
                   redirectAfterLogin="admin"
                 />
               </Suspense>
              )}

             {currentPage === 'privacy' && (
               <Suspense fallback={<RouteFallback />}>
                 <Legal initialSection="privacy" />
               </Suspense>
              )}
             {currentPage === 'terms' && (
               <Suspense fallback={<RouteFallback />}>
                 <Legal initialSection="terms" />
               </Suspense>
              )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* GLOBAL FOOTER */}
      <Footer setCurrentPage={setCurrentPage} />

      {/* COOKIE CONSENT BANNER */}
      <CookieConsent onOpenPrivacyPage={() => setCurrentPage('privacy')} />

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: EVENT INTEREST REGISTRATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={!!activeRegEvent}
        onClose={() => setActiveRegEvent(null)}
        label={activeRegEvent ? `Register interest — ${activeRegEvent.title}` : 'Register interest'}
        className="max-w-lg"
      >
        {activeRegEvent && (
          <>
            <DialogHeader
              eyebrow="AICAIML Registration Registry"
              title={activeRegEvent.title}
              onClose={() => setActiveRegEvent(null)}
            />

            {/* Form body */}
            <div className="p-6 overflow-y-auto space-y-4">

              {regSuccess ? (
                <div className="space-y-4 animate-slideup">
                  <div className="flex gap-2.5 items-start">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h5 className="font-bold text-emerald-900 text-sm">Interest Registered!</h5>
                      <p className="text-xs text-emerald-700 mt-1">
                        You have successfully registered interest. Registration Ticket: <strong>{regSuccess.registrationId}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-3 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {regSuccess.emailLog}
                  </div>

                  <Button className="w-full justify-center" onClick={() => { setActiveRegEvent(null); setRegSuccess(null); resetRegVerification(); }}>
                    Close Modal
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEventRegisterSubmit} className="space-y-4">
                  {regError && (
                    <div role="alert" className="bg-rose-50 text-rose-800 p-3 rounded text-xs">
                      {regError}
                    </div>
                  )}

                  {/* Honeypot anti-spam check */}
                  <div className="hidden">
                    <label htmlFor="event-reg-honeypot">Do not fill if human</label>
                    <input
                      id="event-reg-honeypot"
                      type="text"
                      value={regHoneypot}
                      onChange={(e) => setRegHoneypot(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400">Event Date</span>
                      <span className="font-semibold text-navy flex items-center gap-1 mt-0.5"><Calendar className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> {activeRegEvent.date}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Venue / Access</span>
                      <span className="font-semibold text-navy flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5 text-gold" aria-hidden="true" /> {activeRegEvent.venue}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <TextField
                      label="Your Full Name *"
                      type="text"
                      required
                      placeholder="e.g., Anjali Sharma"
                      autoComplete="name"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    />
                    <TextField
                      label="Your Email ID *"
                      type="email"
                      required
                      placeholder="anjali@domain.com"
                      autoComplete="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="Organization / Inst Name"
                        type="text"
                        placeholder="e.g., IIT Delhi"
                        value={regForm.organization}
                        onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                      />
                      <TextField
                        label="Designation"
                        type="text"
                        placeholder="e.g., Student, Lecturer"
                        value={regForm.designation}
                        onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                      />
                    </div>
                  </div>

                  <EmailVerification
                    email={regForm.email}
                    disabled={regLoading}
                    verification={{
                      step: regVerificationStep,
                      verificationCode: regVerificationCode,
                      requestCode: requestRegCode,
                      confirmCode: confirmRegCode,
                      reset: resetRegVerification,
                      message: regVerifyMessage,
                      setVerificationCode: setRegVerificationCode,
                      isConfirming: regIsConfirming
                    }}
                  />

                  <p className="text-[10px] text-slate-400">
                    * Registering interest alerts the events coordination desk. Seat allocations and virtual links will be emailed 24 hours prior.
                  </p>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveRegEvent(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="accent" size="sm" loading={regLoading} className="min-w-[120px]" disabled={regVerificationStep !== 'verified'}>
                      {regLoading ? 'Registering...' : regVerificationStep === 'verified' ? 'Register Ticket' : 'Verify Email First'}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          </>
        )}
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: DONATION COMPLIANCE & BANK DETAILS MODAL */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        label="Support AICAIML research donations"
        className="max-w-lg"
      >
        <>
              {/* Header */}
              <div className="bg-navy p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-gold fill-current" aria-hidden="true" />
                  <h4 className="font-bold text-base font-heading">Support AICAIML Research (Donations)</h4>
                </div>
                <IconButton
                  icon={X}
                  label="Close dialog"
                  variant="solid"
                  onClick={() => setIsDonationOpen(false)}
                />
              </div>

              {/* Form body */}
              <div className="p-6 overflow-y-auto space-y-5">

                {donationSuccess ? (
                  <div className="space-y-4 animate-slideup">
                    <div className="flex gap-2.5 items-start bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h5 className="font-bold text-emerald-900 text-sm">Donation Registered</h5>
                        <p className="text-xs text-emerald-700 mt-1">
                          A pledge for <strong>INR {donationSuccess.amount}</strong> has been registered. Reference: <strong>{donationSuccess.refNo}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">COUNCIL BANKING COORDINATES (NEFT/RTGS)</span>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-700">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Bank Name</span>
                          <span className="font-bold text-navy">State Bank of India</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Branch Name</span>
                          <span className="font-bold text-navy">Noida Sector 62 Branch</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Account No.</span>
                          <span className="font-bold text-navy select-all flex items-center gap-1">
                            40991203456
                            <IconButton icon={Copy} label="Copy account number" size="sm" className="text-corp-blue hover:text-navy hover:bg-transparent w-5 h-5" onClick={() => handleCopyBank('40991203456')} />
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">IFSC Code</span>
                          <span className="font-bold text-navy select-all flex items-center gap-1">
                            SBIN0001029
                            <IconButton icon={Copy} label="Copy IFSC code" size="sm" className="text-corp-blue hover:text-navy hover:bg-transparent w-5 h-5" onClick={() => handleCopyBank('SBIN0001029')} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-200 p-3 rounded font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {donationSuccess.log}
                    </div>

                    <Button className="w-full justify-center" onClick={() => setIsDonationOpen(false)}>
                      Close Receipt
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleDonationSubmit} className="space-y-4">

                    {/* Honeypot spam check */}
                    <div className="hidden">
                      <label htmlFor="donation-honeypot">Do not fill this field if you are human</label>
                      <input
                        id="donation-honeypot"
                        type="text"
                        value={donationHoneypot}
                        onChange={(e) => setDonationHoneypot(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    <fieldset className="space-y-1">
                      <legend className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Pledged Amount (INR)</legend>
                      <div role="group" aria-label="Preset donation amounts" className="grid grid-cols-4 gap-2">
                        {['1000', '5000', '10000', '25000'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            aria-pressed={donationAmount === amt && !customDonation}
                            onClick={() => {
                              setDonationAmount(amt);
                              setCustomDonation('');
                            }}
                            className={`py-2 text-xs font-bold border rounded-lg transition-all ${
                              donationAmount === amt && !customDonation
                                ? 'bg-corp-blue border-corp-blue text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            ₹{Number(amt).toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <TextField
                      label="Or Enter Custom Amount (INR)"
                      type="number"
                      placeholder="e.g., 50000"
                      value={customDonation}
                      onChange={(e) => {
                        setCustomDonation(e.target.value);
                        setDonationAmount('');
                      }}
                    />

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <TextField
                        label="Your Full Name *"
                        type="text"
                        required
                        placeholder="e.g., Harish Chandra"
                        autoComplete="name"
                        value={donationForm.name}
                        onChange={(e) => setDonationForm({ ...donationForm, name: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField
                          label="Email ID *"
                          type="email"
                          required
                          placeholder="harish@gmail.com"
                          autoComplete="email"
                          value={donationForm.email}
                          onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
                        />
                        <TextField
                          label="PAN Card No. (For Tax Claim) *"
                          type="text"
                          required
                          placeholder="e.g., ABCDE1234F"
                          className="font-mono uppercase"
                          value={donationForm.panNo}
                          onChange={(e) => setDonationForm({ ...donationForm, panNo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex gap-2 text-[10px] text-slate-500 leading-normal">
                      <Info className="w-4.5 h-4.5 text-corp-blue shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        Tax Exemption under Section 80G is eligible for individual and corporate contributors. On registering the pledge, our treasury team dispatches an official receipt with bank transfer guidelines.
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsDonationOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="accent" size="sm">
                        Register Donation Pledge
                      </Button>
                    </div>
                  </form>
                )}

              </div>
        </>
      </Dialog>

    </div>
  );
}
