# AICAIML Website — Modification Guide

A quick-reference map of which file/section to edit for each area of the site.
All paths are relative to the project root (`src/`).

---

## Directory Structure Overview

```
src/
├── App.tsx                          # Root router, global modals, page wiring
├── main.tsx                         # React entry point
├── index.css                        # Global styles, theme tokens, animations
├── cmsData.ts                       # All editable content (courses, events, projects, news, etc.)
├── vite.config.ts                   # Vite build config, alias, base path
├── context/
│   └── AuthContext.tsx              # Auth state, login/logout, premium access
├── hooks/
│   ├── useDocumentMeta.ts           # Per-page <title> + meta description
│   └── useFormVerification.ts       # Email OTP request/confirm flow
├── lib/
│   └── assetPaths.ts                # resolveAssetUrl() — image/video URL helper
├── components/
│   ├── Header.tsx                   # Global top navigation
│   ├── Footer.tsx                   # Global footer
│   ├── CookieConsent.tsx            # Cookie banner modal
│   ├── MembershipPlans.tsx          # Pricing cards + checkout modal
│   ├── MembershipForms.tsx          # Institutional enrollment forms (5 categories)
│   ├── EmailVerification.tsx        # Reusable email OTP UI
│   ├── CourseQuizCertificate.tsx    # Quiz + certificate generator
│   └── ui/
│       ├── index.ts                 # Barrel export for all UI primitives
│       ├── Button.tsx               # Shared button (variants: primary/accent/outline/ghost/danger)
│       ├── IconButton.tsx           # Icon-only button
│       ├── Badge.tsx                # Status pills
│       ├── Card.tsx                 # Surface, IconBadge, StatCard
│       ├── TextField.tsx            # Labelled input with hint/error
│       ├── Dialog.tsx               # Accessible modal (focus trap, Escape, return focus)
│       ├── DialogHeader.tsx         # Modal header bar
│       ├── PageHero.tsx             # Shared dark hero banner (used on inner pages)
│       ├── Tabs.tsx                 # ARIA tabs (TabList, TabPanel)
│       └── cn.ts                    # Tailwind class-merging helper (clsx + twMerge)
├── pages/
│   ├── Home.tsx                     # Landing page — hero, ecosystem, projects, events, testimonials, etc.
│   ├── KnowAICAIML.tsx              # About page (vision, mission, seven chakras)
│   ├── Courses.tsx                  # Course listing (free + membership)
│   ├── CourseDetail.tsx             # Course reader (video, lessons, quiz, certificate)
│   ├── EventsProjects.tsx           # Events calendar + project grid
│   ├── Learners.tsx                 # Community portal (sandbox, resume builder, careers)
│   ├── Benefits.tsx                 # Membership benefits (tabbed layout)
│   ├── Verification.tsx            # Public certificate/membership verification
│   ├── Login.tsx                    # Sign-in form
│   ├── Legal.tsx                    # Privacy policy + Terms of Use
│   └── AdminDashboard.tsx           # Admin panel (overview, applications, members)
├── images/                          # logos (logo.png, logo-web.png)
└── videos/                          # video assets (v1.mp4 … v11.mp4)
```

---

## 1. Images

### Where image code lives
| Type | File | Section |
|------|------|---------|
| Logo (header + footer + login) | `components/Header.tsx:83` / `components/Footer.tsx:28` / `pages/Login.tsx:44` | `<img src={logo}>` — imported from `images/logo-web.png` |
| Hero background | `pages/Home.tsx:130-155` | Rotating background cycles through `heroAssets` array (videos + images every 5s); `heroBgIndex` state, `heroCurrentAsset` derived value |
| Leadership portraits | `pages/Home.tsx:279-285` | `{msg.photoUrl}` — sourced from `cmsData.ts:460-468` |
| Project thumbnails | `pages/Home.tsx:482-490` and `pages/EventsProjects.tsx:98-106` | `<img src={proj.image}>` |
| Testimonial avatars | `pages/Home.tsx:597-604` | `{testimonialsList[idx].avatarUrl}` |
| Course thumbnails | `pages/Courses.tsx` — no thumbnails present (uses badges/icons) | N/A |
 
