import React, { useState } from 'react';
import {
  ShieldCheck, Search, CheckCircle2, XCircle, Award,
  CreditCard, Calendar, Hash
} from 'lucide-react';
import { Button, Card, PageHero } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface VerifyResult {
  found: boolean;
  type?: 'certificate' | 'membership';
  holderName?: string;
  courseTitle?: string;
  planName?: string;
  issuedAt?: string;
  code?: string;
  status?: string;
}

export default function Verification() {
  useDocumentMeta('Verify a Certificate or Membership', 'Confirm a certificate or membership number was genuinely issued by AICAIML.');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code.trim())}`);
      const data: VerifyResult = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div id="verification-page" className="animate-slideup">

      <PageHero
        eyebrow="Verification Services"
        eyebrowIcon={ShieldCheck}
        title="Verify a Certificate or Membership"
        description="Enter a certificate verification code or membership number to confirm it was genuinely issued by AICAIML."
        align="center"
        size="lg"
      />

      {/* SEARCH + RESULT */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g., AICAIML-CERT-COURSE-4-A1B2C3 or AIC-MEM-123456"
                className="w-full text-sm rounded-md border border-slate-300 pl-10 pr-3 py-3 focus:border-corp-blue focus:outline-none font-mono"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" loading={loading} icon={Search} className="shrink-0">
              Verify
            </Button>
          </form>

          {searched && result && (
            <div className="mt-8 animate-slideup">
              {result.found ? (
                <Card className="bg-emerald-50 border-emerald-200 space-y-5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Valid — this record was issued by AICAIML</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Holder Name</span>
                      <span className="font-bold text-navy">{result.holderName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">
                        {result.type === 'certificate' ? 'Course' : 'Membership Plan'}
                      </span>
                      <span className="font-bold text-navy flex items-center gap-1.5">
                        {result.type === 'certificate' ? <Award className="w-4 h-4 text-gold" /> : <CreditCard className="w-4 h-4 text-gold" />}
                        {result.type === 'certificate' ? result.courseTitle : result.planName}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Issued</span>
                      <span className="font-bold text-navy flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(result.issuedAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Reference Code</span>
                      <span className="font-mono font-bold text-navy text-xs">{result.code}</span>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="bg-rose-50 border-rose-200 text-center space-y-2">
                  <XCircle className="w-8 h-8 text-rose-600 mx-auto" aria-hidden="true" />
                  <h3 className="font-bold text-rose-800">No matching record found</h3>
                  <p className="text-rose-700 text-sm">
                    We couldn't find a certificate or membership with this code. Double-check the code and try again.
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
