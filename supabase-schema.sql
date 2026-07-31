-- AICAIML Membership Management System - Expanded Schema
-- Run this SQL in your Supabase project: Dashboard > SQL Editor > New query > Paste & Run

-- ============================================
-- 1. USERS (existing + enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_reset_token TEXT,
  password_reset_expires_at TEXT,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  role TEXT NOT NULL DEFAULT 'member',
  membership_plan TEXT,
  membership_no TEXT UNIQUE,
  membership_category TEXT,
  membership_status TEXT NOT NULL DEFAULT 'inactive',
  membership_issued_at TEXT,
  membership_expires_at TEXT,
  photo_url TEXT,
  phone TEXT,
  designation TEXT,
  organization TEXT,
  department TEXT,
  college_code TEXT,
  roll_no TEXT,
  student_id TEXT,
  gstin TEXT,
  cin TEXT,
  industry_sector TEXT,
  authorized_rep TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',
  profile_completed BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  must_reset_password BOOLEAN DEFAULT false,
  last_login_at TEXT,
  last_login_ip TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- ============================================
-- 2. SESSIONS (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT
);

-- ============================================
-- 3. ENQUIRIES (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

-- ============================================
-- 4. APPLICATIONS (existing + enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  membership_no TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  approval_date TEXT,
  rejection_reason TEXT,
  assigned_reviewer TEXT,
  member_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::TEXT
);

-- Migration for existing databases that may use membership_category instead of category
ALTER TABLE public.applications RENAME COLUMN IF EXISTS membership_category TO category;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- ============================================
-- 5. MEMBERSHIPS (existing + enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id TEXT PRIMARY KEY,
  membership_no TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  payment_method TEXT NOT NULL,
  payment_ref TEXT NOT NULL,
  status TEXT NOT NULL,
  paid_at TEXT NOT NULL,
  issued_at TEXT,
  expires_at TEXT,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT,
  auto_renew BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- 6. COURSES (existing + enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  duration TEXT NOT NULL,
  total_hours INTEGER DEFAULT 0,
  modules INTEGER NOT NULL DEFAULT 0,
  access TEXT NOT NULL DEFAULT 'free',
  image TEXT,
  topics JSONB NOT NULL DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  learning_outcomes JSONB DEFAULT '[]',
  free_content JSONB,
  premium_content JSONB,
  instructor_id TEXT REFERENCES public.users(id),
  instructor_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  max_students INTEGER,
  completion_certificate BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT
);

-- ============================================
-- 7. COURSE ENROLLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_date TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  attendance_percentage INTEGER DEFAULT 0,
  quiz_score INTEGER,
  final_exam_score INTEGER,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_at TEXT,
  completion_date TEXT,
  drop_reason TEXT,
  assigned_batch TEXT,
  assigned_instructor TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, course_id)
);

-- ============================================
-- 8. SESSIONS (course sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id TEXT REFERENCES public.enrollments(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  trainer TEXT,
  session_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  duration_minutes INTEGER,
  location TEXT,
  meeting_link TEXT,
  recording_url TEXT,
  materials JSONB DEFAULT '[]',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  attendance_taken BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- 9. ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id TEXT REFERENCES public.enrollments(id),
  status TEXT NOT NULL DEFAULT 'absent',
  check_in_time TEXT,
  check_out_time TEXT,
  remarks TEXT,
  marked_by TEXT,
  created_at TEXT NOT NULL
);

-- ============================================
-- 10. ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  due_date TEXT,
  max_score INTEGER,
  attachments JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- 11. ASSIGNMENT SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachments JSONB DEFAULT '[]',
  submitted_at TEXT,
  score INTEGER,
  feedback TEXT,
  graded_by TEXT,
  graded_at TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL
);

-- ============================================
-- 12. QUIZZES
-- ============================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_id TEXT REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  time_limit_minutes INTEGER,
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  attempts_allowed INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- 13. QUIZ RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  answers JSONB DEFAULT '{}',
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  time_spent_minutes INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

-- ============================================
-- 14. CERTIFICATES (existing + enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  membership_no TEXT,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'course',
  issue_date TEXT NOT NULL,
  expiry_date TEXT,
  verification_url TEXT,
  blockchain_hash TEXT,
  digital_signature TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  revoked BOOLEAN DEFAULT false,
  revoked_at TEXT,
  revoked_by TEXT,
  created_at TEXT NOT NULL
);

-- ============================================
-- 15. LEARNING HOURS / ACTIVITY
-- ============================================
CREATE TABLE IF NOT EXISTS public.learning_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES public.courses(id) ON DELETE SET NULL,
  session_id TEXT REFERENCES public.course_sessions(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ============================================
-- 16. SKILLS & BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT,
  proficiency_level TEXT DEFAULT 'beginner',
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  awarded_for TEXT,
  issued_at TEXT NOT NULL,
  expires_at TEXT
);

-- ============================================
-- 17. ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}',
  points_awarded INTEGER DEFAULT 0,
  achieved_at TEXT NOT NULL
);

-- ============================================
-- 18. PAYMENTS & INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  membership_id TEXT REFERENCES public.memberships(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL,
  payment_ref TEXT NOT NULL,
  gateway TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TEXT,
  invoice_url TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  payment_id TEXT REFERENCES public.payments(id),
  membership_id TEXT REFERENCES public.memberships(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  tax_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  billing_address JSONB DEFAULT '{}',
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL
);

-- ============================================
-- 19. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  channels JSONB DEFAULT '[]',
  read BOOLEAN DEFAULT false,
  read_at TEXT,
  sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- 20. MESSAGES / SUPPORT TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'support',
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  resolved_at TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.message_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL
);

