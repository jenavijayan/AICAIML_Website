import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import {
  insertEnquiry, insertApplication, insertEventRegistration, getNews, insertNewsArticle, insertMembershipPayment,
  verifyCredentials, createSession, getSessionUser, deleteSession, updateUserPassword, seedDevUser,
  getCourses, insertCourse, deleteCourse,
  getAllEnquiries, getAllApplications, getApplicationById, getAllEventRegistrations, getAllMemberships, getAllUsers, getUserByEmail,
  getMembershipByNo, insertCertificate, getCertificateByCode,
  getProjects, insertProject, deleteProject,
  getEvents, insertEvent, deleteEvent,
  getPartners, insertPartner, deletePartner,
  getTestimonials, insertTestimonial, deleteTestimonial,
  updateApplicationStatus, createUser, verifyApplicationEmail,
  PublicUser
} from './db';

const SESSION_COOKIE = 'aicaiml_session';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function setSessionCookie(res: express.Response, token: string, expiresAt: string) {
  const expires = new Date(expiresAt).toUTCString();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Expires=${expires}; SameSite=Lax${secure}`);
}

function clearSessionCookie(res: express.Response) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
}

// Real email delivery for the Contact page, via Gmail SMTP + an app password.
// Credentials live in .env (gitignored) — see that file for setup instructions.
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendEnquiryEmail(to: string, subject: string, text: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('Email not sent — EMAIL_USER/EMAIL_APP_PASSWORD in .env are still placeholders.');
    return { sent: false };
  }
  try {
    await mailTransporter.sendMail({
      from: `"AICAIML Council" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { sent: false };
  }
}

async function getSessionUserFromRequest(req: express.Request): Promise<PublicUser | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  return token ? await getSessionUser(token) : null;
}

