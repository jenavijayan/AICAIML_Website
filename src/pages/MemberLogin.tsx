import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck, LogOut, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const GIS_SCRIPT_ID = 'aicaiml-gis';
const GOOGLE_CLIENT_ID = (import.meta?.env?.VITE_GOOGLE_CLIENT_ID || '').trim();

interface MemberLoginProps {
  setCurrentPage: (page: string) => void;
  redirectAfterLogin?: string | null;
}

function loadGoogleGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Sign-In is not available on this environment.'));
      return;
    }
    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onReady = () => {
        if (window.google?.accounts?.id) {
          resolve();
        } else if (existing.dataset.loaded === 'true') {
          resolve();
        } else {
          setTimeout(onReady, 50);
        }
      };
      onReady();
      return;
    }

    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let checks = 0;
      const poll = () => {
        if (window.google?.accounts?.id) {
          script.dataset.loaded = 'true';
          resolve();
          return;
        }
        if (checks < 40) {
          checks += 1;
          setTimeout(poll, 50);
          return;
        }
        reject(new Error('Google Sign-In library failed to initialize.'));
      };
      poll();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Sign-In library.'));
    };
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: Record<string, unknown>) => void) => void;
          renderButton: (parent: HTMLElement | null, options?: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default function MemberLogin({ setCurrentPage, redirectAfterLogin }: MemberLoginProps) {
  useDocumentMeta('Member Portal Login', 'Sign in with your approved Google account to access the AICAIML member portal.');

  const { memberLogin, memberGoogleLogin, logout } = useAuth();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const gisInitialized = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'email' | 'google'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    const container = buttonRef.current;

    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    loadGoogleGisScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) {
          setError('Google Sign-In is not available right now. Please try again later.');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (credential: { credential?: string; select_by?: string }) => {
            const idToken = credential?.credential;
            if (!idToken) {
              setError('Google authentication returned no token. Please try again.');
              return;
            }
            handleGoogleCredential(idToken).catch(() => {});
          },
          auto_select_end: true,
          cancel_on_tap_out: false
        });

        if (!gisInitialized.current && container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'sign_in_with',
            shape: 'rectangular',
            width: 280
          });
          window.google.accounts.id.disableAutoSelect();
          gisInitialized.current = true;
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Google Sign-In is not available right now.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleCredential = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await memberGoogleLogin(idToken);
      if (!result.success) {
        if (result.notApproved) {
          setCurrentPage('member-access-denied');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        setError(result.error || 'Unable to complete sign-in. Please try again.');
        return;
      }
      setMemberName(result.user?.name || result.user?.email || 'Member');
      setSignedIn(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await memberLogin(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password.');
        return;
      }
      setMemberName(email);
      setSignedIn(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setCurrentPage(redirectAfterLogin || 'member-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterNow = () => {
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (signedIn) {
    return (
      <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-8 h-6" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-navy">Welcome, {memberName}!</h1>
          <p className="text-slate-600">Your membership has been approved.</p>
          <p className="text-sm text-slate-500">You now have access to the AICAIML member portal.</p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleGoToDashboard} className="flex items-center gap-2">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={async () => { await logout(); setCurrentPage('home'); }} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-corp-blue/10 text-corp-blue flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy">Member Portal Login</h1>
          <p className="text-xs text-slate-500">Sign in with your registered email and password.</p>
        </div>

        {error && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs flex items-start gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && loginMode === 'email' && (
          <div className="text-center py-4 text-sm text-slate-500">
            Verifying your credentials...
          </div>
        )}

        {loginMode === 'email' && (
          <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="member-email" className="block text-xs font-semibold text-slate-700 mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="member-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="member-password" className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="member-password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Use the password sent to your email.</p>
            </div>
            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center"
            >
              Sign In
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 mb-3">Or continue with</p>
          <div className="flex justify-center">
            <div ref={buttonRef} className="w-full flex justify-center" />
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Not yet a member?{' '}
          <button
            type="button"
            onClick={handleRegisterNow}
            className="text-accent-sky hover:text-corp-blue font-semibold underline"
          >
            Register Now
          </button>
        </div>

        <div className="mt-2 text-center">
          <Button variant="ghost" size="sm" onClick={async () => { await logout(); setCurrentPage('home'); }}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