### How to change an image
1. **Static images** — place the file in `public/images/` and reference it via `resolveAssetUrl('/images/your-image.jpg')` (which resolves to `/images/your-image.jpg` at runtime since `BASE_URL` is `/`). Alternatively use a full external URL — `resolveAssetUrl()` passes those through unchanged (`lib/assetPaths.ts:3`).
2. **Logos** — imported as ES modules at build time: `import logo from '../images/logo-web.png'` in `Header.tsx`, `Footer.tsx`, and `Login.tsx`. These live in `src/images/`.
3. **Hero background assets** — edit the `heroAssets` array at `Home.tsx:83-88`. Each entry can be `{ type: 'video', src, poster }` or `{ type: 'image', src }`. The background rotates every 5 seconds via `setInterval` (`Home.tsx:91-96`), with `heroBgIndex` state (`Home.tsx:89`) and `heroCurrentAsset` derived value (`Home.tsx:98`). Videos use `autoPlay muted loop playsInline` with a `poster` image. Place video files in `public/videos/` and images in `public/images/`.

### Image file locations on disk

#### `public/images/` — served at `/images/*` by both Vite dev server and Express
| File | Used by | Purpose |
|------|---------|---------|
| `IMAGE1.jpg` | `Home.tsx:84-86` | Hero rotating background asset (video poster + image slide) |
| `IMAGE2.jpg` | `Home.tsx:86-87` | Hero rotating background asset (image slide) |
| `hero-poster.jpg` | `Home.tsx:87-88` | Hero rotating background asset (image slide) |
| `project-nasci-initiative.jpg` | `cmsData.ts:159` (proj-1) | National AI Skills project thumbnail |
| `project-robotics-sandbox.jpg` | `cmsData.ts:168` (proj-2) | Robotics sandbox project thumbnail |
| `project-ai-ethics-healthcare.jpg` | `cmsData.ts:177` (proj-3) | AI Ethics project thumbnail |
| `project-smart-agriculture.jpg` | `cmsData.ts:185` (proj-4) | Smart Agri-IoT project thumbnail |
| `ashwini_vaishnaw_photo.jpg` | `cmsData.ts:460` (lead-1) | Leadership message portrait |
| `ashwini_vaishnaw_card.jpg` | (not referenced in JSX yet) | Leadership message card image (alt) |
| `s_krishnan_photo.jpg` | `cmsData.ts:467` (lead-2) | Leadership message portrait |
| `s_krishnan_card.jpg` | (not referenced in JSX yet) | Leadership message card image (alt) |

#### `src/images/` — imported as ES modules (bundled by Vite)
| File | Used by | Purpose |
|------|---------|---------|
| `logo-web.png` (167 KB) | `Header.tsx:6`, `Footer.tsx:2` | Site logo in header and footer |
| `logo.png` (2 MB) | `Login.tsx:6` | Full logo on the login page |

> **Note**: There is also a root-level `/images/` directory (1.png through 11.png, 2–3 MB each) that is **not** referenced by any source file. It appears to be legacy/unused.

### Key cmsData fields for images & media
| Entity | Field | File:Line | Source |
|--------|-------|-----------|--------|
| Project | `image` | `cmsData.ts:159,168,177,185` | `public/images/` |
| LeadershipMessage | `photoUrl` | `cmsData.ts:460,467` | `public/images/` |
| Testimonial | `avatarUrl` | `cmsData.ts:417-433` | External Unsplash URLs |
| Course (premium) | `premiumContent.videoUrl` | `cmsData.ts:338,368,397` | `public/videos/` (via `resolveAssetUrl`) |
| Course (resource) | `premiumContent.resourceUrl` | `cmsData.ts:340,369,398` | `public/resources/` (via `resolveAssetUrl`) |
| Home showcase videos | inline array | `Home.tsx:373-388` | `public/videos/` |

---

## 2. Videos

### Where video code lives
| Type | File | Section |
|------|------|---------|
| Hero section video | `pages/Home.tsx:132-145` | `<video>` inside the rotating `heroAssets` array — `autoPlay muted loop playsInline poster`; conditionally rendered when `heroCurrentAsset.type === 'video'` |
| "AI in Action" showcase grid | `pages/Home.tsx:358-429` | Four `<video>` elements with autoplay/loop/muted |
| Course lecture video | `pages/CourseDetail.tsx:191-200` | `<video>` with seek-guard, watched-tracking |
| Course video source | `cmsData.ts:338` | `premiumContent.videoUrl = resolveAssetUrl('/videos/...mp4')` |
| Showcase video sources | `Home.tsx:373-388` | `resolveAssetUrl('/videos/showcase-v1.mp4')` etc. |

