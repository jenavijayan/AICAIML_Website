import React, { useRef, useEffect, useCallback } from 'react';
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = verificationCode.split('').slice(0, 6);

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    if (step === 'verifying' && verificationCode.length === 6) {
      confirmCode();
    }
  }, [step, verificationCode, confirmCode]);

  useEffect(() => {
    if (step === 'verifying' && verificationCode.length > 0 && verificationCode.length < 6) {
      focusInput(verificationCode.length);
    }
  }, [step, verificationCode, focusInput]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    const newCode = newDigits.join('').slice(0, 6);
    setVerificationCode(newCode);
    if (cleaned && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setVerificationCode(pasted);
    if (pasted.length > 0) {
      focusInput(Math.min(pasted.length, 5));
    }
  };

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
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              placeholder="-"
              className="w-12 h-14 text-center text-sm rounded-md border border-amber-300 bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              value={digits[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              required
            />
          ))}
        </div>
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
