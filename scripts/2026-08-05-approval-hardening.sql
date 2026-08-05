-- Approval workflow hardening for legacy Supabase schemas.
-- Run in Supabase SQL Editor for production parity.

BEGIN;

-- Users table columns required for password setup and safe account provisioning.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_reset_expires_at TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS membership_no TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'inactive';

-- Applications table columns used by approve/reject actions.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS approval_date TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS updated_at TEXT;

-- Defensive indexes and uniqueness for duplicate prevention.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON public.users (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_membership_no_unique ON public.users (membership_no) WHERE membership_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications (status);
CREATE INDEX IF NOT EXISTS applications_member_id_idx ON public.applications (member_id);

COMMIT;
