import React, { useEffect, useState } from 'react';
import { ShieldCheck, Award, CalendarDays, ExternalLink, LogOut, User } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface MemberWelcomeProps {
  setCurrentPage: (page: string) => void;
}

export default function MemberWelcome({ setCurrentPage }: MemberWelcomeProps) {
  useDocumentMeta('Welcome — AICAIML Member Portal', 'Welcome to your AICAIML member portal.');

  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<{ profile?: any }>('/api/auth/member/dashboard', { method: 'GET' });
        if (active) setProfile(data.profile || null);
      } catch (err: any) {
        if (active) setError(err.message || 'Unable to load your profile.');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => { active = false; };
  }, []);

  const memberName = profile?.name || user?.name || 'Member';
  const membershipId = profile?.membershipNo || user?.membershipNo || 'Not assigned';
  const membershipType = profile?.category || 'Member';

  const handleGoToDashboard = () => {
    setCurrentPage('member-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('member-login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) => (
    <div className="rounded-lg border border-slate-200 p-3 bg-white flex items-center gap-2">
      {Icon ? <Icon className="w-4 h-4 text-slate-500 shrink-0" /> : null}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-slate-800 font-medium">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[72vh] bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-8 h-6" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-navy">Welcome, {memberName}!</h1>
        </div>

        {loading && (
          <div className="text-center py-8 text-sm text-slate-500">
            Loading your membership details...
          </div>
        )}

        {error && !loading && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-3 text-sm flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-navy font-heading mb-4">Membership Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Membership ID" value={membershipId} icon={Award} />
                <InfoRow label="Membership Type" value={membershipType} icon={ShieldCheck} />
                <InfoRow label="Member Name" value={memberName} icon={User} />
                {profile?.joinedDate && (
                  <InfoRow
                    label="Joined Date"
                    value={new Date(profile.joinedDate).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    icon={CalendarDays}
                  />
                )}
              </div>
            </Card>

            <Card className="p-6 bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-600 leading-relaxed">
                Your membership has been approved. Welcome to AICAIML!
              </p>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoToDashboard} className="flex items-center gap-2">
                Go to Dashboard
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