// Middleware: only lets admin-role sessions through. Attaches the resolved
// user to req for handlers that need it.
async function requireAdmin(req: express.Request & { adminUser?: PublicUser }, res: express.Response, next: express.NextFunction) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  req.adminUser = user;
  next();
}

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve admin-uploaded images directly from disk (works in both dev and
  // production — unlike dist/, this reflects files uploaded after build).
  app.use('/uploads', express.static(uploadsDir));

  // API Route - Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // API Route - Login (email + password, session cookie)
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);
    res.json({ success: true, user });
  });

  // API Route - Logout
  app.post('/api/auth/logout', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) await deleteSession(token);
    clearSessionCookie(res);
    res.json({ success: true });
  });

  // API Route - Current session user
  app.get('/api/auth/me', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    const user = token ? await getSessionUser(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    res.json({ user });
  });

  // API Route - Change password (requires an active session)
  app.post('/api/auth/change-password', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    const user = token ? await getSessionUser(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Current password and a new password (min. 8 characters) are required.' });
    }

    const updated = await updateUserPassword(user.email, currentPassword, newPassword);
    if (!updated) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // --- Admin-only routes ---

  app.get('/api/admin/overview', requireAdmin, async (req, res) => {
    const enquiries = (await getAllEnquiries()).data?.length || 0;
    const applications = (await getAllApplications()).data?.length || 0;
    const eventRegistrations = (await getAllEventRegistrations()).data?.length || 0;
    const memberships = (await getAllMemberships()).data?.length || 0;
    const users = (await getAllUsers()).data?.length || 0;
    const courses = (await getCourses()).data?.length || 0;
    const projects = (await getProjects()).data?.length || 0;
    const partners = (await getPartners()).data?.length || 0;
    const testimonials = (await getTestimonials()).data?.length || 0;
    const news = (await getNews()).data?.length || 0;

    res.json({
      enquiries,
      applications,
      eventRegistrations,
      memberships,
      users,
      courses,
      projects,
      partners,
      testimonials,
      news
    });
  });

  app.get('/api/admin/enquiries', requireAdmin, async (req, res) => {
    const { data } = await getAllEnquiries();
    res.json(data || []);
  });

  app.get('/api/admin/applications', requireAdmin, async (req, res) => {
    const { data } = await getAllApplications();
    res.json(data || []);
  });

  app.post('/api/admin/applications/:id/approve', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { data: application, error: fetchError } = await getApplicationById(id);
      if (fetchError || !application) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      const approvalDate = new Date().toISOString();
      const updated = await updateApplicationStatus(application.id, 'Approved', approvalDate);

      const formData = application.form_data || {};
      const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
      const email = formData.emailId || formData.email || 'applicant@aic-aiml.org';

      const subject = `[AICAIML] Membership Application Approved - ${application.membership_no}`;
      const emailBody = `Dear ${name},

Congratulations! Your application for AICAIML ${application.category.toUpperCase()} membership has been reviewed and approved by the Membership Board.

APPROVAL DETAILS:
- Membership ID: ${application.membership_no}
- Application ID: ${application.id}
- Membership Type: ${application.category.toUpperCase()}
- Approval Date: ${new Date(approvalDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}

NEXT STEPS:
1. Your digital membership certificate and secure member portal login credentials will be issued shortly to this email address.
2. Please use your Membership ID for all future correspondence with the Council.
3. Access to member-only courses, events, and chapter activities will be enabled upon first login.

Welcome to India's premier AI/ML advancements ecosystem!

Sincerely,
Membership Board,
All India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

      await sendEnquiryEmail(email, subject, emailBody);

      res.json({ success: true, application: updated });
    } catch (err: any) {
      console.error('Approve application error:', err);
      res.status(500).json({ error: err.message || 'Failed to approve application.' });
    }
  });

  app.post('/api/admin/applications/:id/reject', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { data: application, error: fetchError } = await getApplicationById(id);
      if (fetchError || !application) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      const updated = await updateApplicationStatus(application.id, 'Rejected');
      res.json({ success: true, application: updated });
    } catch (err: any) {
      console.error('Reject application error:', err);
      res.status(500).json({ error: err.message || 'Failed to reject application.' });
    }
  });

  app.get('/api/admin/event-registrations', requireAdmin, async (req, res) => {
    const { data } = await getAllEventRegistrations();
    res.json(data || []);
  });

  app.get('/api/admin/memberships', requireAdmin, async (req, res) => {
    const { data } = await getAllMemberships();
    res.json(data || []);
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    const { data } = await getAllUsers();
    res.json(data || []);
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const existing = await getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const id = 'user-' + Date.now();
      const userRole = role === 'admin' ? 'admin' : 'member';
      const permissions =
        userRole === 'admin'
          ? [
              'access_premium_courses',
              'access_course_videos',
              'access_downloadable_resources',
              'access_quizzes',
              'access_certificates',
              'access_members_only_pages'
            ]
          : [];

      const user = await createUser({
        id,
        name,
        email: email.toLowerCase(),
        password,
        role: userRole,
        membershipPlan: null,
        membershipStatus: 'inactive',
        permissions
      });

      res.json({ success: true, user });
    } catch (err: any) {
      console.error('Create user error:', err);
      res.status(500).json({ error: err.message || 'Failed to create user.' });
    }
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload failed.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided.' });
      }
      res.json({ success: true, url: `/uploads/${req.file.filename}` });
    });
  });

  app.get('/api/courses', async (req, res) => {
    const { data } = await getCourses();
    res.json(data || []);
  });

  app.post('/api/admin/courses', requireAdmin, async (req, res) => {
    const { title, description, category, level, duration, modules, access, image, topics } = req.body;
    if (!title || !description || !category || !level || !duration || !access) {
      return res.status(400).json({ error: 'Title, description, category, level, duration and access are required.' });
    }
    const course = {
      id: 'course-' + Date.now(),
      title,
      description,
      category,
      level,
      duration,
      modules: Number(modules) || 0,
      access,
      image: image || undefined,
      topics: Array.isArray(topics) ? topics : String(topics || '').split(',').map((t: string) => t.trim()).filter(Boolean)
    };
    await insertCourse(course);
    res.json({ success: true, course });
  });

  app.delete('/api/admin/courses/:id', requireAdmin, async (req, res) => {
    await deleteCourse(req.params.id);
    res.json({ success: true });
  });

  // API Routes - Projects
  app.get('/api/projects', async (req, res) => {
    const { data } = await getProjects();
    res.json(data || []);
  });

  app.post('/api/admin/projects', requireAdmin, async (req, res) => {
    const { title, description, category, image, status, impact } = req.body;
    if (!title || !description || !category || !status || !impact) {
      return res.status(400).json({ error: 'Title, description, category, status and impact are required.' });
    }
    const project = {
      id: 'proj-' + Date.now(),
      title,
      description,
      category,
      image: image || undefined,
      status,
      impact
    };
    await insertProject(project);
    res.json({ success: true, project });
  });

  app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
    await deleteProject(req.params.id);
    res.json({ success: true });
  });

  // API Routes - Events
  app.get('/api/events', async (req, res) => {
    const { data } = await getEvents();
    res.json(data || []);
  });

  app.post('/api/admin/events', requireAdmin, async (req, res) => {
    const { title, description, date, time, venue, category } = req.body;
    if (!title || !description || !date || !time || !venue || !category) {
      return res.status(400).json({ error: 'All event fields are required.' });
    }
    const event = {
      id: 'evt-' + Date.now(),
      title,
      description,
      date,
      time,
      venue,
      category
    };
    await insertEvent(event);
    res.json({ success: true, event });
  });

  app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
    await deleteEvent(req.params.id);
    res.json({ success: true });
  });

  // API Routes - Partners
  app.get('/api/partners', async (req, res) => {
    const { data } = await getPartners();
    res.json(data || []);
  });

  app.post('/api/admin/partners', requireAdmin, async (req, res) => {
    const { name, type, logoPlaceholder } = req.body;
    if (!name || !type || !logoPlaceholder) {
      return res.status(400).json({ error: 'Name, type and logo placeholder are required.' });
    }
    const partner = {
      id: 'part-' + Date.now(),
      name,
      type,
      logoPlaceholder
    };
    await insertPartner(partner);
    res.json({ success: true, partner });
  });

  app.delete('/api/admin/partners/:id', requireAdmin, async (req, res) => {
    await deletePartner(req.params.id);
    res.json({ success: true });
  });

  // API Routes - Testimonials
  app.get('/api/testimonials', async (req, res) => {
    const { data } = await getTestimonials();
    res.json(data || []);
  });

  app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
    const { name, designation, organization, quote, avatarUrl } = req.body;
    if (!name || !designation || !organization || !quote || !avatarUrl) {
      return res.status(400).json({ error: 'All testimonial fields are required.' });
    }
    const testimonial = {
      id: 'test-' + Date.now(),
      name,
      designation,
      organization,
      quote,
      avatarUrl
    };
    await insertTestimonial(testimonial);
    res.json({ success: true, testimonial });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    await deleteTestimonial(req.params.id);
    res.json({ success: true });
  });

  // API Route - Record a certificate when a learner passes a course quiz
  // (requires an active session; idempotent per verification code)
  app.post('/api/certificates/issue', async (req, res) => {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    const { code, courseId, courseTitle } = req.body;
    if (!code || !courseId || !courseTitle) {
      return res.status(400).json({ error: 'Certificate code, course ID and title are required.' });
    }
    await insertCertificate({
      code,
      userId: user.id,
      userName: user.name,
      courseId,
      courseTitle,
      issuedAt: new Date().toISOString()
    });
    res.json({ success: true });
  });

  // API Route - Public certificate/membership verification lookup
  app.get('/api/verify', async (req, res) => {
    const code = String(req.query.code || '').trim();
    if (!code) {
      return res.status(400).json({ error: 'A certificate or membership number is required.' });
    }

    const { data: certificate } = await getCertificateByCode(code);
    if (certificate) {
      return res.json({
        found: true,
        type: 'certificate',
        holderName: certificate.user_name,
        courseTitle: certificate.course_title,
        issuedAt: certificate.issued_at,
        code: certificate.code
      });
    }

    const { data: membership } = await getMembershipByNo(code);
    if (membership) {
      return res.json({
        found: true,
        type: 'membership',
        holderName: membership.name,
        planName: membership.plan_name,
        issuedAt: membership.paid_at,
        code: membership.membership_no,
        status: membership.status
      });
    }

    res.json({ found: false });
  });

  // API Route - General Enquiry Form Submission with Honeypot Anti-Spam Check
  app.post('/api/enquiry/submit', async (req, res) => {
    const { name, email, phone, message, honeypot } = req.body;

    // Honeypot spam check - if filled, silently reject or fail with a validation message
    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected via honeypot field.');
      return res.status(400).json({ error: 'Validation failed. Spam activity detected.' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const enquiryId = 'enq-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const submittedAt = new Date().toISOString();

    await insertEnquiry({ id: enquiryId, name, email, phone, message, submittedAt });

    const emailBody = `Dear ${name},

Thank you for reaching out to the All India Council for Artificial Intelligence and Machine Learning (AICAIML). We have received your enquiry.

A representative from our executive team will review your message and get back to you within 2 business days.

Your Enquiry Details:
Reference ID: ${enquiryId}
Message: "${message}"

Sincerely,
Executive Secretariat,
AICAIML Council`;

    // Real send attempt — falls back gracefully (enquiry is already saved above)
    // if EMAIL_USER/EMAIL_APP_PASSWORD in .env are still the mock placeholders.
    const { sent } = await sendEnquiryEmail(email, `[AICAIML] Enquiry Received - Ref No: ${enquiryId}`, emailBody);

    // Notify the council secretariat at the address configured in .env, so a
    // real person actually sees new enquiries land (previously only the
    // enquirer's own acknowledgement email above was sent).
    if (process.env.EMAIL_USER) {
      await sendEnquiryEmail(
        process.env.EMAIL_USER,
        `[AICAIML Admin] New Enquiry — Ref No: ${enquiryId}`,
        `A new enquiry was submitted on the Contact page.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nReference ID: ${enquiryId}\n\nMessage:\n${message}`
      );
    }

    res.json({
      success: true,
      referenceId: enquiryId,
      message: 'Enquiry submitted successfully.',
      emailSent: sent,
      emailLog: `Subject: [AICAIML] Enquiry Received - Ref No: ${enquiryId}\nTo: ${email}\n\n${emailBody}`
    });
  });

  // API Route - Membership Form Submission with Honeypot Anti-Spam Check
  app.post('/api/membership/submit', async (req, res) => {
    const { category, formData, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected on membership form.');
      return res.status(400).json({ error: 'Spam validation failed.' });
    }

    if (!category || !formData) {
      return res.status(400).json({ error: 'Category and form data are required.' });
    }

    const membershipNo = 'AIC-' + category.substring(0, 3).toUpperCase() + '-' + Math.floor(100000 + Math.random() * 900000);
    const applicationId = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const submittedAt = new Date().toISOString();
    const name = (formData && (formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName)) || 'Applicant';
    const email = (formData && (formData.emailId || formData.email)) || 'applicant@aic-aiml.org';
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

    await insertApplication({ id: applicationId, membershipNo, category, name, email, formData: formData || {}, submittedAt, verificationCode });

    const subject = `[AICAIML] Membership Application Submitted - No: ${membershipNo}`;
    const emailBody = `Dear ${name},

Thank you for applying for AICAIML ${category.toUpperCase()} membership with the All India Council for Artificial Intelligence and Machine Learning.

Your application has been received and logged securely in our Council database.

APPLICATION SUMMARY:
- Application ID: ${applicationId}
- Allocated Membership No. (Pending Verification): ${membershipNo}
- Category: ${category.toUpperCase()}
- Submission Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}

EMAIL VERIFICATION:
Please verify your email address using this code: ${verificationCode}

Our Membership Review Committee will verify the submitted details against academic or organizational registries. This process typically takes 3 to 5 business days. Once verified, we will issue your digital membership certificate and secure member credentials.

Welcome to India's premier AI/ML advancements ecosystem!

Sincerely,
Membership Board,
All India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

    const { sent: emailSent } = await sendEnquiryEmail(email, subject, emailBody);

    if (process.env.EMAIL_USER) {
      await sendEnquiryEmail(
        process.env.EMAIL_USER,
        `[AICAIML Admin] New ${category.toUpperCase()} Membership Application — ${membershipNo}`,
        `A new ${category} membership application was submitted.\n\nApplicant: ${name}\nEmail: ${email}\nMembership No: ${membershipNo}\nApplication ID: ${applicationId}\nSubmitted: ${submittedAt}`
      );
    }

    res.json({
      success: true,
      applicationId,
      membershipNo,
      message: `Your ${category} application has been logged successfully.`,
      emailSent,
      emailLog: `Subject: ${subject}\nTo: ${email}\n\n${emailBody}`
    });
  });

  app.post('/api/membership/verify-email', async (req, res) => {
    const { applicationId, code } = req.body;
    if (!applicationId || !code) {
      return res.status(400).json({ error: 'Application ID and verification code are required.' });
    }
    const result = await verifyApplicationEmail(applicationId, code);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, message: 'Email verified successfully.' });
  });

  // API Route - Membership Plan Checkout (simulated payment gateway)
  app.post('/api/membership/checkout', async (req, res) => {
    const { planId, planName, price, name, email, phone, paymentMethod, cardNumber, upiId, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected on membership checkout.');
      return res.status(400).json({ error: 'Spam validation failed.' });
    }

    if (!planId || !planName || !price || !name || !email) {
      return res.status(400).json({ error: 'Plan, name and email are required.' });
    }

    if (!paymentMethod || (paymentMethod === 'card' && !cardNumber) || (paymentMethod === 'upi' && !upiId)) {
      return res.status(400).json({ error: 'Valid payment details are required.' });
    }

    const membershipNo = 'AIC-MEM-' + Math.floor(100000 + Math.random() * 900000);
    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 10).toUpperCase();
    const paymentRef = paymentMethod === 'card'
      ? `Card ending ${String(cardNumber).slice(-4)}`
      : `UPI: ${upiId}`;
    const paidAt = new Date().toISOString();

    await insertMembershipPayment({
      id: paymentId,
      membershipNo,
      planId,
      planName,
      price,
      name,
      email,
      phone,
      paymentMethod,
      paymentRef,
      status: 'paid',
      paidAt
    });

    const subject = `[AICAIML] Payment Confirmed - ${planName}`;
    const emailBody = `Dear ${name},

Your payment for the AICAIML ${planName} has been received and confirmed.

PAYMENT RECEIPT:
- Transaction ID: ${paymentId}
- Membership No: ${membershipNo}
- Plan: ${planName}
- Amount Paid: INR ${price} (Annual)
- Payment Method: ${paymentRef}
- Date: ${new Date(paidAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}

Your membership is now active. Login credentials for the member learning portal will be issued to this email shortly.

Welcome to the AICAIML national network!

Sincerely,
Membership & Treasury Desk, AICAIML Council`;

    // Real send attempt to the payer.
    const { sent: emailSent } = await sendEnquiryEmail(email, subject, emailBody);

    // Notify the council secretariat at the address configured in .env.
    if (process.env.EMAIL_USER) {
      await sendEnquiryEmail(
        process.env.EMAIL_USER,
        `[AICAIML Admin] New Membership Payment — ${membershipNo}`,
        `A new membership payment was received.\n\nName: ${name}\nEmail: ${email}\nPlan: ${planName}\nAmount: INR ${price}\nPayment Method: ${paymentRef}\nMembership No: ${membershipNo}\nTransaction ID: ${paymentId}`
      );
    }

    res.json({
      success: true,
      paymentId,
      membershipNo,
      planName,
      price,
      paymentRef,
      paidAt,
      message: `Payment successful. ${planName} is now active.`,
      emailSent,
      emailLog: `Subject: ${subject}\nTo: ${email}\n\n${emailBody}`
    });
  });

  // API Route - Event Interest Registration
  app.post('/api/events/register', async (req, res) => {
    const { eventId, eventTitle, name, email, phone, organization, designation, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Spam activity blocked.' });
    }

    if (!eventId || !name || !email) {
      return res.status(400).json({ error: 'Event details, Name and Email are required.' });
    }

    const registrationId = 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await insertEventRegistration({
      id: registrationId,
      eventId,
      eventTitle,
      name,
      email,
      phone,
      organization,
      designation,
      registeredAt: new Date().toISOString()
    });

    const emailBody = `
      Subject: [AICAIML] Registration Received - ${eventTitle}
      To: ${email}
      
      Dear ${name},
      
      We have registered your interest for "${eventTitle}" with AICAIML.
      
      REGISTRATION RECEIPT:
      - Ticket ID: ${registrationId}
      - Event: ${eventTitle}
      - Registrant: ${name} (${organization || 'Individual'})
      - Mode: Hybrid/Online Access link will be shared 24 hours prior to the event.
      
      We look forward to your active participation in advancing AI, Machine Learning, and Robotics in India.
      
      Best Regards,
      Events Secretariat, AICAIML
    `;

    res.json({
      success: true,
      registrationId,
      message: `Successfully registered interest for ${eventTitle}`,
      emailLog: emailBody
    });
  });

  // API Route - News, persisted in Supabase
  app.get('/api/news', async (req, res) => {
    const { data } = await getNews();
    res.json(data || []);
  });

  app.post('/api/news/add', requireAdmin, async (req, res) => {
    const { title, summary, category, readTime } = req.body;
    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }
    const newArticle = {
      id: 'news-' + Date.now(),
      title,
      summary,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: category || 'Announcement',
      readTime: readTime || '3 min read'
    };
    await insertNewsArticle(newArticle);
    res.json({ success: true, article: newArticle });
  });

  // Vite development integration or production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Seed the developer test account on every startup (idempotent). Only in
  // non-production so a known test password never ends up on a live deploy
  // unless explicitly opted into via SEED_DEV_USER=true.
  if (process.env.NODE_ENV !== 'production' || process.env.SEED_DEV_USER === 'true') {
    await seedDevUser();
    console.log('Dev account ready: developer@aicaiml.org (role: admin, plan: Premium)');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
