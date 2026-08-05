-- Diagnose and clean duplicate user records that can break single-row auth/member lookups.
-- Review output before executing DELETE statements.

-- 1) Find duplicate emails (case-insensitive)
SELECT LOWER(email) AS email_key, COUNT(*) AS duplicate_count
FROM public.users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, email_key;

-- 2) List exact duplicate records with timestamps and role
SELECT
  id,
  email,
  role,
  membership_no,
  membership_status,
  created_at,
  updated_at
FROM public.users
WHERE LOWER(email) IN (
  SELECT LOWER(email)
  FROM public.users
  GROUP BY LOWER(email)
  HAVING COUNT(*) > 1
)
ORDER BY LOWER(email), created_at DESC NULLS LAST, id;

-- 3) Optional: keep newest record per email and remove older duplicates.
-- Uncomment and run only after manual verification.
-- WITH ranked AS (
--   SELECT
--     id,
--     LOWER(email) AS email_key,
--     ROW_NUMBER() OVER (
--       PARTITION BY LOWER(email)
--       ORDER BY created_at DESC NULLS LAST, id DESC
--     ) AS rn
--   FROM public.users
-- )
-- DELETE FROM public.users u
-- USING ranked r
-- WHERE u.id = r.id
--   AND r.rn > 1;

-- 4) Enforce uniqueness (run after duplicates are removed).
-- CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON public.users (LOWER(email));
