import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, IconButton, TextField } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface MemberLoginProps {
  setCurrentPage: (page: string) => void;
  redirectAfterLogin?: string | null;
}

export default function MemberLogin({ setCurrentPage, redirectAfterLogin }: MemberLoginProps) {
  useDocumentMeta('Member Portal Login', 'Sign in to access your AICAIML member dashboard, profile, and resources.');

  const { memberLogin } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await memberLogin(identifier, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Unable to sign in.');
      return;
    }

    setCurrentPage(redirectAfterLogin || 'member-dashboard');
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
          <p className="text-xs text-slate-500">Use your approved email or membership ID and password.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          {error && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TextField
            label="Email or Membership ID *"
            required
            placeholder="you@example.com or AICAIML-2026-0001"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div>
            <label htmlFor="member-login-password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                id="member-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 pl-3 pr-10 py-2 text-sm focus:border-corp-blue focus:outline-none"
                placeholder="••••••••"
              />
              <IconButton
                icon={showPassword ? EyeOff : Eye}
                label={showPassword ? 'Hide password' : 'Show password'}
                size="sm"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center mt-2">
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </Button>
        </form>
      </div>
    </div>
  );
}
