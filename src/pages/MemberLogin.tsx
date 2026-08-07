import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface MemberLoginProps {
  setCurrentPage: (page: string) => void;
  redirectAfterLogin?: string | null;
}

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export default function MemberLogin({ setCurrentPage, redirectAfterLogin }: MemberLoginProps) {
  useDocumentMeta('Member Portal Login', 'Sign in to access your AICAIML member dashboard, profile, and resources.');

  const { memberGoogleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notApproved, setNotApproved] = useState(false);
  const [showGoogleScript, setShowGoogleScript] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const googleInitializedRef = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured. Please contact support.');
      return;
    }
    setShowGoogleScript(true);
  }, []);

  useEffect(() => {
    if (!showGoogleScript || googleInitializedRef.current || !googleButtonContainerRef.current) return;

    const handleCallback = (response: any) => {
      setLoading(true);
      setError(null);
      setNotApproved(false);

      const credential = response?.credential;
      if (!credential) {
        setError('Google authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      memberGoogleLogin(credential).then((result) => {
        setLoading(false);
        if (!result.success) {
          if (result.notApproved) {
            setNotApproved(true);
            setError(result.error || 'We couldn\'t find an approved membership for this Google account.');
          } else {
            setError(result.error || 'Unable to sign in. Please try again.');
          }
          return;
        }

        setCurrentPage('member-welcome');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    };

    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = 'google-signin-script';
      script.onload = () => {
        googleInitializedRef.current = true;
        initGoogleButton();
      };
      document.body.appendChild(script);
    } else {
      initGoogleButton();
    }

    function initGoogleButton() {
      const google = (window as any).google;
      if (!google || !google.accounts || !google.accounts.id) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCallback
      });

      google.accounts.id.renderButton(
        googleButtonContainerRef.current,
        {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          width: '100%'
        }
      );
    }

    return () => {
      const existing = document.getElementById('google-signin-script');
      if (existing) existing.remove();
    };
  }, [showGoogleScript, memberGoogleLogin, setCurrentPage, redirectAfterLogin]);

  const handleRegisterNow = () => {
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-corp-blue/10 text-corp-blue flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy">Member Portal Login</h1>
          <p className="text-xs text-slate-500">Sign in with your approved Google account.</p>
        </div>

        {error && (
          <div role="alert" className={`border rounded-lg p-3 text-xs mb-4 flex items-start gap-2 ${
            notApproved
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notApproved && (
          <div className="mb-4 text-center">
            <Button
              variant="outline"
              onClick={handleRegisterNow}
              className="w-full justify-center"
            >
              Register Now
            </Button>
          </div>
        )}

        <div ref={googleButtonContainerRef} className="google-signin-container">
          {loading && (
            <div className="text-center py-3 text-sm text-slate-500">
              Signing in...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
