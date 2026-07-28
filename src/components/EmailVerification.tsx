import React from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui';
import { useFormVerification } from '../hooks/useFormVerification';

interface EmailVerificationProps {
  email: string;
  onVerified?: () => void;
  disabled?: boolean;
  verification?: {
    step: 'idle' | 'requesting' | 'verifying' | 'verified' | 'error';
    verificationCode: string;
    requestCode: () => Promise<boolean>;
    confirmCode: () => Promise<boolean>;
    reset: () => void;
    message: string | null;
    setVerificationCode: (code: string) => void;
    isConfirming: boolean;
  };
}

export default function EmailVerification({ email, onVerified, disabled, verification }: EmailVerificationProps) {
  const localVerification = useFormVerification({
    email,
    onVerified
  });

  const { step, verificationCode, requestCode, confirmCode, reset, message, setVerificationCode, isConfirming } = verification || localVerification;

  if (step === 'verified') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-xs text-emerald-800 font-semibold">Email Verified</p>
          <p className="text-[10px] text-emerald-700">{email}</p>
        </div>
      </div>
    );
  }

  if (step === 'idle') {
    return (
      <div className="space-y-2">
        {message && (
          <div className="text-xs p-2.5 rounded flex items-start gap-2 bg-slate-50 text-slate-700">
            <span>{message}</span>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={requestCode}
          disabled={disabled || !email}
          className="w-full justify-center"
          icon={Mail}
        >
          Verify Email Before Submitting
        </Button>
      </div>
    );
  }

  if (step === 'requesting') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-corp-blue animate-spin" />
        <span className="text-xs text-slate-600">Sending verification code...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 font-semibold mb-1">Email Verification Required</p>
        <p className="text-[10px] text-amber-700 mb-2">Enter the 6-digit code sent to {email}</p>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit code"
          className="w-full text-xs rounded border border-amber-300 p-2 mb-2"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="accent"
            onClick={confirmCode}
            loading={isConfirming}
            className="flex-1 justify-center"
          >
            Verify & Continue
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={reset}
            className="shrink-0"
          >
            Reset
          </Button>
        </div>
      </div>
      {message && (
        <div className={`text-xs p-2.5 rounded ${message && (message.includes('Invalid') || message.includes('expired') || message.includes('failed') || message.includes('Error')) ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
