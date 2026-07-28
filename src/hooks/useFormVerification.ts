import { useState, useCallback } from 'react';

interface UseFormVerificationOptions {
  email: string;
  onVerified?: () => void;
}

interface UseFormVerificationReturn {
  step: 'idle' | 'requesting' | 'verifying' | 'verified' | 'error';
  verificationCode: string;
  requestCode: () => Promise<boolean>;
  confirmCode: () => Promise<boolean>;
  reset: () => void;
  message: string | null;
  setVerificationCode: (code: string) => void;
  isConfirming: boolean;
}

export function useFormVerification({ email, onVerified }: UseFormVerificationOptions): UseFormVerificationReturn {
  const [step, setStep] = useState<UseFormVerificationReturn['step']>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const requestCode = useCallback(async (): Promise<boolean> => {
    if (!email) return false;
    setStep('requesting');
    setMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setStep('verifying');
      return true;
    } catch (err: any) {
      setMessage(err.message || 'Failed to send verification code.');
      setStep('error');
      return false;
    }
  }, [email]);

  const confirmCode = useCallback(async (): Promise<boolean> => {
    if (!email || !verificationCode) {
      setMessage('Please enter the 6-digit verification code.');
      return false;
    }
    setStep('verifying');
    setIsConfirming(true);
    setMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      setStep('verified');
      onVerified?.();
      return true;
    } catch (err: any) {
      setMessage(err.message || 'Verification failed.');
      setStep('verifying');
      return false;
    } finally {
      setIsConfirming(false);
    }
  }, [email, verificationCode, onVerified]);

  const reset = useCallback(() => {
    setStep('idle');
    setVerificationCode('');
    setMessage(null);
    setIsConfirming(false);
  }, []);

  return {
    step,
    verificationCode,
    requestCode,
    confirmCode,
    reset,
    message,
    setVerificationCode,
    isConfirming
  };
}
