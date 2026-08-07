import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, FileText, Search, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Loader2, Calendar,
  Mail, Phone, Clock, ChevronDown, Eye, LogOut, BarChart3, CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, IconButton, Badge, Card, Dialog, DialogHeader } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

type Tab = 'overview' | 'applications' | 'members';

interface AppRow {
  id: string;
  name: string;
  email: string;
  category: string;
  status: string;
  submittedAt: string;
  emailVerified: boolean;
  reviewer?: string;
  membershipNo: string;
  phone?: string;
  formData: Record<string, any>;
  approvalDate?: string;
  rejectionReason?: string;
  memberId?: string;
}

interface OverviewStats {
  enquiries: number;
  applications: number;
  eventRegistrations: number;
  memberships: number;
  users: number;
  courses: number;
  projects: number;
  partners: number;
  testimonials: number;
  news: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student',
  msme: 'MSME',
  corporate: 'Corporate',
  school: 'School',
  university: 'University',
};

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'approved') return { variant: 'success' as const, icon: CheckCircle };
  if (s === 'rejected') return { variant: 'danger' as const, icon: XCircle };
  return { variant: 'warning' as const, icon: Clock };
}

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return iso;
  }
}

function extractName(formData: Record<string, any>, fallback: string): string {
  return (
    formData.studentName ||
    formData.applicantName ||
    formData.authorizedRepresentativeName ||
    formData.institutionName ||
    formData.universityName ||
    formData.enterpriseName ||
    formData.organizationName ||
    fallback
  );
}

function extractEmail(formData: Record<string, any>, fallback: string): string {
  return (formData.emailId || formData.email || fallback).trim().toLowerCase();
}

function extractPhone(formData: Record<string, any>): string {
  return formData.mobileNo || formData.phone || '';
}

