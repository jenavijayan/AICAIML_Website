import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface MemberAccessDeniedProps {
  setCurrentPage: (page: string) => void;
  message?: string;
}

export default function MemberAccessDenied({ setCurrentPage, message }: MemberAccessDeniedProps) {
  useDocumentMeta('Access Denied — AICAIML Member Portal', 'Your membership access could not be verified.');

  const handleRegisterNow = () => {
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-heading font-bold text-navy">Access Denied</h1>
          <p className="text-sm text-slate-600">
            {message || 'We couldn\'t find an approved membership for this Google account.'}
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-700">
          Please register for membership or wait for your application to be approved.
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleRegisterNow} className="w-full justify-center">
            Register Now
          </Button>
          <Button variant="outline" onClick={handleBackToHome} className="w-full justify-center">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
