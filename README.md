# AICAIML — All India Council for Artificial Intelligence & Machine Learning

A full-stack website for AICAIML, an online learning organization offering AI, Machine Learning, and Robotics courses to students, individuals, and institutions. The platform combines a public marketing site with a real membership/course system: authenticated logins, gated course content with anti-skip video and read-tracking, auto-issued certificates, a public certificate/membership verification tool, and a full admin dashboard for managing content and registrations.

## Features

### Public site
- Home, About ("Know AICAIML"), Courses, Community, Events & Projects, Membership, Contact, Privacy/Terms pages
- Rotating hero background images (`/images/1.png` through `/images/6.png`)
- Membership categories: Student, MSME, Corporate, School/College, University, Faculty & Researchers
- Membership plans (Student, Educator, Individual, Institutional) with a checkout flow (Card/UPI, mocked payment)
- Contact form that sends real email via Gmail SMTP and persists every enquiry
- Public **Verification** page — anyone can look up a certificate or membership number and confirm it's genuine
- Email-verified membership applications with 6-digit verification codes

### Authenticated learning flow
- Real email/password login (no mock auth) backed by hashed passwords and session cookies
- Free and membership-gated ("premium") courses
- Dedicated **Course Detail** page per course with video lessons and text content
- **Integrity-verified course completion**:
  - Video playback blocks forward-seeking (skipping ahead is not allowed; rewinding is)
  - Lesson text is auto-marked "read" only once the user has actually scrolled past it (IntersectionObserver — no manual "mark as read" button)
  - The assessment/quiz stays hidden until the video is fully watched and all lesson text has been scrolled through, then unlocks behind a "Start Assessment" button
- Passing the quiz (>=70%) automatically issues a certificate, persisted server-side and independently verifiable via the Verification page
- Certificate can be downloaded as a PNG (canvas-generated) or printed/saved as a PDF (print styles are scoped to only the certificate, not the whole page)

### Membership Approval Module
- Membership form submits applicant details to Supabase with default status `Pending`
- Admin dashboard displays all applications in a table with Name, Email, Membership Type, Applied Date, Email Verified status, and approval Status
- Admin can Approve applications: updates status to `Approved`, saves approval date, and auto-sends an approval email to the applicant with membership ID and next-step instructions
- Admin can Reject applications: updates status to `Rejected` and records review timestamp
- Email verification codes sent on submission; users can verify their email via API
- Admin can create additional admin/member users from the dashboard

### Admin dashboard
Accessible to `role: admin` users only. Lets an administrator:
- View overview stats across the whole platform
- View all enquiries, applications, event registrations, memberships, and users
- Approve/reject membership applications with automatic email notifications
- Create admin/member users
- Create, list, and delete courses (with image upload)
- Publish announcements/news
- Manage projects, partners, and testimonials

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), custom navy/teal theme |
| Icons / animation | `lucide-react`, `motion` (Framer Motion) |
| Backend | Express 4, single server for API + app (dev: Vite middleware, prod: static `dist/`) |
| Database | Supabase (PostgreSQL) — cloud-hosted |
| Auth | Custom session-cookie auth; passwords hashed with Node's built-in `crypto.scryptSync` |
| File uploads | `multer` (course/content images -> `public/uploads/`) |
| Email | `nodemailer` via Gmail SMTP (App Password) |
| Certificates | Client-side HTML5 Canvas -> PNG download; browser print for PDF |

## Architecture

```
├── server.ts              # Express server: API routes, auth, session cookies, mailer, uploads
├── db.ts                  # Supabase data-access layer: all queries and mutations
├── supabase-schema.sql    # Supabase PostgreSQL schema: tables, indexes, RLS disable
├── supabase-seed.sql      # Baseline seed data for Supabase
├── .env                   # Environment variables (Supabase credentials, email SMTP)
├── src/
│   ├── App.tsx             # Client-side hash router + top-level layout/modals
│   ├── context/
│   │   └── AuthContext.tsx # useAuth() — current user, login, logout, premium-access check
│   ├── cmsData.ts          # Seed/fallback data: courses, news, events, projects, partners, testimonials, leadership messages
│   ├── pages/               # One file per route (Home, Courses, CourseDetail, AdminDashboard, ...)
│   └── components/          # Header, Footer, MembershipPlans, CourseQuizCertificate, UI primitives
├── public/
│   ├── videos/              # Hero + showcase video clips
│   ├── images/              # Hero background images (1.png - 6.png), posters, project images
│   └── uploads/              # Admin-uploaded course/content images (runtime-created)
└── dist/                     # Production build output (gitignored)
```

### Request flow
- In development, `server.ts` boots Vite in middleware mode, so one process serves both the API and the React app with HMR.
- In production (`npm run build && npm start`), the same Express server instead serves the built static files from `dist/`.
- Auth is a plain `aicaiml_session` httpOnly cookie mapped to a `sessions` row in Supabase (7-day expiry) — no JWT, no third-party auth service.
- Admin-only routes are protected by a `requireAdmin` middleware that checks the session user's `role`.

## Tech requirements

- Node.js **18+** (required for built-in `crypto` and modern ES modules)
- npm or yarn

## How to run

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Edit `.env` in the project root:
```env
# Gmail SMTP credentials for contact/membership emails
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx

# Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

To generate a real Gmail App Password: enable 2-Step Verification on the Google account, then create one at https://myaccount.google.com/apppasswords. Without real values, forms still save data to Supabase — they just won't send emails.

### 3. Set up Supabase database
1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** in the Supabase dashboard
3. Paste the contents of `supabase-schema.sql` and run it
4. Paste the contents of `supabase-seed.sql` and run it (optional: inserts baseline content)
5. Verify tables are created:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
   ```

