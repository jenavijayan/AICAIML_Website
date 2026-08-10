import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, CreditCard,
  ArrowRight, Award, BookOpen, Loader2
} from 'lucide-react';

// Import components and pages
import Header from './components/Header';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import MembershipPlans from './components/MembershipPlans';
import { Button, IconButton, TextField } from './components/ui';

import { AuthProvider, useAuth } from './context/AuthContext';

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
const MemberLogin = lazy(() => import('./pages/MemberLogin'));
const MemberWelcome = lazy(() => import('./pages/MemberWelcome'));
const MemberAccessDenied = lazy(() => import('./pages/MemberAccessDenied'));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
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
  const [setPasswordToken, setSetPasswordToken] = useState('');

  // Read hash fragment for back-links from components
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      const [hashPath, hashQuery = ''] = rawHash.split('?');
         if (hashPath && ['home', 'know-aicaiml', 'courses', 'learners', 'events-projects', 'membership', 'login', 'member-login', 'member-welcome', 'member-access-denied', 'member-dashboard', 'set-password', 'verification', 'contact', 'privacy', 'terms', 'benefits-view'].includes(hashPath)) {
        setCurrentPage(hashPath);
        if (hashPath === 'set-password') {
          const params = new URLSearchParams(hashQuery);
          setSetPasswordToken(params.get('token') || '');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (hashPath === 'admin') {
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
                  setCurrentPage={setCurrentPage}
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
                        <MembershipPlans
                          onJoinPlan={(plan) => {
                            const categoryMap: Record<string, 'student' | 'msme' | 'corporate' | 'school' | 'university'> = {
                              'plan-student': 'student',
                              'plan-educator': 'school',
                              'plan-individual': 'student',
                              'plan-institutional': 'university'
                            };
                            const category = categoryMap[plan.id] || 'student';
                            setSelectedCategory(category);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
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

            {currentPage === 'member-login' && (
              <Suspense fallback={<RouteFallback />}>
                <MemberLogin
                  setCurrentPage={setCurrentPage}
                  redirectAfterLogin={redirectAfterLogin}
                />
              </Suspense>
            )}

             {currentPage === 'member-welcome' && (
               <Suspense fallback={<RouteFallback />}>
                 <MemberWelcome
                   setCurrentPage={setCurrentPage}
                 />
               </Suspense>
             )}

             {currentPage === 'member-access-denied' && (
               <Suspense fallback={<RouteFallback />}>
                 <MemberAccessDenied
                   setCurrentPage={setCurrentPage}
                 />
               </Suspense>
             )}

            {currentPage === 'set-password' && (
              <Suspense fallback={<RouteFallback />}>
                <SetPassword
                  tokenFromHash={setPasswordToken}
                  onSuccess={() => setCurrentPage('member-login')}
                />
              </Suspense>
            )}

            {currentPage === 'member-dashboard' && user?.role === 'member' && (
              <Suspense fallback={<RouteFallback />}>
                <MemberDashboard onGoToMemberLogin={() => setCurrentPage('member-login')} />
              </Suspense>
            )}

            {currentPage === 'member-dashboard' && !user?.role && (
              <Suspense fallback={<RouteFallback />}>
                <MemberLogin
                  setCurrentPage={setCurrentPage}
                  redirectAfterLogin="member-dashboard"
                />
              </Suspense>
            )}

            {currentPage === 'member-dashboard' && user?.role && user.role !== 'member' && (
              <div className="min-h-[55vh] px-4 py-12 bg-slate-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
                  <h2 className="text-xl font-bold text-navy">Member Dashboard Access</h2>
                  <p className="text-sm text-slate-600">This dashboard is available only for approved member accounts.</p>
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="px-4 py-2 rounded-md bg-corp-blue text-white text-sm font-semibold"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
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
      <CookieConsent onOpenPrivacyPage={() => setCurrentPage('privacy') />

    </div>
  );
}