### Video attributes to note
- **Home showcase** (`Home.tsx:395-417`): `autoPlay loop muted playsInline preload="auto" controlsList="nodownload"`
- **CourseDetail** (`CourseDetail.tsx:191-200`): Same attributes plus `onTimeUpdate`, `onSeeking`, `onEnded` handlers for progress tracking (`CourseDetail.tsx:68-87`). The seek guard at `:79` prevents skipping ahead.
- **Video fallback**: `Home.tsx:398-405` — if a video errors, it's hidden and a fallback div shows "Video playback unavailable".

### Video asset locations

#### `public/videos/` — served at `/videos/*` by both Vite dev server and Express
| File | Used by | Purpose |
|------|---------|---------|
| `IMAGE3.mp4` | `Home.tsx:83` | Hero section background video |
| `showcase-v1.mp4` | `Home.tsx:373` | "Human-AI Collaboration" showcase |
| `showcase-v2.mp4` | `Home.tsx:378` | "Immersive Computing" showcase |
| `showcase-v3.mp4` | `Home.tsx:383` | "Autonomous Decision-Making" showcase |
| `v11.mp4` | `Home.tsx:388` | "Precision Robotics" showcase |
| `v1.mp4` … `v10.mp4` | (not directly referenced — available as pool) | Additional video assets |
| `ai-data-stream.mp4` | `cmsData.ts:338` | Course-4 (Generative AI) lecture video |
| `ai-circuit-board.mp4` | `cmsData.ts:368` | Course-5 (Robotics) lecture video |
| `ai-circuit-chip.mp4` | `cmsData.ts:397` | Course-6 (Career Readiness) lecture video |

#### `public/resources/` — downloadable course resources
| File | Used by | Purpose |
|------|---------|---------|
| `generative-ai-llms-syllabus.txt` | `cmsData.ts:340` | Course-4 syllabus download |
| `applied-robotics-syllabus.txt` | `cmsData.ts:369` | Course-5 lab guide download |
| `ai-career-readiness-syllabus.txt` | `cmsData.ts:398` | Course-6 interview guide download |

> **Note**: There is also a `src/videos/` directory in the source tree containing `v1.mp4` through `v11.mp4`. These are **not actively referenced** by any component — the showcase and course videos all come from `public/videos/`.

### How to change a video
1. Place the file in `public/videos/`.
2. Update the `resolveAssetUrl('/videos/...')` call in either `Home.tsx` (showcase grid at `:373-388`) or `cmsData.ts` (course lecture video under `premiumContent.videoUrl`).

---

---

## 3. Content / Hero Sections

### Page-level hero banners (inner pages)
Uses the shared `<PageHero>` component:
- **File**: `components/ui/PageHero.tsx`
- **Props**: `eyebrow`, `eyebrowIcon`, `title`, `description`, `align`, `size`, `maxWidth`, `children`, `after`, `className`
- **Used on**: `Courses.tsx:52`, `Contact.tsx:84`, `Verification.tsx:47`

### Landing page hero (Home)
- **File**: `pages/Home.tsx:123-187` (SECTION 1: HERO BANNER)
- **Key elements**:
  - `heroImages` array at `Home.tsx:83-86`
  - Rotating background every 5s via `setInterval` at `Home.tsx:89-94`
  - Title: "Learn AI. Lead Change. Build the Future." at `Home.tsx:148`
  - Subtitle paragraph at `Home.tsx:151-153`
  - CTAs: "Get Started" → Courses, "Discover Our Vision" → Know AICAIML at `Home.tsx:160-184`
  - Gradient text: uses `.text-gradient-animate-light` class

