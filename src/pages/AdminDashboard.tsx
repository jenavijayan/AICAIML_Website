import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, FileText, Calendar, CreditCard, BookOpen, Newspaper,
  Loader2, Plus, Trash2, Upload, Mail, Phone, ChevronDown
} from 'lucide-react';
import { Button, IconButton, TabList, TabPanel } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

type Tab = 'overview' | 'enquiries' | 'applications' | 'events' | 'memberships' | 'users' | 'courses' | 'announcements' | 'projects' | 'partners' | 'testimonials';

interface OverviewCounts {
  enquiries: number;
  applications: number;
  eventRegistrations: number;
  memberships: number;
  users: number;
  courses: number;
  news: number;
  projects: number;
  partners: number;
  testimonials: number;
}

export default function AdminDashboard() {
  useDocumentMeta('Council Administration', 'AICAIML admin dashboard.');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<OverviewCounts | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [newsForm, setNewsForm] = useState({ title: '', summary: '', category: 'Announcement' });
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsMessage, setNewsMessage] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: '', description: '', category: 'AI Fundamentals', level: 'Beginner',
    duration: '', modules: '', access: 'free', topics: '', image: ''
  });
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseMessage, setCourseMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: 'AI Integration', status: 'Ongoing', impact: '', image: '' });
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);

  const [partnerForm, setPartnerForm] = useState({ name: '', type: 'Academic', logoPlaceholder: '' });
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerMessage, setPartnerMessage] = useState<string | null>(null);

  const [testimonialForm, setTestimonialForm] = useState({ name: '', designation: '', organization: '', quote: '', avatarUrl: '' });
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);
  const [testimonialMessage, setTestimonialMessage] = useState<string | null>(null);

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.json();
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      setOverview(await fetchJson('/api/admin/overview'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTab = async (tab: Tab) => {
    const endpoints: Partial<Record<Tab, string>> = {
      enquiries: '/api/admin/enquiries',
      applications: '/api/admin/applications',
      events: '/api/admin/event-registrations',
      memberships: '/api/admin/memberships',
      users: '/api/admin/users',
      courses: '/api/courses',
      projects: '/api/projects',
      partners: '/api/partners',
      testimonials: '/api/testimonials'
    };
    const endpoint = endpoints[tab];
    if (!endpoint) return;
    setLoading(true);
    try {
      setRows(await fetchJson(endpoint));
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'announcements') {
      loadTab(activeTab);
    }
  }, [activeTab]);

  const handlePublishNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.summary) return;
    setNewsSubmitting(true);
    setNewsMessage(null);
    try {
      const res = await fetch('/api/news/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newsForm, readTime: '3 min read' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish.');
      setNewsMessage(`Published: "${data.article.title}"`);
      setNewsForm({ title: '', summary: '', category: 'Announcement' });
      loadOverview();
    } catch (err: any) {
      setNewsMessage(err.message || 'Failed to publish announcement.');
    } finally {
      setNewsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setCourseForm((f) => ({ ...f, image: data.url }));
    } catch (err: any) {
      setCourseMessage(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.description || !courseForm.duration) return;
    setCourseSubmitting(true);
    setCourseMessage(null);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...courseForm,
          modules: Number(courseForm.modules) || 0,
          topics: courseForm.topics.split(',').map((t) => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course.');
      setCourseMessage(`Course created: "${data.course.title}"`);
      setCourseForm({ title: '', description: '', category: 'AI Fundamentals', level: 'Beginner', duration: '', modules: '', access: 'free', topics: '', image: '' });
      loadOverview();
      if (activeTab === 'courses') loadTab('courses');
    } catch (err: any) {
      setCourseMessage(err.message || 'Failed to create course.');
    } finally {
      setCourseSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTab('courses');
    loadOverview();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title || !projectForm.description || !projectForm.impact) return;
    setProjectSubmitting(true);
    setProjectMessage(null);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project.');
      setProjectMessage(`Project created: "${data.project.title}"`);
      setProjectForm({ title: '', description: '', category: 'AI Integration', status: 'Ongoing', impact: '', image: '' });
      loadOverview();
      if (activeTab === 'projects') loadTab('projects');
    } catch (err: any) {
      setProjectMessage(err.message || 'Failed to create project.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTab('projects');
    loadOverview();
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.logoPlaceholder) return;
    setPartnerSubmitting(true);
    setPartnerMessage(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(partnerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create partner.');
      setPartnerMessage(`Partner added: "${data.partner.name}"`);
      setPartnerForm({ name: '', type: 'Academic', logoPlaceholder: '' });
      loadOverview();
      if (activeTab === 'partners') loadTab('partners');
    } catch (err: any) {
      setPartnerMessage(err.message || 'Failed to add partner.');
    } finally {
      setPartnerSubmitting(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    await fetch(`/api/admin/partners/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTab('partners');
    loadOverview();
  };

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.quote) return;
    setTestimonialSubmitting(true);
    setTestimonialMessage(null);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testimonialForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create testimonial.');
      setTestimonialMessage(`Testimonial added: "${data.testimonial.name}"`);
      setTestimonialForm({ name: '', designation: '', organization: '', quote: '', avatarUrl: '' });
      loadOverview();
      if (activeTab === 'testimonials') loadTab('testimonials');
    } catch (err: any) {
      setTestimonialMessage(err.message || 'Failed to add testimonial.');
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', credentials: 'include' });
    loadTab('testimonials');
    loadOverview();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) return;
    setUserSubmitting(true);
    setUserMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user.');
      setUserMessage(`Created ${data.user.role}: ${data.user.email}`);
      setUserForm({ name: '', email: '', password: '', role: 'member' });
      loadTab('users');
      loadOverview();
    } catch (err: any) {
      setUserMessage(err.message || 'Failed to create user.');
    } finally {
      setUserSubmitting(false);
    }
  };

  const parseName = (row: any) => {
    const fd = row.form_data || {};
    return fd.studentName || fd.applicantName || fd.authorizedRepresentativeName || fd.institutionName || fd.universityName || '—';
  };

  const parseEmail = (row: any) => {
    const fd = row.form_data || {};
    return fd.emailId || fd.email || '—';
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}/approve`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve.');
      setActionMessage(`Approved application ${id}.`);
      loadTab('applications');
      loadOverview();
    } catch (err: any) {
      setActionMessage(err.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}/reject`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject.');
      setActionMessage(`Rejected application ${id}.`);
      loadTab('applications');
      loadOverview();
    } catch (err: any) {
      setActionMessage(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'enquiries', label: 'Enquiries', icon: Mail },
    { id: 'applications', label: 'Membership Applications', icon: FileText },
    { id: 'events', label: 'Event Registrations', icon: Calendar },
    { id: 'memberships', label: 'Paid Memberships', icon: CreditCard },
    { id: 'users', label: 'Registered Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'projects', label: 'Projects', icon: BookOpen },
    { id: 'partners', label: 'Partners', icon: Users },
    { id: 'testimonials', label: 'Testimonials', icon: ShieldCheck },
    { id: 'announcements', label: 'Announcements', icon: Newspaper }
  ];

  return (
    <div id="admin-dashboard-page" className="animate-slideup min-h-screen bg-slate-50">
      <section className="bg-navy text-white py-10 border-b-4 border-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold font-heading mt-1 text-gradient-animate-light">Council Administration</h1>
          <p className="text-slate-300 text-sm mt-1">Manage courses, announcements, and view everyone who has registered or applied.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <TabList
          idPrefix="admin"
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
          className="flex flex-wrap gap-2 mb-8"
          tabClassName={(selected) =>
            `flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
              selected ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-corp-blue/40'
            }`
          }
        />

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div role="tabpanel" id="admin-panel-overview" aria-labelledby="admin-tab-overview" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overview && [
              { label: 'Enquiries', value: overview.enquiries, icon: Mail },
              { label: 'Membership Applications', value: overview.applications, icon: FileText },
              { label: 'Event Registrations', value: overview.eventRegistrations, icon: Calendar },
              { label: 'Paid Memberships', value: overview.memberships, icon: CreditCard },
              { label: 'Registered Users', value: overview.users, icon: Users },
              { label: 'Courses', value: overview.courses, icon: BookOpen },
              { label: 'Projects', value: overview.projects, icon: BookOpen },
              { label: 'Partners', value: overview.partners, icon: Users },
              { label: 'Testimonials', value: overview.testimonials, icon: ShieldCheck },
              { label: 'News Articles', value: overview.news, icon: Newspaper }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <Icon className="w-5 h-5 text-corp-blue mb-2" />
                  <div className="text-2xl font-bold text-navy font-heading">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* GENERIC TABLE TABS */}
        {['enquiries', 'events', 'memberships'].includes(activeTab) && (
          <div role="tabpanel" id={`admin-panel-${activeTab}`} aria-labelledby={`admin-tab-${activeTab}`} className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No records yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    {Object.keys(rows[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-xs truncate">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div role="tabpanel" id="admin-panel-users" aria-labelledby="admin-tab-users" className="space-y-6">
            {actionMessage && (
              <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{actionMessage}</div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-corp-blue" />
                Add New User / Admin
              </h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                {userMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{userMessage}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="Full name" required placeholder="Full Name" className="text-xs rounded border border-slate-300 p-2.5" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                  <input aria-label="Email" required type="email" placeholder="email@example.com" className="text-xs rounded border border-slate-300 p-2.5" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="Password" required type="password" placeholder="Min. 8 characters" className="text-xs rounded border border-slate-300 p-2.5" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                  <select aria-label="Role" className="text-xs rounded border border-slate-300 p-2.5" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" variant="accent" size="sm" loading={userSubmitting} icon={Plus}>
                  Create User
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Membership</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{u.role}</td>
                        <td className="px-4 py-3 text-slate-500">{u.membership_plan || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{u.membership_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* MEMBERSHIP APPLICATIONS */}
        {activeTab === 'applications' && (
          <div role="tabpanel" id="admin-panel-applications" aria-labelledby="admin-tab-applications" className="space-y-4">
            {actionMessage && (
              <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{actionMessage}</div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No applications yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Membership Type</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Applied Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Email Verified</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const status = row.status || 'Pending';
                      const badgeClass =
                        status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                          : status === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 ring-rose-600/20'
                            : 'bg-amber-50 text-amber-800 ring-amber-600/20';
                      return (
                        <tr key={row.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3 text-slate-700 font-medium">{row.name || parseName(row)}</td>
                          <td className="px-4 py-3 text-slate-600">{parseEmail(row)}</td>
                          <td className="px-4 py-3 text-slate-600 capitalize">{row.category?.replace(/^(student|msme|corporate|school|university)$/, (m: string) => m.charAt(0).toUpperCase() + m.slice(1)) || '—'}</td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-IN') : '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                              row.email_verified === 'true' ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : 'bg-amber-50 text-amber-800 ring-amber-600/20'
                            }`}>
                              {row.email_verified === 'true' ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {status === 'Pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(row.id)}
                                  disabled={actionLoading === row.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                >
                                  {actionLoading === row.id ? 'Saving…' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleReject(row.id)}
                                  disabled={actionLoading === row.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                  {actionLoading === row.id ? 'Saving…' : 'Reject'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* COURSES */}
        {activeTab === 'courses' && (
          <div role="tabpanel" id="admin-panel-courses" aria-labelledby="admin-tab-courses" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-corp-blue" />
                Upload a New Course
              </h3>
              <form onSubmit={handleCreateCourse} className="space-y-3">
                {courseMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{courseMessage}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Course title" required placeholder="Course title" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                  <input aria-label="Duration" required placeholder="Duration (e.g., 4 hrs)" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} />
                </div>
                <textarea aria-label="Description" required rows={2} placeholder="Description" className="w-full text-xs rounded border border-slate-300 p-2.5" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
                <div className="grid grid-cols-4 gap-3">
                  <select aria-label="Category" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}>
                    {['AI Fundamentals', 'Machine Learning', 'Robotics', 'Generative AI', 'Career & Ethics'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select aria-label="Level" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select aria-label="Access" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.access} onChange={(e) => setCourseForm({ ...courseForm, access: e.target.value })}>
                    <option value="free">Free</option>
                    <option value="membership">Membership</option>
                  </select>
                  <input aria-label="Number of modules" placeholder="Modules (#)" type="number" className="text-xs rounded border border-slate-300 p-2.5" value={courseForm.modules} onChange={(e) => setCourseForm({ ...courseForm, modules: e.target.value })} />
                </div>
                <input aria-label="Topics (comma-separated)" placeholder="Topics (comma-separated)" className="w-full text-xs rounded border border-slate-300 p-2.5" value={courseForm.topics} onChange={(e) => setCourseForm({ ...courseForm, topics: e.target.value })} />

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    {uploading ? 'Uploading…' : 'Upload Thumbnail Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </label>
                  {courseForm.image && <img src={courseForm.image} alt="Course thumbnail preview" width={40} height={40} className="w-10 h-10 rounded object-cover border border-slate-200" />}
                </div>

                <Button type="submit" variant="accent" size="sm" loading={courseSubmitting} icon={Plus}>
                  Publish Course
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Access</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy">{c.title}</td>
                        <td className="px-4 py-3 text-slate-500">{c.category}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{c.access}</td>
                        <td className="px-4 py-3 text-right">
                          <IconButton
                            icon={Trash2}
                            label={`Delete course "${c.title}"`}
                            size="sm"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => handleDeleteCourse(c.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <div role="tabpanel" id="admin-panel-projects" aria-labelledby="admin-tab-projects" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-corp-blue" />
                Add a New Project
              </h3>
              <form onSubmit={handleCreateProject} className="space-y-3">
                {projectMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{projectMessage}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Project title" required placeholder="Project title" className="text-xs rounded border border-slate-300 p-2.5" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
                  <select aria-label="Category" className="text-xs rounded border border-slate-300 p-2.5" value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}>
                    {['AI Integration', 'Robotics', 'Machine Learning', 'Academia'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea aria-label="Description" required rows={2} placeholder="Description" className="w-full text-xs rounded border border-slate-300 p-2.5" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select aria-label="Status" className="text-xs rounded border border-slate-300 p-2.5" value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}>
                    {['Ongoing', 'Completed', 'Upcoming'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input aria-label="Impact" required placeholder="Impact metric" className="text-xs rounded border border-slate-300 p-2.5" value={projectForm.impact} onChange={(e) => setProjectForm({ ...projectForm, impact: e.target.value })} />
                </div>
                <input aria-label="Image URL" placeholder="Image URL (optional)" className="w-full text-xs rounded border border-slate-300 p-2.5" value={projectForm.image} onChange={(e) => setProjectForm({ ...projectForm, image: e.target.value })} />
                <Button type="submit" variant="accent" size="sm" loading={projectSubmitting} icon={Plus}>
                  Add Project
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy">{p.title}</td>
                        <td className="px-4 py-3 text-slate-500">{p.category}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{p.status}</td>
                        <td className="px-4 py-3 text-right">
                          <IconButton
                            icon={Trash2}
                            label={`Delete project "${p.title}"`}
                            size="sm"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => handleDeleteProject(p.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PARTNERS */}
        {activeTab === 'partners' && (
          <div role="tabpanel" id="admin-panel-partners" aria-labelledby="admin-tab-partners" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-corp-blue" />
                Add a New Partner
              </h3>
              <form onSubmit={handleCreatePartner} className="space-y-3">
                {partnerMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{partnerMessage}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Partner name" required placeholder="Partner name" className="text-xs rounded border border-slate-300 p-2.5" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} />
                  <select aria-label="Type" className="text-xs rounded border border-slate-300 p-2.5" value={partnerForm.type} onChange={(e) => setPartnerForm({ ...partnerForm, type: e.target.value })}>
                    {['Academic', 'Corporate', 'Government', 'Startup'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <input aria-label="Logo placeholder" required placeholder="Logo placeholder (e.g., IITM)" className="w-full text-xs rounded border border-slate-300 p-2.5" value={partnerForm.logoPlaceholder} onChange={(e) => setPartnerForm({ ...partnerForm, logoPlaceholder: e.target.value })} />
                <Button type="submit" variant="accent" size="sm" loading={partnerSubmitting} icon={Plus}>
                  Add Partner
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy">{p.name}</td>
                        <td className="px-4 py-3 text-slate-500">{p.type}</td>
                        <td className="px-4 py-3 text-right">
                          <IconButton
                            icon={Trash2}
                            label={`Delete partner "${p.name}"`}
                            size="sm"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => handleDeletePartner(p.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TESTIMONIALS */}
        {activeTab === 'testimonials' && (
          <div role="tabpanel" id="admin-panel-testimonials" aria-labelledby="admin-tab-testimonials" className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-corp-blue" />
                Add a New Testimonial
              </h3>
              <form onSubmit={handleCreateTestimonial} className="space-y-3">
                {testimonialMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{testimonialMessage}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Name" required placeholder="Name" className="text-xs rounded border border-slate-300 p-2.5" value={testimonialForm.name} onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })} />
                  <input aria-label="Designation" required placeholder="Designation" className="text-xs rounded border border-slate-300 p-2.5" value={testimonialForm.designation} onChange={(e) => setTestimonialForm({ ...testimonialForm, designation: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Organization" required placeholder="Organization" className="text-xs rounded border border-slate-300 p-2.5" value={testimonialForm.organization} onChange={(e) => setTestimonialForm({ ...testimonialForm, organization: e.target.value })} />
                  <input aria-label="Avatar URL" required placeholder="Avatar URL" className="text-xs rounded border border-slate-300 p-2.5" value={testimonialForm.avatarUrl} onChange={(e) => setTestimonialForm({ ...testimonialForm, avatarUrl: e.target.value })} />
                </div>
                <textarea aria-label="Quote" required rows={3} placeholder="Quote" className="w-full text-xs rounded border border-slate-300 p-2.5" value={testimonialForm.quote} onChange={(e) => setTestimonialForm({ ...testimonialForm, quote: e.target.value })} />
                <Button type="submit" variant="accent" size="sm" loading={testimonialSubmitting} icon={Plus}>
                  Add Testimonial
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Organization</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy">{t.name}</td>
                        <td className="px-4 py-3 text-slate-500">{t.organization}</td>
                        <td className="px-4 py-3 text-right">
                          <IconButton
                            icon={Trash2}
                            label={`Delete testimonial "${t.name}"`}
                            size="sm"
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            onClick={() => handleDeleteTestimonial(t.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div role="tabpanel" id="admin-panel-announcements" aria-labelledby="admin-tab-announcements" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-xl">
            <h3 className="font-bold text-navy font-heading mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-corp-blue" />
              Publish an Announcement
            </h3>
            <form onSubmit={handlePublishNews} className="space-y-3">
              {newsMessage && <div role="status" className="text-xs text-corp-blue bg-pale-blue/50 p-2.5 rounded">{newsMessage}</div>}
              <input aria-label="Title" required placeholder="Title" className="w-full text-xs rounded border border-slate-300 p-2.5" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} />
              <textarea aria-label="Summary" required rows={3} placeholder="Summary" className="w-full text-xs rounded border border-slate-300 p-2.5" value={newsForm.summary} onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })} />
              <select aria-label="Category" className="w-full text-xs rounded border border-slate-300 p-2.5" value={newsForm.category} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}>
                <option value="Announcement">Announcement</option>
                <option value="Press Release">Press Release</option>
                <option value="Industry News">Industry News</option>
              </select>
              <Button type="submit" variant="accent" size="sm" loading={newsSubmitting} icon={Plus}>
                Publish to Feed
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
