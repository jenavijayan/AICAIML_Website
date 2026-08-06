import React, { useEffect, useState } from 'react';
import { Award, BookOpen, Users, Calendar, FileCheck, Mail, ExternalLink, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function MemberPortal({ setCurrentPage }: { setCurrentPage: (page: string) => void }) {
  useDocumentMeta('Member Portal', 'Access your approved member-only courses, certifications, and council resources.');
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'certificates'>('overview');

  useEffect(() => {
    document.title = 'AICAIML Member Portal';
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-500 mb-4">You must be signed in to access the member portal.</p>
          <Button onClick={() => setCurrentPage('login')}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  const memberPermissions = user.permissions || [];
  const hasPremium = memberPermissions.includes('access_premium_courses');
  const hasCertificates = memberPermissions.includes('access_certificates');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center">
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-navy">Member Portal</h1>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" icon={LogOut} onClick={logout}>
            Sign Out
          </Button>
        </div>

        {/* Status Badge */}
            <div className="mb-6">
          <Badge variant="success" className="text-xs">
            {user.membershipStatus === 'active' ? 'Active Member' : user.membershipStatus}
          </Badge>
          {user.membershipPlan && (
            <Badge variant="neutral" className="ml-2 text-xs">
              {user.membershipPlan} Plan
            </Badge>
          )}
          {user.membershipNo && (
            <span className="ml-2 text-xs text-slate-500 font-mono">
              ID: {user.membershipNo}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-corp-blue text-corp-blue'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-corp-blue text-corp-blue'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'certificates'
                ? 'border-corp-blue text-corp-blue'
                : 'border-transparent text-slate-500 hover:text-navy'
            }`}
          >
            My Certificates
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-corp-blue/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-corp-blue" />
              </div>
              <h3 className="font-semibold text-navy mb-1">Premium Courses</h3>
              <p className="text-sm text-slate-500">
                {hasPremium
                  ? 'You have access to all premium courses.'
                  : 'Premium course access is being set up.'}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-corp-blue/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6 text-corp-blue" />
              </div>
              <h3 className="font-semibold text-navy mb-1">Academic Certification</h3>
              <p className="text-sm text-slate-500">
                {hasCertificates
                  ? 'You can request and view certificates.'
                  : 'Certificate access pending.'}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-12 h-12 bg-corp-blue/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-corp-blue" />
              </div>
              <h3 className="font-semibold text-navy mb-1">Council Chapters</h3>
              <p className="text-sm text-slate-500">
                Join regional chapters and expert committees.
              </p>
              <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setCurrentPage('learners')}>
                Explore Communities
              </Button>
            </Card>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Browse and enroll in member-only courses. Your approved membership grants you access to the full curriculum.
            </p>
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Your enrolled courses will appear here.</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => setCurrentPage('courses')}>
                    Browse All Courses
                  </Button>
            </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              View and download your earned certificates.
            </p>
            <div className="text-center py-8 text-slate-400">
              <FileCheck className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Your certificates will appear here once you complete a course.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