### Content/text blocks by section
| Section | File | Lines |
|---------|------|-------|
| Hero banner | `pages/Home.tsx` | 123-187 |
| Digital Ecosystem (icon grid) | `pages/Home.tsx` | 189-217, 431-459 |
| Why AICAIML / core projects | `pages/Home.tsx` | 219-248, 461-504 |
| Leadership Messages | `pages/Home.tsx` | 250-310 |
| Courses teaser | `pages/Home.tsx` | 312-356 |
| AI in Action (video grid) | `pages/Home.tsx` | 358-429 |
| Upcoming Events | `pages/Home.tsx` | 506-556 |
| Partners logo strip | `pages/Home.tsx` | 558-578 |
| Testimonials carousel | `pages/Home.tsx` | 580-630 |
| About the Network Forum | `pages/Home.tsx` | 632-695 |
| Membership Categories | `pages/Home.tsx` | 697-752 |
| Benefits of Joining | `pages/Home.tsx` | 754-796 |
| News & Announcements | `pages/Home.tsx` | 798-833 |
| Closing Banner | `pages/Home.tsx` | 835-857 |
| All editable text (projects, events, news, courses, testimonials, leadership) | `cmsData.ts` | 153-469 |

### About page content
- **File**: `pages/KnowAICAIML.tsx`
- **Sections**: Vision (`:28-39`), Mission (`:41-67`), What AICAIML Does (`:69-90`), Purpose (`:92-98`), Commitments (`:100-124`), Slogan (`:126-132`), Seven Chakras (`:134-165`)

### Legal text (Privacy & Terms)
- **File**: `pages/Legal.tsx`
- All policy text is hardcoded in JSX (`:51-147` privacy, `:149-246` terms). No CMS file — edit directly in `Legal.tsx`.

---

## 4. Forms

### Event Registration Modal (in App.tsx)
- **File**: `App.tsx:418-556`
- **Handler**: `submitEventRegistration()` at `App.tsx:95-131` posts to `/api/events/register`
- **Fields**: name, email, phone, organization, designation + honeypot + email verification
- **Email verification** wraps the form via `<EmailVerification>` at `App.tsx:523-536`

### Donation Modal (in App.tsx)
- **File**: `App.tsx:561-736`
- **Handler**: `handleDonationSubmit()` at `App.tsx:149-191`
- **Fields**: donation amount (preset buttons + custom), name, email, PAN card number + honeypot
- **Bank details display**: hardcoded at `App.tsx:597-624` (account number, IFSC, branch)
- **Result view**: shows reference number + bank coordinates + email log at `App.tsx:585-633`

### Contact Enquiry Form
- **File**: `pages/Contact.tsx`
- **Handler**: `submitVerifiedForm()` at `Contact.tsx:25-55` posts to `/api/enquiry/submit`
- **Fields**: name, email, phone, message + honeypot + email verification
- **Form rendering**: `Contact.tsx:180-292`

### Membership Checkout (paid plans)
- **File**: `components/MembershipPlans.tsx`
- **Plans data**: `cmsData.ts:78-143` (`membershipPlans` array)
- **Handler**: `submitCheckout()` at `MembershipPlans.tsx:43-84` posts to `/api/membership/checkout`
- **Form fields**: name, email, phone, payment method (card/UPI), card number/expiry/CVV or UPI ID + honeypot + email verification
- **Pricing/plan content**: `cmsData.ts` — edit `name`, `price`, `billingPeriod`, `features[]`

### Institutional Enrollment Forms (5 categories)
- **File**: `components/MembershipForms.tsx`
- **Category routing**: triggered from `App.tsx:388-386` (membership page category cards) → sets `selectedCategory` → loads `<MembershipForms>` via `Suspense` at `App.tsx:292-297`
- **Categories**: student (`MembershipForms.tsx:528`), msme (`MembershipForms.tsx:681`), corporate (`MembershipForms.tsx:850`), school (`MembershipForms.tsx:1030`), university (remainder of file)
- **Handler**: `handleSubmit()` at `MembershipForms.tsx:188-292` posts to `/api/membership/submit`
- **Common fields** (all categories): fullName, email, mobile, state, city, document upload, terms checkbox at `MembershipForms.tsx:385-523`
- **Provisional ID**: auto-generated at `MembershipForms.tsx:26-31` (`AIC-{CAT}-{random}`)

