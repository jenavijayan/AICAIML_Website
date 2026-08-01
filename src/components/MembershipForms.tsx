import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User, Building, BookOpen, GraduationCap, Server, HelpCircle,
  CheckCircle, ArrowLeft, Loader2, AlertCircle, Sparkles, Mail, Eye, Upload
} from 'lucide-react';
import { Button } from './ui';
import { useFormVerification } from '../hooks/useFormVerification';
import EmailVerification from './EmailVerification';

const EXEMPT_ADMIN_EMAIL = 'anuyaparamasivan@gmail.com';

interface FormProps {
  category: 'student' | 'msme' | 'corporate' | 'school' | 'university';
  onBack: () => void;
}

export default function MembershipForms({ category, onBack }: FormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [verified, setVerified] = useState(false);

  // Anti-spam Honeypot field
  const [honeypot, setHoneypot] = useState('');

  // Auto-generate some provisional IDs on render
  const [provisionalNo, setProvisionalNo] = useState('');
  useEffect(() => {
    const code = category.substring(0, 3).toUpperCase();
    const rand = Math.floor(100000 + Math.random() * 900000);
    setProvisionalNo(`AIC-${code}-${rand}`);
  }, [category]);

  // Shared registration fields for all form categories
  const [commonForm, setCommonForm] = useState({
    fullName: '',
    email: '',
    mobile: '',
    state: '',
    city: '',
    documentFile: null as File | null,
    documentName: '',
    termsAccepted: false
  });

  // Form States
  const [studentForm, setStudentForm] = useState({
    collegeCode: '',
    collegeName: '',
    studentName: '',
    department: '',
    year: '1st Year',
    registerNo: '',
    mobileNo: '',
    emailId: '',
    areasOfInterest: [] as string[],
    otherInterest: '',
    declaration: false
  });

  const [msmeForm, setMsmeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    enterpriseName: '',
    udyamRegNo: '',
    businessType: 'Proprietorship',
    natureOfBusiness: '',
    applicantName: '',
    designation: '',
    mobileNo: '',
    emailId: '',
    businessAddress: '',
    membershipCategory: 'Micro Enterprise',
    declaration: false
  });

  const [corporateForm, setCorporateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    organizationName: '',
    registrationNo: '', // GST/CIN/Udyam/Trust/Society
    industrySector: '',
    website: '',
    authorizedRepresentativeName: '',
    designation: '',
    mobileNo: '',
    emailId: '',
    officeAddress: '',
    membershipCategory: 'Corporate Partner',
    areasOfCollaboration: [] as string[],
    otherCollaboration: '',
    declaration: false
  });

  const [schoolForm, setSchoolForm] = useState({
    date: new Date().toISOString().split('T')[0],
    institutionName: '',
    institutionCode: '',
    type: 'College',
    management: 'Private',
    principalName: '',
    designation: '',
    mobileNo: '',
    emailId: '',
    institutionAddress: '',
    partnershipCategory: 'Institutional Partner',
    areasOfCollaboration: [] as string[],
    otherCollaboration: '',
    declaration: false
  });

  const [universityForm, setUniversityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    universityName: '',
    universityCode: '',
    type: 'State University',
    authorizedRepresentativeName: '',
    designation: 'Dean', // VC/Registrar/Dean/Director
    departmentSchool: '',
    mobileNo: '',
    emailId: '',
    universityAddress: '',
    partnershipCategory: 'University Partner',
    areasOfCollaboration: [] as string[],
    otherCollaboration: '',
    declaration: false
  });

  // Checkbox helpers
  const handleCheckboxChange = (
    formType: 'student' | 'corporate' | 'school' | 'university',
    field: string,
    value: string
  ) => {
    if (formType === 'student') {
      const current = [...studentForm.areasOfInterest];
      if (current.includes(value)) {
        setStudentForm({ ...studentForm, areasOfInterest: current.filter(item => item !== value) });
      } else {
        setStudentForm({ ...studentForm, areasOfInterest: [...current, value] });
      }
    } else if (formType === 'corporate') {
      const current = [...corporateForm.areasOfCollaboration];
      if (current.includes(value)) {
        setCorporateForm({ ...corporateForm, areasOfCollaboration: current.filter(item => item !== value) });
      } else {
        setCorporateForm({ ...corporateForm, areasOfCollaboration: [...current, value] });
      }
    } else if (formType === 'school') {
      const current = [...schoolForm.areasOfCollaboration];
      if (current.includes(value)) {
        setSchoolForm({ ...schoolForm, areasOfCollaboration: current.filter(item => item !== value) });
      } else {
        setSchoolForm({ ...schoolForm, areasOfCollaboration: [...current, value] });
      }
    } else if (formType === 'university') {
      const current = [...universityForm.areasOfCollaboration];
      if (current.includes(value)) {
        setUniversityForm({ ...universityForm, areasOfCollaboration: current.filter(item => item !== value) });
      } else {
        setUniversityForm({ ...universityForm, areasOfCollaboration: [...current, value] });
      }
    }
  };

  const getCurrentEmail = () => commonForm.email;

  const {
    step: verificationStep,
    verificationCode,
    requestCode,
    confirmCode,
    reset: resetVerification,
    message: verificationMessage,
    setVerificationCode,
    isConfirming
  } = useFormVerification({
    email: getCurrentEmail(),
    onVerified: () => {
      setVerified(true);
    }
  });

  const resetAll = () => {
    setSuccessData(null);
    setVerified(false);
    resetVerification();
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const isExempt = commonForm.email.trim().toLowerCase() === EXEMPT_ADMIN_EMAIL;

    if (!verified && !isExempt) {
      setLoading(false);
      return;
    }

    // Dynamic extraction of appropriate form payload
    let payload: any = {};

    if (category === 'student') {
      payload = { ...studentForm, provisionalNo };
    } else if (category === 'msme') {
      payload = { ...msmeForm, provisionalNo };
    } else if (category === 'corporate') {
      payload = { ...corporateForm, provisionalNo };
    } else if (category === 'school') {
      payload = { ...schoolForm, provisionalNo };
    } else if (category === 'university') {
      payload = { ...universityForm, provisionalNo };
    }

    payload = {
      ...payload,
      ...commonForm,
      documentName: commonForm.documentFile?.name || commonForm.documentName,
      provisionalNo
    };
    delete payload.documentFile;

    // Client-side Validation Checks
    if (!commonForm.termsAccepted) {
      setError('You must accept the terms and conditions before submitting.');
      setLoading(false);
      return;
    }

    if (!commonForm.fullName || commonForm.fullName.trim().length < 2) {
      setError('Please provide your full name or organization name.');
      setLoading(false);
      return;
    }

    if (!commonForm.email || !commonForm.email.includes('@')) {
      setError('Please provide a valid email address.');
      setLoading(false);
      return;
    }

    if (!commonForm.mobile || commonForm.mobile.length < 10) {
      setError('Please provide a valid mobile number (minimum 10 digits).');
      setLoading(false);
      return;
    }

    try {
      if (!verified) {
        const sent = await requestCode();
        if (!sent) {
          throw new Error('Failed to send verification code. Please try again.');
        }
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const formPayload = new FormData();
      formPayload.append('category', category);
      formPayload.append('formData', JSON.stringify(payload));
      formPayload.append('honeypot', honeypot);
      if (commonForm.documentFile) {
        formPayload.append('document', commonForm.documentFile);
      }

      const response = await fetch('/api/membership/submit', {
        method: 'POST',
        body: formPayload,
        signal: controller.signal,
        credentials: 'include'
      });

      clearTimeout(timeoutId);

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to submit application.');
      }

      setSuccessData(resData);
    } catch (err: any) {
      console.error(err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected networking issue occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-slideup">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-navy to-corp-blue px-6 py-10 text-white text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4 ring-4 ring-emerald-500/20">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Application Submitted Successfully</h2>
          <p className="text-pale-blue text-sm mt-2 max-w-lg mx-auto">
            Your application for the <strong>{category.toUpperCase()} Membership Category</strong> has been safely processed by our National Secretariat.
          </p>
        </div>

        {/* Receipt Details Grid */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-pale-blue/40 border border-corp-blue/10 rounded-xl p-5">
            <h3 className="font-semibold text-corp-blue text-base flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-gold" />
              Provisional Enrollment Receipt
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold">Provisional Membership No.</span>
                <span className="font-mono font-bold text-navy text-lg">{successData.membershipNo}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold">Application Reference ID</span>
                <span className="font-mono font-bold text-navy text-base">{successData.applicationId}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs uppercase font-semibold">Review Pipeline Status</span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 mt-1">
                  Pending Review
                </span>
              </div>
            </div>
          </div>

          {/* Acknowledgement Email Preview */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <Mail className="w-4 h-4 text-corp-blue" />
                <span>Simulated Acknowledgement Email (Phase 1 Dispatch log)</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">SENT</span>
            </div>
            <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-72">
              {successData.emailLog}
            </div>
          </div>

          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-500">
              Note: Under AICAIML Bylaws, Phase 1 applications do not require immediate fee payment. Your login credentials to access the digital membership portal will be issued upon successful verification.
            </p>
            <Button icon={ArrowLeft} onClick={onBack}>
              Return to Membership Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-slideup">
      {/* Form Top Area */}
      <div className="bg-navy px-6 py-8 text-white flex justify-between items-center">
        <div>
          <span className="text-xs uppercase text-gold font-bold tracking-wider">AICAIML Enrollment Registry</span>
          <h2 className="text-xl font-bold font-heading mt-1 flex items-center gap-2">
            {category === 'student' && <GraduationCap className="w-6 h-6 text-gold" />}
            {category === 'msme' && <Building className="w-6 h-6 text-gold" />}
            {category === 'corporate' && <Server className="w-6 h-6 text-gold" />}
            {category === 'school' && <BookOpen className="w-6 h-6 text-gold" />}
            {category === 'university' && <GraduationCap className="w-6 h-6 text-gold" />}
            {category.toUpperCase()} MEMBERSHIP FORM
          </h2>
        </div>
        <button
          onClick={onBack}
          className="text-slate-300 hover:text-white hover:bg-white/10 p-2 rounded-md transition-colors text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        
        {/* Provisional ID Banner */}
        <div className="bg-pale-blue/50 border border-corp-blue/10 rounded-lg px-4 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="text-xs text-corp-blue font-semibold">
            Council Allocated Reference Number
          </div>
          <div className="font-mono text-sm font-bold text-navy bg-white px-3 py-1 rounded border border-slate-200">
            {provisionalNo || 'Allocating...'}
          </div>
        </div>

        {/* Error Advisory */}
        {error && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Honeypot Spam Protection Field (Hidden) */}
        <div className="hidden">
          <label htmlFor="address_honeypot_field">Do not fill this field if you are human</label>
          <input
            id="address_honeypot_field"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <User className="w-4 h-4 text-corp-blue" />
            Common Registration Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commonForm-fullName" className="block text-sm font-semibold text-slate-700 mb-1">Full Name / Organization Name *</label>
              <input id="commonForm-fullName"
                type="text"
                required
                placeholder="Your name or organization"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={commonForm.fullName}
                onChange={(e) => setCommonForm({ ...commonForm, fullName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="commonForm-email" className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input id="commonForm-email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={commonForm.email}
                onChange={(e) => setCommonForm({ ...commonForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commonForm-mobile" className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input id="commonForm-mobile"
                type="tel"
                required
                placeholder="10-digit mobile number"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={commonForm.mobile}
                onChange={(e) => setCommonForm({ ...commonForm, mobile: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="commonForm-state" className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                <input id="commonForm-state"
                  type="text"
                  placeholder="State"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={commonForm.state}
                  onChange={(e) => setCommonForm({ ...commonForm, state: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="commonForm-city" className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                <input id="commonForm-city"
                  type="text"
                  placeholder="City"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={commonForm.city}
                  onChange={(e) => setCommonForm({ ...commonForm, city: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="commonForm-document" className="block text-sm font-semibold text-slate-700 mb-1">Upload Document</label>
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Upload className="w-4 h-4 text-corp-blue" />
                <span>Attach your ID, bonafide, UDYAM certificate, registration certificate, or approval letter</span>
              </div>
              <input id="commonForm-document"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-corp-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setCommonForm({
                    ...commonForm,
                    documentFile: file,
                    documentName: file?.name || ''
                  });
                }}
              />
              {commonForm.documentName && (
                <span className="text-xs text-slate-500">Selected file: {commonForm.documentName}</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
              <input
                type="checkbox"
                required
                className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                checked={commonForm.termsAccepted}
                onChange={(e) => setCommonForm({ ...commonForm, termsAccepted: e.target.checked })}
              />
              <span className="text-slate-600 font-medium">
                I agree to the terms and conditions and consent to the verification and review process for this registration.
              </span>
            </label>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STUDENT MEMBERSHIP FORM FIELDS */}
        {/* ------------------------------------------------------------- */}
        {category === 'student' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentForm-collegeCode" className="block text-sm font-semibold text-slate-700 mb-1">College Code / Institution ID *</label>
                <input id="studentForm-collegeCode"
                  type="text"
                  required
                  placeholder="e.g., INST-1029"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.collegeCode}
                  onChange={(e) => setStudentForm({ ...studentForm, collegeCode: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="studentForm-collegeName" className="block text-sm font-semibold text-slate-700 mb-1">College Name *</label>
                <input id="studentForm-collegeName"
                  type="text"
                  required
                  placeholder="e.g., National Institute of Technology"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.collegeName}
                  onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentForm-studentName" className="block text-sm font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input id="studentForm-studentName"
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.studentName}
                  onChange={(e) => setStudentForm({ ...studentForm, studentName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="studentForm-department" className="block text-sm font-semibold text-slate-700 mb-1">Department / Branch *</label>
                <input id="studentForm-department"
                  type="text"
                  required
                  placeholder="e.g., Computer Science & Engineering"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentForm-year" className="block text-sm font-semibold text-slate-700 mb-1">Current Academic Year *</label>
                <select id="studentForm-year"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.year}
                  onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Post-Graduate / Ph.D.">Post-Graduate / Ph.D.</option>
                </select>
              </div>
              <div>
                <label htmlFor="studentForm-registerNo" className="block text-sm font-semibold text-slate-700 mb-1">College Registration / Roll No. *</label>
                <input id="studentForm-registerNo"
                  type="text"
                  required
                  placeholder="Roll No. or Univ Registration No."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.registerNo}
                  onChange={(e) => setStudentForm({ ...studentForm, registerNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentForm-mobileNo" className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. (WhatsApp enabled) *</label>
                <input id="studentForm-mobileNo"
                  type="tel"
                  required
                  placeholder="10-digit Phone Number"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.mobileNo}
                  onChange={(e) => setStudentForm({ ...studentForm, mobileNo: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="studentForm-emailId" className="block text-sm font-semibold text-slate-700 mb-1">Personal/Institutional Email ID *</label>
                <input id="studentForm-emailId"
                  type="email"
                  required
                  placeholder="student@example.com"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={studentForm.emailId}
                  onChange={(e) => setStudentForm({ ...studentForm, emailId: e.target.value })}
                />
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Areas of Interest (Select all that apply)</legend>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Leadership', 'Entrepreneurship', 'Business Networking', 'Innovation', 'Skill Development', 'Social Service'].map((interest) => (
                  <label key={interest} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-corp-blue focus:ring-corp-blue"
                      checked={studentForm.areasOfInterest.includes(interest)}
                      onChange={() => handleCheckboxChange('student', 'areasOfInterest', interest)}
                    />
                    <span>{interest}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            
            <div>
              <label htmlFor="studentForm-otherInterest" className="block text-sm font-semibold text-slate-700 mb-1">Other Areas (Specify if any)</label>
              <input id="studentForm-otherInterest"
                type="text"
                placeholder="e.g., Computer Vision, Aerial Robotics, Edge ML"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={studentForm.otherInterest}
                onChange={(e) => setStudentForm({ ...studentForm, otherInterest: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  required
                  className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                  checked={studentForm.declaration}
                  onChange={(e) => setStudentForm({ ...studentForm, declaration: e.target.checked })}
                />
                <span className="text-slate-600 font-medium">
                  DECLARATION: I hereby declare that the details provided above are true to the best of my knowledge. I promise to abide by the rules, code of ethics, and professional conduct of the AICAIML Council.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MSME NETWORK FORUM FORM FIELDS */}
        {/* ------------------------------------------------------------- */}
        {category === 'msme' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="msmeForm-date" className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                <input id="msmeForm-date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.date}
                  onChange={(e) => setMsmeForm({ ...msmeForm, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="msmeForm-enterpriseName" className="block text-sm font-semibold text-slate-700 mb-1">Enterprise Name *</label>
                <input id="msmeForm-enterpriseName"
                  type="text"
                  required
                  placeholder="Legal Name of the Company"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.enterpriseName}
                  onChange={(e) => setMsmeForm({ ...msmeForm, enterpriseName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="msmeForm-udyamRegNo" className="block text-sm font-semibold text-slate-700 mb-1">MSME / Udyam Registration No. *</label>
                <input id="msmeForm-udyamRegNo"
                  type="text"
                  required
                  placeholder="e.g., UDYAM-UP-00-1234567"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.udyamRegNo}
                  onChange={(e) => setMsmeForm({ ...msmeForm, udyamRegNo: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="msmeForm-natureOfBusiness" className="block text-sm font-semibold text-slate-700 mb-1">Nature of Business *</label>
                <input id="msmeForm-natureOfBusiness"
                  type="text"
                  required
                  placeholder="e.g., Industrial IoT, Predictive Automation"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.natureOfBusiness}
                  onChange={(e) => setMsmeForm({ ...msmeForm, natureOfBusiness: e.target.value })}
                />
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Business Constitution Type *</legend>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {['Proprietorship', 'Partnership', 'LLP', 'Private Limited', 'Others'].map((type) => (
                  <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="businessType"
                      className="text-corp-blue focus:ring-corp-blue"
                      checked={msmeForm.businessType === type}
                      onChange={() => setMsmeForm({ ...msmeForm, businessType: type })}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="msmeForm-applicantName" className="block text-sm font-semibold text-slate-700 mb-1">Applicant / Founders Name *</label>
                <input id="msmeForm-applicantName"
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.applicantName}
                  onChange={(e) => setMsmeForm({ ...msmeForm, applicantName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="msmeForm-designation" className="block text-sm font-semibold text-slate-700 mb-1">Designation *</label>
                <input id="msmeForm-designation"
                  type="text"
                  required
                  placeholder="e.g., CEO, Managing Partner"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.designation}
                  onChange={(e) => setMsmeForm({ ...msmeForm, designation: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="msmeForm-mobileNo" className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. *</label>
                <input id="msmeForm-mobileNo"
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.mobileNo}
                  onChange={(e) => setMsmeForm({ ...msmeForm, mobileNo: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="msmeForm-emailId" className="block text-sm font-semibold text-slate-700 mb-1">Business Email ID *</label>
                <input id="msmeForm-emailId"
                  type="email"
                  required
                  placeholder="info@yourcompany.com"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={msmeForm.emailId}
                  onChange={(e) => setMsmeForm({ ...msmeForm, emailId: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="msmeForm-businessAddress" className="block text-sm font-semibold text-slate-700 mb-1">Registered Business Address *</label>
              <textarea id="msmeForm-businessAddress"
                required
                rows={3}
                placeholder="Complete postal address with Pincode"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={msmeForm.businessAddress}
                onChange={(e) => setMsmeForm({ ...msmeForm, businessAddress: e.target.value })}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Membership Scale Category *</legend>
              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                {['Micro Enterprise', 'Small Enterprise', 'Medium Enterprise', 'Startup', 'Associate Member'].map((cat) => (
                  <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="membershipCategory"
                      className="text-corp-blue focus:ring-corp-blue"
                      checked={msmeForm.membershipCategory === cat}
                      onChange={() => setMsmeForm({ ...msmeForm, membershipCategory: cat })}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  required
                  className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                  checked={msmeForm.declaration}
                  onChange={(e) => setMsmeForm({ ...msmeForm, declaration: e.target.checked })}
                />
                <span className="text-slate-600 font-medium">
                  DECLARATION: We declare that the information submitted is authentic. We agree to participate in technology audits, code of ethics workshops, and adhere to MSME Forum rules.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CORPORATE & ASSOCIATE PARTNER FORM FIELDS */}
        {/* ------------------------------------------------------------- */}
        {category === 'corporate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="corporateForm-date" className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                <input id="corporateForm-date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.date}
                  onChange={(e) => setCorporateForm({ ...corporateForm, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="corporateForm-organizationName" className="block text-sm font-semibold text-slate-700 mb-1">Organization Name *</label>
                <input id="corporateForm-organizationName"
                  type="text"
                  required
                  placeholder="e.g., Robotics Solutions Corp"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.organizationName}
                  onChange={(e) => setCorporateForm({ ...corporateForm, organizationName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="corporateForm-registrationNo" className="block text-sm font-semibold text-slate-700 mb-1">Registration No. (GST/CIN/Udyam/Trust/Society) *</label>
                <input id="corporateForm-registrationNo"
                  type="text"
                  required
                  placeholder="e.g., CIN-U72900DL2026PTC34567"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.registrationNo}
                  onChange={(e) => setCorporateForm({ ...corporateForm, registrationNo: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="corporateForm-industrySector" className="block text-sm font-semibold text-slate-700 mb-1">Industry / Technology Sector *</label>
                <input id="corporateForm-industrySector"
                  type="text"
                  required
                  placeholder="e.g., Autonomous Systems, Aerospace"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.industrySector}
                  onChange={(e) => setCorporateForm({ ...corporateForm, industrySector: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="corporateForm-website" className="block text-sm font-semibold text-slate-700 mb-1">Corporate Website URL *</label>
                <input id="corporateForm-website"
                  type="url"
                  required
                  placeholder="https://www.yourdomain.com"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.website}
                  onChange={(e) => setCorporateForm({ ...corporateForm, website: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="corporateForm-authorizedRepresentativeName" className="block text-sm font-semibold text-slate-700 mb-1">Authorized Representative *</label>
                <input id="corporateForm-authorizedRepresentativeName"
                  type="text"
                  required
                  placeholder="Full Name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.authorizedRepresentativeName}
                  onChange={(e) => setCorporateForm({ ...corporateForm, authorizedRepresentativeName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="corporateForm-designation" className="block text-sm font-semibold text-slate-700 mb-1">Designation *</label>
                <input id="corporateForm-designation"
                  type="text"
                  required
                  placeholder="e.g., VP Technology, Vice President"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.designation}
                  onChange={(e) => setCorporateForm({ ...corporateForm, designation: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="corporateForm-mobileNo" className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. *</label>
                <input id="corporateForm-mobileNo"
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={corporateForm.mobileNo}
                  onChange={(e) => setCorporateForm({ ...corporateForm, mobileNo: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="corporateForm-emailId" className="block text-sm font-semibold text-slate-700 mb-1">Representative Email ID *</label>
              <input id="corporateForm-emailId"
                type="email"
                required
                placeholder="representative@yourcompany.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={corporateForm.emailId}
                onChange={(e) => setCorporateForm({ ...corporateForm, emailId: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="corporateForm-officeAddress" className="block text-sm font-semibold text-slate-700 mb-1">Corporate / Office Address *</label>
              <textarea id="corporateForm-officeAddress"
                required
                rows={3}
                placeholder="Complete address details with Pincode"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={corporateForm.officeAddress}
                onChange={(e) => setCorporateForm({ ...corporateForm, officeAddress: e.target.value })}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Partnership Scale *</legend>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-semibold">
                {['Corporate Partner', 'Associate Partner', 'Institutional Partner', 'Startup Partner', 'Knowledge Partner'].map((cat) => (
                  <label key={cat} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="corpCategory"
                      className="text-corp-blue focus:ring-corp-blue"
                      checked={corporateForm.membershipCategory === cat}
                      onChange={() => setCorporateForm({ ...corporateForm, membershipCategory: cat })}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Areas of Collaboration (Select all that apply)</legend>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Business Networking', 'Skill Development', 'Internship & Placement', 'Research & Innovation', 'CSR Initiatives', 'Training & Workshops', 'Technology Collaboration', 'Startup Support'].map((collab) => (
                  <label key={collab} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-corp-blue focus:ring-corp-blue"
                      checked={corporateForm.areasOfCollaboration.includes(collab)}
                      onChange={() => handleCheckboxChange('corporate', 'areasOfCollaboration', collab)}
                    />
                    <span>{collab}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  required
                  className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                  checked={corporateForm.declaration}
                  onChange={(e) => setCorporateForm({ ...corporateForm, declaration: e.target.checked })}
                />
                <span className="text-slate-600 font-medium">
                  DECLARATION: We declare that the representing executive is officially authorized to execute this application. We agree to cooperate in policy frameworks, FDP support, and student internship initiatives as outlined in AICAIML corporate charter.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCHOOL/COLLEGE INSTITUTIONAL FORM FIELDS */}
        {/* ------------------------------------------------------------- */}
        {category === 'school' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schoolForm-date" className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                <input id="schoolForm-date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.date}
                  onChange={(e) => setSchoolForm({ ...schoolForm, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="schoolForm-institutionName" className="block text-sm font-semibold text-slate-700 mb-1">Institution Name *</label>
                <input id="schoolForm-institutionName"
                  type="text"
                  required
                  placeholder="e.g., Delhi Public School, Apex Polytechnic"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.institutionName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, institutionName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schoolForm-institutionCode" className="block text-sm font-semibold text-slate-700 mb-1">Institution Code / Registration ID *</label>
                <input id="schoolForm-institutionCode"
                  type="text"
                  required
                  placeholder="e.g., CBSE-55012 / AICTE-1123"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.institutionCode}
                  onChange={(e) => setSchoolForm({ ...schoolForm, institutionCode: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="schoolForm-principalName" className="block text-sm font-semibold text-slate-700 mb-1">Principal / Head Name *</label>
                <input id="schoolForm-principalName"
                  type="text"
                  required
                  placeholder="Full Name of Principal/Head"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.principalName}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principalName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-700 mb-2">Institution Type *</legend>
                <div className="flex gap-4 text-xs font-semibold">
                  {['School', 'Polytechnic', 'College', 'University', 'Training Institute'].map((t) => (
                    <label key={t} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="instType"
                        className="text-corp-blue focus:ring-corp-blue"
                        checked={schoolForm.type === t}
                        onChange={() => setSchoolForm({ ...schoolForm, type: t })}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-700 mb-2">Management *</legend>
                <div className="flex gap-4 text-xs font-semibold">
                  {['Government', 'Government Aided', 'Private', 'Autonomous'].map((m) => (
                    <label key={m} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="managementType"
                        className="text-corp-blue focus:ring-corp-blue"
                        checked={schoolForm.management === m}
                        onChange={() => setSchoolForm({ ...schoolForm, management: m })}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schoolForm-designation" className="block text-sm font-semibold text-slate-700 mb-1">Principal Designation *</label>
                <input id="schoolForm-designation"
                  type="text"
                  required
                  placeholder="Principal / Director / Headmistress"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.designation}
                  onChange={(e) => setSchoolForm({ ...schoolForm, designation: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="schoolForm-mobileNo" className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. (Authorized) *</label>
                <input id="schoolForm-mobileNo"
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.mobileNo}
                  onChange={(e) => setSchoolForm({ ...schoolForm, mobileNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schoolForm-emailId" className="block text-sm font-semibold text-slate-700 mb-1">Official Email ID *</label>
                <input id="schoolForm-emailId"
                  type="email"
                  required
                  placeholder="principal@institution.edu"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={schoolForm.emailId}
                  onChange={(e) => setSchoolForm({ ...schoolForm, emailId: e.target.value })}
                />
              </div>
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-700 mb-2">Partnership Category *</legend>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {['Institutional', 'Associate Institution', 'Academic', 'Skill Development', 'Knowledge Partner'].map((p) => (
                    <label key={p} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="partnershipCat"
                        className="text-corp-blue focus:ring-corp-blue"
                        checked={schoolForm.partnershipCategory === p}
                        onChange={() => setSchoolForm({ ...schoolForm, partnershipCategory: p })}
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div>
              <label htmlFor="schoolForm-institutionAddress" className="block text-sm font-semibold text-slate-700 mb-1">Institution Postal Address *</label>
              <textarea id="schoolForm-institutionAddress"
                required
                rows={3}
                placeholder="Complete Campus Address with Pin Code"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={schoolForm.institutionAddress}
                onChange={(e) => setSchoolForm({ ...schoolForm, institutionAddress: e.target.value })}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Areas of Collaboration (Select all that apply)</legend>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Student Membership', 'FDPs', 'Skill Development', 'Entrepreneurship', 'Innovation & Research', 'AI & Robotics', 'Internship & Placement', 'Environmental Programmes'].map((collab) => (
                  <label key={collab} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-corp-blue focus:ring-corp-blue"
                      checked={schoolForm.areasOfCollaboration.includes(collab)}
                      onChange={() => handleCheckboxChange('school', 'areasOfCollaboration', collab)}
                    />
                    <span>{collab}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  required
                  className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                  checked={schoolForm.declaration}
                  onChange={(e) => setSchoolForm({ ...schoolForm, declaration: e.target.checked })}
                />
                <span className="text-slate-600 font-medium">
                  DECLARATION: We declare that this institution is legally recognized. We agree to support the establishment of an AICAIML AI & Robotics Club on campus and promote student research goals.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* UNIVERSITY PARTNERSHIP FORM FIELDS */}
        {/* ------------------------------------------------------------- */}
        {category === 'university' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="universityForm-date" className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
                <input id="universityForm-date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.date}
                  onChange={(e) => setUniversityForm({ ...universityForm, date: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="universityForm-universityName" className="block text-sm font-semibold text-slate-700 mb-1">University Name *</label>
                <input id="universityForm-universityName"
                  type="text"
                  required
                  placeholder="e.g., Delhi University, Anna University"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.universityName}
                  onChange={(e) => setUniversityForm({ ...universityForm, universityName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="universityForm-universityCode" className="block text-sm font-semibold text-slate-700 mb-1">University Code / UGC ID *</label>
                <input id="universityForm-universityCode"
                  type="text"
                  required
                  placeholder="e.g., UGC-UNIV-9921"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.universityCode}
                  onChange={(e) => setUniversityForm({ ...universityForm, universityCode: e.target.value })}
                />
              </div>
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-700 mb-2">University Type *</legend>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {['Central', 'State', 'Deemed', 'Private University'].map((ut) => (
                    <label key={ut} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="univType"
                        className="text-corp-blue focus:ring-corp-blue"
                        checked={universityForm.type === ut}
                        onChange={() => setUniversityForm({ ...universityForm, type: ut })}
                      />
                      <span>{ut}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="universityForm-authorizedRepresentativeName" className="block text-sm font-semibold text-slate-700 mb-1">Authorized Representative *</label>
                <input id="universityForm-authorizedRepresentativeName"
                  type="text"
                  required
                  placeholder="Dean, Registrar, VC Name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.authorizedRepresentativeName}
                  onChange={(e) => setUniversityForm({ ...universityForm, authorizedRepresentativeName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="universityForm-designation" className="block text-sm font-semibold text-slate-700 mb-1">Designation *</label>
                <select id="universityForm-designation"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.designation}
                  onChange={(e) => setUniversityForm({ ...universityForm, designation: e.target.value })}
                >
                  <option value="VC">Vice Chancellor (VC)</option>
                  <option value="Registrar">Registrar</option>
                  <option value="Dean">Dean</option>
                  <option value="Director">Director</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="universityForm-departmentSchool" className="block text-sm font-semibold text-slate-700 mb-1">Department / School *</label>
                <input id="universityForm-departmentSchool"
                  type="text"
                  required
                  placeholder="e.g., School of Emerging Technologies"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.departmentSchool}
                  onChange={(e) => setUniversityForm({ ...universityForm, departmentSchool: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="universityForm-mobileNo" className="block text-sm font-semibold text-slate-700 mb-1">Mobile No. *</label>
                <input id="universityForm-mobileNo"
                  type="tel"
                  required
                  placeholder="10-digit Phone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.mobileNo}
                  onChange={(e) => setUniversityForm({ ...universityForm, mobileNo: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="universityForm-emailId" className="block text-sm font-semibold text-slate-700 mb-1">Representative Email ID *</label>
                <input id="universityForm-emailId"
                  type="email"
                  required
                  placeholder="dean@university.edu"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                  value={universityForm.emailId}
                  onChange={(e) => setUniversityForm({ ...universityForm, emailId: e.target.value })}
                />
              </div>
              <fieldset>
                <legend className="block text-sm font-semibold text-slate-700 mb-2">Partnership Category *</legend>
                <div className="flex flex-wrap gap-1 text-xs font-semibold">
                  {['University', 'Academic', 'Research', 'Innovation', 'Skill Development Partner'].map((p) => (
                    <label key={p} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="univPartnership"
                        className="text-corp-blue focus:ring-corp-blue"
                        checked={universityForm.partnershipCategory === p}
                        onChange={() => setUniversityForm({ ...universityForm, partnershipCategory: p })}
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div>
              <label htmlFor="universityForm-universityAddress" className="block text-sm font-semibold text-slate-700 mb-1">University Postal Address *</label>
              <textarea id="universityForm-universityAddress"
                required
                rows={3}
                placeholder="Complete University Main Campus Address with Pincode"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-corp-blue focus:outline-none"
                value={universityForm.universityAddress}
                onChange={(e) => setUniversityForm({ ...universityForm, universityAddress: e.target.value })}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 mb-2">Areas of Collaboration (Select all that apply)</legend>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Student Development', 'Faculty Development', 'Research & Innovation', 'AI & Emerging Technologies', 'Entrepreneurship & Startups', 'Internship & Placement', 'Industry Collaboration', 'Community Outreach'].map((collab) => (
                  <label key={collab} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-corp-blue focus:ring-corp-blue"
                      checked={universityForm.areasOfCollaboration.includes(collab)}
                      onChange={() => handleCheckboxChange('university', 'areasOfCollaboration', collab)}
                    />
                    <span>{collab}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer text-xs leading-normal">
                <input
                  type="checkbox"
                  required
                  className="rounded text-corp-blue focus:ring-corp-blue shrink-0 mt-0.5"
                  checked={universityForm.declaration}
                  onChange={(e) => setUniversityForm({ ...universityForm, declaration: e.target.checked })}
                />
                <span className="text-slate-600 font-medium">
                  DECLARATION: We declare that the representing department holds due authority from university administrative bodies. We agree to support standard tech transfer guidelines and research objectives outlined by AICAIML.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* FORM SUBMIT ACTIONS */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-6 border-t border-slate-200 flex flex-col gap-4">
          <EmailVerification
            email={getCurrentEmail()}
            disabled={loading}
            verification={{
              step: verificationStep,
              verificationCode,
              requestCode,
              confirmCode,
              reset: resetVerification,
              message: verificationMessage,
              setVerificationCode,
              isConfirming
            }}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 max-w-sm text-center sm:text-left">
              * Fields marked with asterisks are mandatory. Digital credential review is secured by end-to-end encryption.
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1 sm:flex-none justify-center">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                id="btn-form-submit"
                className="flex-1 sm:flex-none justify-center min-w-[140px]"
                disabled={!verified && verificationStep !== 'verified' && commonForm.email.trim().toLowerCase() !== EXEMPT_ADMIN_EMAIL}
              >
                {loading ? 'Processing...' : (verified || verificationStep === 'verified' || commonForm.email.trim().toLowerCase() === EXEMPT_ADMIN_EMAIL) ? 'Submit Application' : 'Verify Email First'}
              </Button>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
