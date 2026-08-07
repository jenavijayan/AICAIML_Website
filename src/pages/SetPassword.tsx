import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { Button, TextField } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { apiRequest } from '../lib/api';

interface SetPasswordProps {
  tokenFromHash: string;
  onSuccess: () => void;
}

const INVALID_PASSWORD_MESSAGE = 'This password cannot be used. Please choose a different password and try again.';

function isValidMemberPassword(password: string) {
  if (!password || password.length < 8 || password.length > 72) return false;
  if (/\s/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export default function SetPassword({ tokenFromHash, onSuccess }: SetPasswordProps) {
  useDocumentMeta('Set Member Password', 'Create your secure password for AICAIML member dashboard access.');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = useMemo(() => String(tokenFromHash || '').trim(), [tokenFromHash]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Missing or invalid setup token. Please use the email link sent by AICAIML.');
      return;
    }
    if (!isValidMemberPassword(password)) {
      setError(INVALID_PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/auth/member/set-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password })
      });

      setSuccess('Password set successfully. Redirecting to Member Login...');
      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-navy">Set Your Password</h1>
          <p className="text-xs text-slate-500">Create your first member portal password using your secure approval link.</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {error && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <TextField
            label="New Password *"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8-72 chars, upper/lower/number/symbol"
          />

          <TextField
            label="Confirm Password *"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
          />

          <Button type="submit" loading={loading} className="w-full justify-center mt-2">
            {loading ? 'Saving...' : 'Set Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