### 4. Run in development
```bash
npm run dev
```
Starts the combined Express + Vite dev server at **http://localhost:3000** with hot reload.

A development admin/premium account is auto-seeded on first run:
- **Email:** `vendhanftpwatch@gmail.com`
- **Password:** `vendhan123`

### 5. Build & run for production
```bash
npm run build
npm start
```
`npm run build` produces the compiled client (`dist/`) and a bundled server (`dist/server.cjs`); `npm start` runs that bundle directly with Node.

### 6. Type-check
```bash
npm run lint
```
Runs `tsc --noEmit` across the project.

## Data storage

All data lives in Supabase (PostgreSQL), configured via the `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables. No local database file is required.

### Key tables
- `users` — registered users and admins (passwords hashed with `crypto.scryptSync`)
- `sessions` — authenticated session tokens (7-day expiry)
- `enquiries` — contact form submissions
- `applications` — membership applications with email verification codes, status tracking, and approval dates
- `event_registrations` — event sign-ups
- `news` — published news/articles
- `memberships` — paid membership records
- `courses` — course catalog with topics, free/premium content
- `certificates` — issued course completion certificates with verifiable codes
- `projects` — project listings
- `events` — upcoming events
- `partners` — partner organizations
- `testimonials` — user testimonials

## API Routes

### Public
- `GET /api/health` — server health check
- `GET /api/news` — list published news
- `GET /api/courses` — list all courses
- `GET /api/projects` — list all projects
- `GET /api/events` — list all events
- `GET /api/partners` — list all partners
- `GET /api/testimonials` — list all testimonials
- `POST /api/membership/submit` — submit membership application (generates verification code, sends email)
- `POST /api/membership/verify-email` — verify email with 6-digit code
- `GET /api/verify/certificate/:code` — public certificate verification
- `GET /api/verify/membership/:no` — public membership verification

### Authenticated
- `POST /api/auth/login` — login with email/password
- `POST /api/auth/logout` — logout and destroy session
- `POST /api/auth/change-password` — change password (requires current password)

### Admin-only
- `GET /api/admin/overview` — platform stats
- `GET /api/admin/enquiries` — list all enquiries
- `GET /api/admin/applications` — list all membership applications
- `POST /api/admin/applications/:id/approve` — approve application and send email
- `POST /api/admin/applications/:id/reject` — reject application
- `GET /api/admin/event-registrations` — list all event registrations
- `GET /api/admin/memberships` — list all paid memberships
- `GET /api/admin/users` — list all users
- `POST /api/admin/users` — create new user/admin
- `GET /api/admin/courses` — list courses for admin
- `POST /api/admin/courses` — create course
- `DELETE /api/admin/courses/:id` — delete course
- `POST /api/admin/upload` — upload image
- `POST /api/admin/news` — publish news/article
- `GET /api/admin/projects` — list projects
- `POST /api/admin/projects` — create project
- `DELETE /api/admin/projects/:id` — delete project
- `POST /api/admin/events` — create event
- `DELETE /api/admin/events/:id` — delete event
- `GET /api/admin/partners` — list partners
- `POST /api/admin/partners` — create partner
- `DELETE /api/admin/partners/:id` — delete partner
- `GET /api/admin/testimonials` — list testimonials
- `POST /api/admin/testimonials` — create testimonial
- `DELETE /api/admin/testimonials/:id` — delete testimonial

## Admin access

Access the admin dashboard at: `http://localhost:3000/#admin`

Default credentials:
- **Email:** `vendhanftpwatch@gmail.com`
- **Password:** `vendhan123`

You can also create additional admin users from the Admin Dashboard > Registered Users tab.

## Project Structure

```
├── server.ts              # Express server: API routes, auth, session cookies, mailer, uploads, video serving
├── db.ts                  # Supabase data-access layer: all queries and mutations
├── supabase-schema.sql    # Supabase PostgreSQL schema: tables, indexes, RLS disable
├── supabase-seed.sql      # Baseline seed data for Supabase
├── .env                   # Environment variables (Supabase credentials, email SMTP)
├── .gitignore             # Git ignore rules
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── src/
│   ├── App.tsx             # Client-side hash router + top-level layout/modals
│   ├── context/
│   │   └── AuthContext.tsx # useAuth() — current user, login, logout, premium-access check
│   ├── cmsData.ts          # Seed/fallback data for all CMS-like content
│   ├── hooks/
│   │   └── useDocumentMeta.ts  # Dynamic document title/meta updater
│   ├── pages/               # Route components:
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Courses.tsx
│   │   ├── CourseDetail.tsx
│   │   ├── Community.tsx
│   │   ├── EventsProjects.tsx
│   │   ├── Membership.tsx
│   │   ├── Contact.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Verification.tsx
│   │   └── ...
│   ├── components/          # Shared UI components:
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MembershipForms.tsx
│   │   ├── MembershipPlans.tsx
│   │   ├── CourseQuizCertificate.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── IconBadge.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── TabList.tsx
│   │   │   └── Loader.tsx
│   │   └── ...
│   └── styles/
│       └── index.css        # Global styles + Tailwind imports
└── public/
    ├── videos/              # Hero + showcase MP4 videos
    ├── images/              # Hero backgrounds, posters, project thumbnails
    ├── resources/           # Syllabus text files
    ├── uploads/             # Admin-uploaded images (runtime-created)
    └── favicon.png
```

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `EMAIL_USER` | Gmail address for sending emails | Yes (for email features) |
| `EMAIL_APP_PASSWORD` | Gmail App Password (not normal password) | Yes (for email features) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin operations) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment mode (`development` or `production`) | No |
| `SEED_DEV_USER` | Set to `true` to seed dev user in production | No |

## License

Private / Proprietary — All India Council for Artificial Intelligence & Machine Learning (AICAIML)
