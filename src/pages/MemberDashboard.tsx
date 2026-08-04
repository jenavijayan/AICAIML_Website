import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, Phone, UserCircle2 } from 'lucide-react';
import { Card } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const MENU = [
  'Dashboard',
  'Profile',
  'Courses',
  'Certificates',
  'Events',
  'Downloads',
  'Notifications',
  'Settings'
] as const;

interface MemberDashboardProps {
  onGoToMemberLogin: () => void;
}

export default function MemberDashboard({ onGoToMemberLogin }: MemberDashboardProps) {
  useDocumentMeta('Member Dashboard', 'Access your approved AICAIML member dashboard and profile.');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/auth/member/dashboard', { credentials: 'include' });
        const text = await res.text();
        let payload: any = {};
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch {
            payload = {};
          }
        }

        if (!res.ok) {
          if (res.status === 401 && active) {
            onGoToMemberLogin();
            return;
          }
          if (active) setError(payload?.error || 'Failed to load dashboard.');
          return;
        }

        if (active) setData(payload);
      } catch {
        if (active) setError('Unable to load dashboard right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [onGoToMemberLogin]);

  const profile = useMemo(() => data?.profile || null, [data]);

  return (
    <div className="min-h-[75vh] bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-white border border-slate-200 rounded-2xl p-4 h-fit">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider px-2 mb-2">Member Panel</h2>
          <nav className="space-y-1">
            {MENU.map((item, idx) => (
              <button
                key={item}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${idx === 0 ? 'bg-corp-blue text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-5">
          <Card className="p-5">
            <h1 className="text-2xl font-heading font-bold text-navy">Member Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">This is your active dashboard. Other sections are scaffolded and ready for phased rollout.</p>
          </Card>

          {loading && <Card className="p-5 text-sm text-slate-600">Loading your member profile...</Card>}

          {error && !loading && (
            <Card className="p-5 text-sm text-rose-700 border-rose-200 bg-rose-50">{error}</Card>
          )}

          {!loading && !error && profile && (
            <Card className="p-5 space-y-4">
              <h3 className="text-lg font-semibold text-navy">Member Profile Snapshot</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <InfoRow label="Name" value={profile.name} icon={UserCircle2} />
                <InfoRow label="Email" value={profile.email} icon={Mail} />
                <InfoRow label="Membership ID" value={profile.membershipNo || 'Pending assignment'} />
                <InfoRow label="Membership Status" value={profile.membershipStatus || 'inactive'} />
                <InfoRow label="Category" value={profile.category || 'Not available'} />
                <InfoRow label="Plan" value={profile.membershipPlan || 'Not assigned'} />
                <InfoRow label="Joined" value={profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'Not available'} icon={CalendarDays} />
                <InfoRow label="Phone" value={profile.phone || 'Not available'} icon={Phone} />
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-white flex items-start gap-2">
      {Icon ? <Icon className="w-4 h-4 text-slate-500 mt-0.5" /> : <span className="w-4" />}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-slate-800 font-medium">{value}</div>
      </div>
    </div>
  );
}
