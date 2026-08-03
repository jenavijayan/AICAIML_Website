import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, IconButton, TextField } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import logo from '../images/logo-web.png';

interface LoginProps {
  setCurrentPage: (page: string) => void;
  redirectAfterLogin?: string | null;
}

export default function Login({ setCurrentPage, redirectAfterLogin }: LoginProps) {
  useDocumentMeta('Council Member Sign In', 'Sign in to access AICAIML member courses, certifications, and council registries.');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      setCurrentPage(redirectAfterLogin || 'home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setLoginError(result.error || 'Invalid email or password.');
    }
  };

  return (
    <div id="login-portal-page" className="animate-slideup min-h-[70vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">

        {/* Logo and Headings */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center">
            <img src={logo} alt="AICAIML Logo" width={96} height={96} className="w-full h-full object-contain" />
          </div>
          <h2 className="mt-4 text-2xl font-bold font-heading text-navy">
            Council Member Sign In
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Access secure simulation sandboxes, academic certifications, and council registries.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 text-xs leading-normal flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{loginError}</span>
            </div>
          )}

          <TextField
            label="Email Address *"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-md border border-slate-300 pl-3 pr-10 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <IconButton
                icon={showPassword ? EyeOff : Eye}
                label={showPassword ? 'Hide password' : 'Show password'}
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
              <input type="checkbox" className="rounded text-corp-blue focus:ring-corp-blue" />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => alert("Forgot password? Contact support@aic-aiml.org for manual reset instructions.")}
              className="text-accent-sky hover:text-corp-blue font-semibold"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            id="btn-login-submit"
            loading={loading}
            icon={CheckCircle}
            className="w-full justify-center mt-4"
          >
            {loading ? 'Authorizing...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
          Not yet a member?{' '}
          <button
            onClick={() => setCurrentPage('membership')}
            className="text-accent-sky hover:text-corp-blue font-semibold underline"
          >
            Register Membership
          </button>
        </div>

      </div>
    </div>
  );
}