-- ============================================
-- 21. ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  target_audience JSONB DEFAULT '["all"]',
  published BOOLEAN DEFAULT false,
  published_at TEXT,
  expires_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- ============================================
-- 22. EVENTS & REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  category TEXT NOT NULL,
  max_participants INTEGER,
  registration_deadline TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  designation TEXT,
  registered_at TEXT NOT NULL,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT,
  payment_status TEXT DEFAULT 'pending',
  attendance_status TEXT DEFAULT 'not_attended',
  certificate_issued BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL
);

-- ============================================
-- 23. DOWNLOADS
-- ============================================
CREATE TABLE IF NOT EXISTS public.downloads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  target_audience JSONB DEFAULT '["all"]',
  download_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- ============================================
-- 24. INSTITUTIONS / PARTNERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  website TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  partnership_type TEXT,
  partnership_status TEXT DEFAULT 'active',
  joined_at TEXT,
  created_at TEXT NOT NULL
);

-- ============================================
-- 25. AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- ============================================
-- 26. LOGIN HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_time TEXT NOT NULL,
  logout_time TEXT,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  location TEXT,
  suspicious BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL
);

-- ============================================
-- 27. ROLE PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(role, permission)
);

-- ============================================
-- 28. AI RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  relevance_score INTEGER DEFAULT 0,
  viewed BOOLEAN DEFAULT false,
  acted_upon BOOLEAN DEFAULT false,
  created_at TEXT NOT NULL
);

-- ============================================
-- 29. PROJECTS (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  status TEXT NOT NULL,
  impact TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- 30. NEWS (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- 31. PARTNERS (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logo_placeholder TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- 32. TESTIMONIALS (existing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  organization TEXT NOT NULL,
  quote TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- ============================================
-- 33. MEMBERSHIP CATEGORIES (lookup)
-- ============================================
CREATE TABLE IF NOT EXISTS public.membership_categories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  fee INTEGER DEFAULT 0,
  validity_months INTEGER DEFAULT 12,
  benefits JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TEXT NOT NULL
);

-- ============================================
-- SEED DATA: Membership Categories
-- ============================================
INSERT INTO public.membership_categories (id, code, name, description, fee, validity_months, benefits, active, created_at) VALUES
  ('cat-stu-001', 'STU', 'Student', 'Student membership for undergraduate and postgraduate students', 500, 12, '["Course access", "Certifications", "Community access", "Events"]', true, NOW()),
  ('cat-pro-001', 'PRO', 'Professional', 'Professional membership for working professionals', 2000, 12, '["All courses", "Certifications", "Mentorship", "Job portal", "Community access"]', true, NOW()),
  ('cat-res-001', 'RES', 'Researcher', 'Research membership for academic researchers', 1500, 12, '["Research papers", "Conferences", "Collaboration tools", "Publications"]', true, NOW()),
  ('cat-fac-001', 'FAC', 'Faculty', 'Faculty membership for educators and trainers', 1500, 12, '["Teaching resources", "Workshops", "Certifications", "Research tools"]', true, NOW()),
  ('cat-ins-001', 'INS', 'Institution', 'Institutional membership for colleges and universities', 10000, 12, '["Campus portal", "Bulk enrollments", "Trainer access", "Custom courses"]', true, NOW()),
  ('cat-apt-001', 'APT', 'Partner', 'Partner membership for organizations and companies', 25000, 12, '["Branding", "Co-branded events", "Talent pipeline", "Custom packages"]', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED DATA: Role Permissions
-- ============================================
INSERT INTO public.role_permissions (id, role, permission, description, created_at) VALUES
  ('rp-admin-1', 'admin', 'admin_panel', 'Access admin dashboard', NOW()),
  ('rp-admin-2', 'admin', 'manage_users', 'Create, edit, delete users', NOW()),
  ('rp-admin-3', 'admin', 'manage_applications', 'Approve/reject applications', NOW()),
  ('rp-admin-4', 'admin', 'manage_courses', 'Create, edit, delete courses', NOW()),
  ('rp-admin-5', 'admin', 'manage_memberships', 'Manage all memberships', NOW()),
  ('rp-admin-6', 'admin', 'view_reports', 'View analytics and reports', NOW()),
  ('rp-admin-7', 'admin', 'export_data', 'Export data to Excel/PDF', NOW()),
  ('rp-admin-8', 'admin', 'send_notifications', 'Send bulk notifications', NOW()),
  ('rp-member-1', 'member', 'view_dashboard', 'Access member dashboard', NOW()),
  ('rp-member-2', 'member', 'view_courses', 'Browse and enroll in courses', NOW()),
  ('rp-member-3', 'member', 'view_certificates', 'View own certificates', NOW()),
  ('rp-member-4', 'member', 'access_premium', 'Access premium content', NOW()),
  ('rp-member-5', 'member', 'download_materials', 'Download course materials', NOW()),
  ('rp-member-6', 'member', 'view_events', 'View and register for events', NOW()),
  ('rp-member-7', 'member', 'submit_tickets', 'Submit support tickets', NOW())
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_membership_no ON public.users(membership_no);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(membership_status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_course_sessions_course ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(code);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Disable RLS for server-side access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_categories DISABLE ROW LEVEL SECURITY;