### Login Form
- **File**: `pages/Login.tsx:55-121`
- **Handler**: `handleLogin()` at `Login.tsx:21-35` calls `useAuth().login()`
- **Fields**: email, password (toggle show/hide), remember me checkbox

### Shared email verification component
- **File**: `components/EmailVerification.tsx`
- **Logic**: `hooks/useFormVerification.ts`
- Used by: `App.tsx` (event reg), `Contact.tsx`, `MembershipPlans.tsx` (checkout), `MembershipForms.tsx`

---

## 5. Animations

### Where animation code lives
| Scope | File | Details |
|-------|------|---------|
| Page enter animations | `index.css:229-242` | `.animate-slideup` — keyframe `slideUp` (opacity + translateY) |
| Gradient text sweep | `index.css:193-226` | `.text-gradient-animate` (navy/dark → gold) and `.text-gradient-animate-light` (white → gold, for hero) |
| Reduced-motion support | `index.css:169-176`, `index.css:220-226` | `@media (prefers-reduced-motion: reduce)` disables all animations |
| Scroll behavior | `index.css:54-56` | `html { scroll-behavior: smooth }` |
| Page transitions | `App.tsx:226-233` | `<AnimatePresence>` + `<motion.div>` with opacity/y slide for route changes |
| Modal enter/exit | `components/ui/Dialog.tsx:60-86` | Framer Motion `initial/animate/exit` (scale + opacity) |
| Cookie banner | `components/CookieConsent.tsx:33-86` | Motion slide-up from bottom |
| Header mobile menu | `components/Header.tsx:152-217` | Motion slide-down for mobile drawer |
| Spinner | `components/ui/Button.tsx:65` | `<Loader2>` with `animate-spin` |
| Card hover | `components/ui/Card.tsx:24` (`interactive`) | `hover:-translate-y-1` with shadow |
| Hero video hover | `pages/Home.tsx:406` | `group-hover:scale-105` |

### How to change animations
- **Add/remove slide-up**: Apply or remove the `animate-slideup` class on any root container.
- **Gradient text**: Apply `.text-gradient-animate` (dark bg) or `.text-gradient-animate-light` (light/dark hero). Colors are controlled by the CSS variables in `index.css:211-217`.
- **Page transition timing**: `App.tsx:232` — `transition={{ duration: 0.35, ease: [...] }}`.
- **Reduced motion**: Already handled globally — no per-component work needed.

---

## 6. Navigation & Routing

### Routing mechanism
The app is a **single-page application** using a hash-based router inside `App.tsx`:
- **File**: `App.tsx:55-210`
- **State**: `currentPage` string (`'home'`, `'about'`, `'courses'`, `'course-detail'`, `'learners'`, `'events-projects'`, `'membership'`, `'benefits-view'`, `'login'`, `'verification'`, `'contact'`, `'privacy'`, `'terms'`, `'admin'`)
- **Hash listener**: `App.tsx:199-210` — reads `window.location.hash` and maps it to `currentPage`

### Header navigation
- **File**: `components/Header.tsx`
- **Nav items array**: `Header.tsx:47-58`
- **Mobile menu**: `Header.tsx:152-217` (AnimatedPresence + motion)
- **Logo click → home**: `Header.tsx:79-89`

### Footer navigation
- **File**: `components/Footer.tsx`
- **Links**: `Footer.tsx:49-157` (Quick Links, Membership Categories, Contact Details)
- **Copyright year**: auto via `new Date().getFullYear()` at `Footer.tsx:14`
- **Scroll-to-top button**: `Footer.tsx:175-181`

### How to add a new page
1. Create `src/pages/YourPage.tsx` (export default component).
2. Import it in `App.tsx` (add lazy import if heavy).
3. Add a `<case>` in the `AppShell` render block (`App.tsx:234-404`).
4. Add a nav item in `Header.tsx:47-58` and/or footer link in `Footer.tsx`.

---

## 7. Forms (Formik/state/hooks)

### Email verification hook
- **File**: `hooks/useFormVerification.ts`
- **API calls**: `/api/verification/request` and `/api/verification/confirm`
- **States**: `'idle'` → `'requesting'` → `'verifying'` → `'verified'` (or `'error'`)
- **Timeout**: 30s per request via `AbortController` (`useFormVerification.ts:30-31`)

