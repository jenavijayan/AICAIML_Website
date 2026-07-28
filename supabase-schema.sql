-- AICAIML Supabase Schema Migration
-- Run this SQL in your Supabase project: Dashboard > SQL Editor > New query > Paste & Run

-- Enable UUID extension (optional, we use text ids for simplicity)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  membership_plan TEXT,
  membership_status TEXT NOT NULL DEFAULT 'inactive',
  permissions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- 3. Enquiries table
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT
);

-- 4. Applications table (membership applications)
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  membership_no TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  form_data JSONB NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT,
  reviewed_at TEXT,
  approval_date TEXT
);

-- 5. Event registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  designation TEXT,
  registered_at TEXT NOT NULL,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT
);

-- 6. News table
CREATE TABLE IF NOT EXISTS public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 7. Memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id TEXT PRIMARY KEY,
  membership_no TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  payment_method TEXT NOT NULL,
  payment_ref TEXT NOT NULL,
  status TEXT NOT NULL,
  paid_at TEXT NOT NULL,
  email_verified TEXT NOT NULL DEFAULT 'false',
  verification_code TEXT
);

-- 8. Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  duration TEXT NOT NULL,
  modules INTEGER NOT NULL,
  access TEXT NOT NULL,
  image TEXT,
  topics JSONB NOT NULL DEFAULT '[]',
  free_content JSONB,
  premium_content JSONB,
  created_at TEXT NOT NULL
);

-- 9. Certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  issued_at TEXT NOT NULL
);

-- 10. Projects table
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

-- 11. Events table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 12. Partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logo_placeholder TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 13. Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  organization TEXT NOT NULL,
  quote TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON public.certificates(code);
CREATE INDEX IF NOT EXISTS idx_memberships_no ON public.memberships(membership_no);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON public.enquiries(email);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(form_data);

-- Disable Row Level Security for server-side access
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials DISABLE ROW LEVEL SECURITY;