function mapApplication(row: any): AppRow {
  const fd = row.form_data || {};
  return {
    id: row.id,
    name: row.name || extractName(fd, 'Applicant'),
    email: row.email || extractEmail(fd, 'applicant@aic-aiml.org'),
    category: row.membership_category || row.category || 'student',
    status: row.status || 'Pending',
    submittedAt: row.submitted_at || row.created_at || '',
    emailVerified: row.email_verified === 'true',
    reviewer: row.reviewed_by,
    membershipNo: row.membership_no || '',
    phone: extractPhone(fd),
    formData: fd,
    approvalDate: row.approval_date,
    rejectionReason: row.rejection_reason,
    memberId: row.member_id,
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export default function AdminDashboard() {
  useDocumentMeta('Admin Dashboard', 'Council administration panel for AICAIML membership management.');
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionMessageIsError, setActionMessageIsError] = useState(false);

  // ---- OVERVIEW ----
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [ovLoading, setOvLoading] = useState(false);
  const [ovError, setOvError] = useState<string | null>(null);

  // ---- APPLICATIONS ----
  const [apps, setApps] = useState<AppRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appFilterStatus, setAppFilterStatus] = useState('all');
  const [appFilterCategory, setAppFilterCategory] = useState('all');
  const [appActionLoading, setAppActionLoading] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailApp, setDetailApp] = useState<AppRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ---- MEMBERS ----
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilterRole, setMemberFilterRole] = useState('all');

  const fetchJson = async (url: string) => {
    return apiRequest(url, { method: 'GET' });
  };

  const postJson = async (url: string, body: any) => {
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  // ---- OVERVIEW ----
  const loadOverview = useCallback(async () => {
    setOvLoading(true);
    setOvError(null);
    try {
      const data = await fetchJson('/api/admin/overview');
      setStats(data);
    } catch (err: any) {
      setOvError(err.message || 'Failed to load overview.');
    } finally {
      setOvLoading(false);
    }
  }, []);

  // ---- APPLICATIONS ----
  const loadApplications = useCallback(async () => {
    setAppsLoading(true);
    setAppsError(null);
    try {
      const data = await fetchJson('/api/admin/applications');
      const mapped = asArray<any>(data).map(mapApplication);
      setApps(mapped);
    } catch (err: any) {
      setAppsError(err.message || 'Failed to load applications.');
      setApps([]);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const data = await fetchJson('/api/admin/users');
      setMembers(asArray<any>(data));
    } catch (err: any) {
      setMembersError(err.message || 'Failed to load members.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleApprove = useCallback(async (app: AppRow) => {
    setAppActionLoading(app.id);
    try {
      const result = await postJson(`/api/admin/applications/${app.id}/approve`, {});
      if (result.credentials) {
        setActionMessage(`Application ${app.id} approved. Member ID: ${result.credentials.memberId} — secure password setup link emailed to ${app.email}.`);
      } else {
        setActionMessage(`Application ${app.id} approved.`);
      }
      setActionMessageIsError(false);
      await Promise.all([loadApplications(), loadOverview(), loadMembers()]);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      setActionMessage(err.message || 'Approval failed. Please try again.');
      setActionMessageIsError(true);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setAppActionLoading(null);
    }
  }, [loadApplications, loadOverview, loadMembers]);

  const handleReject = useCallback(async (app: AppRow, reason?: string) => {
    setAppActionLoading(app.id);
    try {
      await postJson(`/api/admin/applications/${app.id}/reject`, { reason: reason || '' });
      setActionMessage(`Application ${app.id} rejected.`);
      setActionMessageIsError(false);
      await Promise.all([loadApplications(), loadOverview(), loadMembers()]);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage(err.message || 'Rejection failed. Please try again.');
      setActionMessageIsError(true);
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setAppActionLoading(null);
    }
  }, [loadApplications, loadOverview, loadMembers]);

  const safeApps = asArray<AppRow>(apps);
  const safeMembers = asArray<any>(members);

  const filteredApps = safeApps.filter((a) => {
    const q = appSearch.toLowerCase();
    const matchesSearch =
      !appSearch ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.membershipNo.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q);
    const status = String(a.status || '').toLowerCase();
    const matchesStatus = appFilterStatus === 'all' || status === appFilterStatus.toLowerCase();
    const matchesCategory = appFilterCategory === 'all' || a.category.toLowerCase() === appFilterCategory.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredMembers = safeMembers.filter((m: any) => {
    const q = memberSearch.toLowerCase();
    const matchesSearch =
      !memberSearch ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.id && m.id.toLowerCase().includes(q));
    const matchesRole = memberFilterRole === 'all' || (m.role && m.role.toLowerCase() === memberFilterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    loadOverview();
    loadApplications();
    loadMembers();
  }, [loadOverview, loadApplications, loadMembers]);

  const pendingCount = safeApps.filter((a) => String(a.status || '').toLowerCase() === 'pending').length;
  const approvedCount = safeApps.filter((a) => String(a.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = safeApps.filter((a) => String(a.status || '').toLowerCase() === 'rejected').length;

  if (!user || user.role !== 'admin') {
    return (
      <div id="admin-dashboard-page" className="animate-slideup min-h-screen">
        <section className="bg-gradient-to-br from-[#071F3F] via-navy to-corp-blue text-white py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 mb-6 ring-4 ring-rose-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-heading mb-4">Access Denied</h1>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              This page is restricted to council developers and administrators.
              Please sign in with an admin account to access the administration panel.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const SIDEBAR_TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div id="admin-dashboard-page" className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#071F3F] via-navy to-corp-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 text-gold p-3 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading">Council Administration Panel</h1>
              <p className="text-slate-300 text-sm mt-1">
                Signed in as {user.name} — {user.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <nav className="w-64 shrink-0" aria-label="Admin navigation">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
              {SIDEBAR_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                      active
                        ? 'bg-navy text-white'
                        : 'text-slate-600 hover:bg-navy/5 hover:text-navy'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-slate-100 mt-2 pt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* ---- OVERVIEW TAB ---- */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-navy font-heading">Overview</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        loading={ovLoading}
                        onClick={loadOverview}
                      >
                        Refresh
                      </Button>
                    </div>

                    {ovError && (
                      <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{ovError}</span>
                      </div>
                    )}

                    {stats && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatTile label="Applications" value={stats.applications} icon={FileText} color="bg-blue-50 text-blue-700" />
                        <StatTile label="Members" value={stats.users} icon={Users} color="bg-emerald-50 text-emerald-700" />
                        <StatTile label="Memberships" value={stats.memberships} icon={Shield} color="bg-purple-50 text-purple-700" />
                        <StatTile label="Enquiries" value={stats.enquiries} icon={Mail} color="bg-amber-50 text-amber-700" />
                        <StatTile label="Events Reg." value={stats.eventRegistrations} icon={Calendar} color="bg-rose-50 text-rose-700" />
                      </div>
                    )}

                    <Card>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-navy">Application Pipeline</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={FileText}
                          onClick={() => setActiveTab('applications')}
                        >
                          View All Applications
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="text-2xl font-bold text-amber-800">{pendingCount}</div>
                          <div className="text-xs text-amber-700">Pending Review</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="text-2xl font-bold text-emerald-800">{approvedCount}</div>
                          <div className="text-xs text-emerald-700">Approved</div>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                          <div className="text-2xl font-bold text-rose-800">{rejectedCount}</div>
                          <div className="text-xs text-rose-700">Rejected</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ---- APPLICATIONS TAB ---- */}
                {activeTab === 'applications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-navy font-heading">Membership Applications</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        loading={appsLoading}
                        onClick={loadApplications}
                      >
                        Refresh
                      </Button>
                    </div>

                    {actionMessage && (
                      <div
                        role={actionMessageIsError ? 'alert' : 'status'}
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                          actionMessageIsError
                            ? 'bg-rose-50 border border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {actionMessageIsError ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span>{actionMessage}</span>
                      </div>
                    )}

                    {/* Filters */}
                    <Card className="p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by name, email, membership no..."
                            value={appSearch}
                            onChange={(e) => setAppSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 focus:border-corp-blue focus:outline-none"
                          />
                        </div>
                        <select
                          value={appFilterStatus}
                          onChange={(e) => setAppFilterStatus(e.target.value)}
                          className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:border-corp-blue focus:outline-none bg-white"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <select
                          value={appFilterCategory}
                          onChange={(e) => setAppFilterCategory(e.target.value)}
                          className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:border-corp-blue focus:outline-none bg-white"
                        >
                          <option value="all">All Categories</option>
                          <option value="student">Student</option>
                          <option value="msme">MSME</option>
                          <option value="corporate">Corporate</option>
                          <option value="school">School</option>
                          <option value="university">University</option>
                        </select>
                      </div>
                    </Card>

                    {/* Applications Table */}
                    <Card className="p-0">
                      {appsError && (
                        <div role="alert" className="bg-rose-50 border-b border-rose-200 text-rose-800 p-3 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{appsError}</span>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left">
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Applicant</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Membership No</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Category</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Submitted</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appsLoading ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                  Loading applications...
                                </td>
                              </tr>
                            ) : filteredApps.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                  No applications match your filters.
                                </td>
                              </tr>
                            ) : (
                              filteredApps.map((app) => {
                                const badge = statusBadge(app.status);
                                const Icon = badge.icon;
                                return (
                                  <tr key={app.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <div>
                                        <div className="font-semibold text-navy">{app.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {app.email}
                                        </div>
                                        {app.phone && (
                                          <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {app.phone}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-navy">{app.membershipNo}</code>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant="info">{CATEGORY_LABELS[app.category.toLowerCase()] || app.category}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge variant={badge.variant} icon={Icon}>
                                        {app.status}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                      {formatDate(app.submittedAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => { setDetailApp(app); setDetailOpen(true); }}
                                          className="p-1 text-slate-400 hover:text-corp-blue transition-colors"
                                          aria-label={`View ${app.id}`}
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {app.status.toLowerCase() === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Approve application ${app.id}? A membership ID and secure password setup link will be emailed to ${app.email}.`)) {
                                                  handleApprove(app);
                                                }
                                              }}
                                              className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                              aria-label={`Approve ${app.id}`}
                                              disabled={appActionLoading === app.id}
                                            >
                                              {appActionLoading === app.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                              )}
                                            </button>
                                            <button
                                              onClick={() => { setDetailApp(app); setRejectReason(''); setDetailOpen(true); }}
                                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                              aria-label={`Reject ${app.id}`}
                                              disabled={appActionLoading === app.id}
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
                        {filteredApps.length} of {apps.length} applications shown
                      </div>
                    </Card>
                  </div>
                )}

                {/* ---- MEMBERS TAB ---- */}
                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-navy font-heading">Council Members</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        loading={membersLoading}
                        onClick={loadMembers}
                      >
                        Refresh
                      </Button>
                    </div>

                    {actionMessage && (
                      <div
                        role={actionMessageIsError ? 'alert' : 'status'}
                        className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                          actionMessageIsError
                            ? 'bg-rose-50 border border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {actionMessageIsError ? (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span>{actionMessage}</span>
                      </div>
                    )}

                    <Card className="p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by name, email, member ID..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 focus:border-corp-blue focus:outline-none"
                          />
                        </div>
                        <select
                          value={memberFilterRole}
                          onChange={(e) => setMemberFilterRole(e.target.value)}
                          className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:border-corp-blue focus:outline-none bg-white"
                        >
                          <option value="all">All Roles</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                    </Card>

                    <Card className="p-0">
                      {membersError && (
                        <div role="alert" className="bg-rose-50 border-b border-rose-200 text-rose-800 p-3 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{membersError}</span>
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-left">
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Member ID</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Plan</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Permissions</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {membersLoading ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                  Loading members...
                                </td>
                              </tr>
                            ) : filteredMembers.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                  No members match your search.
                                </td>
                              </tr>
                            ) : (
                              filteredMembers.map((m) => (
                                <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-navy">{m.id}</code>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-navy">{m.name}</td>
                                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant={m.role === 'admin' ? 'danger' : 'info'}>{m.role}</Badge>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{m.membershipPlan || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${m.membershipStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                      {m.membershipStatus}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {(m.permissions || []).slice(0, 2).map((p: string) => (
                                        <span key={p} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.replace('access_', '')}</span>
                                      ))}
                                      {(m.permissions || []).length > 2 && (
                                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">+{(m.permissions || []).length - 2}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
                        {filteredMembers.length} of {members.length} members shown
                      </div>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ---- Application Detail / Reject Dialog ---- */}
      <Dialog
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailApp(null); setRejectReason(''); }}
        label="Application details"
        className="max-w-2xl"
      >
        {detailApp && (
          <>
            <DialogHeader
              eyebrow="Application Details"
              title={detailApp.name}
              onClose={() => { setDetailOpen(false); setDetailApp(null); setRejectReason(''); }}
            />
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500">Application ID</span>
                  <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{detailApp.id}</code>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Membership No</span>
                  <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{detailApp.membershipNo}</code>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Email</span>
                  <span className="font-semibold text-navy">{detailApp.email}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Phone</span>
                  <span className="text-navy">{detailApp.phone || '—'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Category</span>
                  <Badge variant="info">{CATEGORY_LABELS[detailApp.category.toLowerCase()] || detailApp.category}</Badge>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Status</span>
                  <Badge {...{ variant: statusBadge(detailApp.status).variant }} icon={statusBadge(detailApp.status).icon}>
                    {detailApp.status}
                  </Badge>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Submitted</span>
                  <span className="text-navy">{formatDate(detailApp.submittedAt)}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Email Verified</span>
                  <span className="text-navy">{detailApp.emailVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Form Data */}
              <div>
                <h4 className="font-semibold text-navy text-sm mb-2">Form Data</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                    {JSON.stringify(detailApp.formData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {detailApp.status.toLowerCase() === 'pending' && (
                  <>
                    <Button
                      icon={CheckCircle2}
                      variant="primary"
                      loading={appActionLoading === detailApp.id}
                      onClick={() => handleApprove(detailApp)}
                      disabled={appActionLoading === detailApp.id}
                    >
                      Approve Application
                    </Button>
                    <div className="flex flex-col gap-2 flex-1">
                      <textarea
                        placeholder="Rejection reason (optional — will be included in the rejection email)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 focus:border-corp-blue focus:outline-none resize-y"
                        maxLength={500}
                      />
                      <Button
                        icon={XCircle}
                        variant="danger"
                        loading={appActionLoading === detailApp.id}
                        onClick={() => {
                          if (confirm(`Reject application ${detailApp.id}${rejectReason ? ' — the reason will be emailed to the applicant.' : ' — no reason provided.'}`)) {
                            handleReject(detailApp, rejectReason);
                            setDetailOpen(false);
                            setDetailApp(null);
                            setRejectReason('');
                          }
                        }}
                        disabled={appActionLoading === detailApp.id}
                      >
                        Reject Application
                      </Button>
                    </div>
                  </>
                )}
                {detailApp.status.toLowerCase() === 'approved' && (
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Approved on {formatDate(detailApp.approvalDate || '')}
                    {detailApp.memberId && (
                      <>
                        <span className="mx-1">·</span>
                        <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-emerald-200">{detailApp.memberId}</code>
                      </>
                    )}
                  </div>
                )}
                {detailApp.status.toLowerCase() === 'rejected' && (
                  <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                    <XCircle className="w-4 h-4" />
                    Rejected
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