### Form submission pattern
All forms follow this flow: honeypot → email verify → submit:
1. User fills form → clicks submit
2. If not verified → `requestCode()` sends OTP
3. User enters OTP → `confirmCode()` verifies
4. On verified → actual form POST handler fires

---

## 8. Styling & Theme

### Theme tokens / CSS variables
- **File**: `index.css:7-42`
- **Brand colors**: `--color-navy`, `--color-corp-blue`, `--color-accent-sky`, `--color-gold`, `--color-pale-blue`, `--color-gold-dark`
- **Neutrals**: `--color-slate-grey`, `--color-near-black`, `--color-gray-50` through `--color-gray-700`
- **Status colors**: `--color-success`, `--color-warning`, `--color-danger` (+ `-soft` variants)
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

### Tailwind utilities
- **Config**: Uses Tailwind v4 via `@tailwindcss/vite` (see `vite.config.ts:1`). No separate `tailwind.config.js` — the `@theme` block in `index.css:7-42` defines the design tokens.
- **Custom classes**: `.text-gradient-animate`, `.text-gradient-animate-light`, `.animate-slideup`, `.polished-card`, `.skip-link`

### Fonts
- **Body**: Inter (`--font-sans`)
- **Headings**: Lora (`--font-heading`)
- Loaded via `<link>` in `index.html` (not `@import` in CSS)

### Dark mode
Not implemented. The site uses light and dark-navy hero sections via Tailwind classes directly.

---

## 9. CMS Data (Editable Content)

All dynamic content lives in `src/cmsData.ts`:
- **`membershipPlans`** (`:78-143`) — pricing cards, features, recommended flag
- **`initialProjects`** (`:153-190`) — title, description, category, image, status, impact
- **`initialEvents`** (`:192-229`) — title, description, date, time, venue, category
- **`initialNews`** (`:231-256`) — title, summary, date, category, readTime
- **`initialCourses`** (`:258-408`) — title, description, category, level, duration, modules, access, topics, freeContent/premiumContent
- **`initialTestimonials`** (`:410-435`) — name, designation, organization, quote, avatarUrl
- **`initialPartners`** (`:437-444`) — name, type, logoPlaceholder
- **`leadershipMessages`** (`:454-469`) — name, designation, quote, photoUrl

### Data flow pattern
All pages fetch from `/api/*` endpoints on mount and **fall back to the bundled `initial*` arrays** if the API fails (e.g., `Home.tsx:35-78`, `Courses.tsx:24-33`, `EventsProjects.tsx:24-40`). This means you can edit `cmsData.ts` directly for local development and the site will use those values if the backend is unavailable.

---

## 10. Asset URL Helper

- **File**: `src/lib/assetPaths.ts`
- **Function**: `resolveAssetUrl(path)` — handles BASE_URL prefixing and passes through full external URLs
- **Usage**: `resolveAssetUrl('/images/hero-poster.jpg')`, `resolveAssetUrl('/videos/v11.mp4')`, `resolveAssetUrl('/resources/syllabus.txt')`
- **Imported in**: `cmsData.ts:1`, `pages/Home.tsx:14`

---

## 11. Modal & Overlay Components

| Modal | File | Trigger | Purpose |
|-------|------|---------|---------|
| Event Registration | `App.tsx:418-556` | Home/Events "Register Interest" button | Collects attendee details, verifies email, submits to `/api/events/register` |
| Donation | `App.tsx:561-736` | Header "Support" link (via `isDonationOpen` state) | Collects pledge amount, name, email, PAN; shows bank transfer details |
| Membership Checkout | `components/MembershipPlans.tsx:151-345` | Pricing card "Join Now" button | Collects payment info (card/UPI), verifies email, submits to `/api/membership/checkout` |
| Application Detail (Admin) | `pages/AdminDashboard.tsx:767-892` | Eye icon on application row | Shows full application data, approve/reject with reason |

### Modal component
- **File**: `components/ui/Dialog.tsx` — accessible modal shell with focus trap, Escape-to-close, and focus return
- **Header**: `DialogHeader` at `Dialog.tsx:100-115` (navy bar + close X)

---

## 12. Utility Components (UI Primitives)

All in `src/components/ui/`:

