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

  function toFriendlyError(err: any, fallback: string) {
    const name = String(err?.name || '');
    const message = String(err?.message || '');
    const lowered = message.toLowerCase();
    if (name === 'AbortError' || lowered.includes('aborted')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    return message || fallback;
  }

  async function parseApiResponse(res: Response) {
    const text = await res.text();
    if (!text) return {} as any;
    try {
      return JSON.parse(text);
    } catch {
      const snippet = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      throw new Error(`Server returned an invalid response. ${snippet || 'Non-JSON body received.'}`);
    }
  }

  const requestCode = useCallback(async (): Promise<boolean> => {
    if (!email) return false;
    if (step === 'requesting') return false;
    setStep('requesting');
    setMessage(null);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setStep('verifying');
      return true;
    } catch (err: any) {
      setMessage(toFriendlyError(err, 'Failed to send verification code.'));
      setStep('error');
      return false;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [email, step]);

  const confirmCode = useCallback(async (): Promise<boolean> => {
    if (!email || !verificationCode) {
      setMessage('Please enter the 6-digit verification code.');
      return false;
    }
    setStep('verifying');
    setIsConfirming(true);
    setMessage(null);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('/api/verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: verificationCode.trim() }),
        signal: controller.signal
      });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      setStep('verified');
      onVerified?.();
      return true;
    } catch (err: any) {
      setMessage(toFriendlyError(err, 'Verification failed.'));
      setStep('verifying');
      return false;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
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
