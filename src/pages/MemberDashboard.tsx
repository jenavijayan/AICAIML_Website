import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, Phone, UserCircle2, BookOpen, Award, Download, Bell, Settings, Menu, X } from 'lucide-react';
import { Card } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { apiRequest } from '../lib/api';

const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: UserCircle2 },
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings }
] as const;

interface MemberDashboardProps {
  onGoToMemberLogin: () => void;
}

export default function MemberDashboard({ onGoToMemberLogin }: MemberDashboardProps) {
  useDocumentMeta('Member Dashboard', 'Access your approved AICAIML member dashboard and profile.');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiRequest<{ profile?: any }>('/api/auth/member/dashboard', { method: 'GET' });
        if (active) setData(data);
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

  const renderContent = () => {
    if (loading) {
      return (
        <Card className="p-5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-corp-blue border-t-transparent rounded-full animate-spin" />
            Loading your member profile...
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="p-5 text-sm text-rose-700 border-rose-200 bg-rose-50">
          {error}
        </Card>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-5">
            <Card className="p-5">
              <h1 className="text-2xl font-heading font-bold text-navy">Member Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Welcome to your AICAIML member portal. Select a section from the sidebar to get started.</p>
            </Card>

            {profile && (
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
          </div>
        );

      case 'profile':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Member Profile</h3>
            {profile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <InfoRow label="Name" value={profile.name} icon={UserCircle2} />
                <InfoRow label="Email" value={profile.email} icon={Mail} />
                <InfoRow label="Membership ID" value={profile.membershipNo || 'Pending assignment'} />
                <InfoRow label="Status" value={profile.membershipStatus || 'inactive'} />
                <InfoRow label="Category" value={profile.category || 'Not available'} />
                <InfoRow label="Plan" value={profile.membershipPlan || 'Not assigned'} />
                <InfoRow label="Joined" value={profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'Not available'} icon={CalendarDays} />
                <InfoRow label="Phone" value={profile.phone || 'Not available'} icon={Phone} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Profile data is not available.</p>
            )}
          </Card>
        );

      case 'courses':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Courses</h3>
            <p className="text-sm text-slate-500">Your enrolled courses and available learning materials will appear here.</p>
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No courses enrolled yet.
            </div>
          </Card>
        );

      case 'certificates':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Certificates</h3>
            <p className="text-sm text-slate-500">Your issued certificates and digital credentials will appear here.</p>
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No certificates issued yet.
            </div>
          </Card>
        );

      case 'events':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Events</h3>
            <p className="text-sm text-slate-500">Upcoming AICAIML events, workshops, and webinars will appear here.</p>
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No upcoming events.
            </div>
          </Card>
        );

      case 'downloads':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Downloads</h3>
            <p className="text-sm text-slate-500">Members-only resources, templates, and documents will appear here.</p>
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No downloads available yet.
            </div>
          </Card>
        );

      case 'notifications':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Notifications</h3>
            <p className="text-sm text-slate-500">Important announcements and updates from AICAIML will appear here.</p>
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          </Card>
        );

      case 'settings':
        return (
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold text-navy">Settings</h3>
            <p className="text-sm text-slate-500">Manage your account preferences and security settings here.</p>
            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-navy mb-1">Privacy</h4>
              <p className="text-xs text-slate-500">Manage your data and privacy preferences.</p>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[75vh] bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider">Member Panel</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block bg-white border border-slate-200 rounded-2xl p-4 h-fit`}>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider px-2 mb-2 hidden lg:block">Member Panel</h2>
          <nav className="space-y-1">
            {MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-corp-blue text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <section className="space-y-5">
          {renderContent()}
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