| Component | File | When to use |
|-----------|------|-------------|
| `Button` | `Button.tsx` | All CTAs — variants: `primary` (navy), `accent` (gold), `outline`, `ghost`, `danger`. Sizes: `sm`/`md`/`lg`. Props: `icon`, `iconPosition`, `loading` |
| `IconButton` | `IconButton.tsx` | Icon-only buttons — requires `label` (aria-label), `icon`, variant `ghost`/`solid` |
| `Badge` | `Badge.tsx` | Status pills — variants: `neutral`/`success`/`warning`/`danger`/`info`. Optional `icon` prop |
| `Card` | `Card.tsx` | Surface container — `interactive` (hover lift), `padding` (`md`/`none`) |
| `IconBadge` | `Card.tsx:40` | Small tinted icon box for feature cards |
| `StatCard` | `Card.tsx:55` | Navy stat tile for numbers (e.g., "500+ Clubs Launched") |
| `TextField` | `TextField.tsx` | Labelled input with hint/error support, `required` asterisk |
| `PageHero` | `PageHero.tsx` | Dark gradient hero with eyebrow + title + description |
| `TabList`/`TabPanel` | `Tabs.tsx` | ARIA-compliant tabs with keyboard navigation |
| `Dialog`/`DialogHeader` | `Dialog.tsx` | Accessible modal system |
| `cn` | `cn.ts` | Class merging utility (use instead of string concatenation) |

---

## 13. Auth & Access Control

- **File**: `context/AuthContext.tsx`
- **`hasPremiumAccess`**: `true` if `user.role === 'admin'` OR `user.membershipStatus === 'active'` (`AuthContext.tsx:85`)
- **Gating**: CourseDetail checks `canViewPremium` (`CourseDetail.tsx:111`) — free courses always visible, membership courses gated for non-members
- **Login**: `Login.tsx` posts to `/api/auth/login`, `logout` posts to `/api/auth/logout`
- **Session refresh**: On mount, `AuthProvider` calls `/api/auth/me` (`AuthContext.tsx:49`)

---

## 14. SEO & Meta

- **File**: `hooks/useDocumentMeta.ts`
- Called at the top of every page component (e.g., `Home.tsx:27`, `Courses.tsx:17`, `Contact.tsx:11`)
- Sets `document.title` and `<meta name="description">` content
- **Note**: This is a client-side SPA — for true crawler SEO, real URL paths + SSR/prerendering would be needed (tracked as a future task per the hook's own comment at `useDocumentMeta.ts:8-14`)

---

## Quick Edit Cheatsheet

| Want to change… | Edit this file (section) |
|-----------------|--------------------------|
| Hero headline text | `pages/Home.tsx:148` or `cmsData.ts` content |
| Hero background image | `pages/Home.tsx:83-86` (heroImages array) |
| Hero CTA buttons | `pages/Home.tsx:160-184` |
| Navigation menu items | `components/Header.tsx:47-58` |
| Footer links | `components/Footer.tsx:49-157` |
| Logo image | `src/images/logo-web.png` (imported in Header, Footer, Login) |
| Pricing plans & features | `cmsData.ts:78-143` |
| Course content (lessons, videos, quizzes) | `cmsData.ts:258-408` |
| Project cards | `cmsData.ts:153-190` |
| Events list | `cmsData.ts:192-229` |
| News cards | `cmsData.ts:231-256` |
| Testimonials | `cmsData.ts:410-435` |
| Partner logos/names | `cmsData.ts:437-444` |
| Leadership messages | `cmsData.ts:454-469` |
| About page text (vision, mission, etc.) | `pages/KnowAICAIML.tsx` |
| Privacy policy text | `pages/Legal.tsx:51-147` |
| Terms of use text | `pages/Legal.tsx:149-246` |
| Contact info (address, phone, email) | `pages/Contact.tsx:99-154` and `components/Footer.tsx:133-157` |
| Contact form fields | `pages/Contact.tsx:180-292` |
| Cookie banner text | `components/CookieConsent.tsx:58-65` |
| Theme colors (navy, gold, etc.) | `index.css:11-23` (CSS variables) |
| Animation speed/timing | `App.tsx:232` (page), `index.css` (keyframes) |
| All text on the site | `cmsData.ts` (dynamic content) + individual page files (static content) |