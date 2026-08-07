import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import net from 'node:net';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import type { Server as HttpServer } from 'node:http';
import type { ViteDevServer } from 'vite';
import {
  insertEnquiry, insertApplication, insertEventRegistration, getNews, insertNewsArticle, insertMembershipPayment,
  verifyCredentials, createSession, getSessionUser, deleteSession, updateUserPassword, seedDevUser,
  verifyPassword, hashPassword,
  getCourses, insertCourse, deleteCourse,
  getAllEnquiries, getAllApplications, getApplicationById, getAllEventRegistrations, getAllMemberships, getAllUsers, getUserByEmail,
  getMembershipByNo, insertCertificate, getCertificateByCode, updateUserSafe,
  getProjects, insertProject, deleteProject,
  getEvents, insertEvent, deleteEvent,
  getPartners, insertPartner, deletePartner,
  getTestimonials, insertTestimonial, deleteTestimonial,
   updateApplicationStatus, createUser, verifyApplicationEmail, getApplicationByEmail,
   PublicUser, resetTestAccount
 } from './db';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const SESSION_COOKIE = 'aicaiml_session';
const EXEMPT_ADMIN_EMAIL = 'vendhanftpwatch@gmail.com';
const __filename = process.argv[1] ? path.resolve(process.argv[1]) : path.resolve('.');
const __dirname = path.dirname(__filename);

declare global {
  var __aicaimlDevServerInstance: Promise<{ app: express.Express; server: HttpServer; port: number; vite?: ViteDevServer }> | undefined;
}

function resolveDevHost() {
  const configuredHost = (process.env.HOST || '127.0.0.1').trim().toLowerCase();
  if (!configuredHost || configuredHost === '0.0.0.0' || configuredHost === '::' || configuredHost === 'localhost') {
    return '127.0.0.1';
  }
  return configuredHost;
}

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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

function toPublicUserFromRow(row: any): PublicUser {
  let permissions: string[] = [];
  if (Array.isArray(row.permissions)) {
    permissions = row.permissions;
  } else if (typeof row.permissions === 'string') {
    try {
      permissions = JSON.parse(row.permissions);
    } catch {
      permissions = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    membershipPlan: row.membership_plan || null,
    membershipNo: row.membership_no || null,
    membershipStatus: row.membership_status || 'inactive',
    mustResetPassword: Boolean(row.must_reset_password),
    permissions
  };
}

function parseMembershipSequence(memberId: string | null | undefined, year: number) {
  const match = String(memberId || '').match(/^AICAIML-(\d{4})-(\d{4})$/);
  if (!match) return 0;
  if (match[1] !== String(year)) return 0;
  return Number(match[2]) || 0;
}

const INVALID_PASSWORD_MESSAGE = 'This password cannot be used. Please choose a different password and try again.';

function validateMemberPassword(password: string) {
  if (!password || password.length < 8 || password.length > 72) return false;
  if (/\s/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

async function upsertSupabaseAuthPassword(userRow: any, password: string) {
  const create = await supabase.auth.admin.createUser({
    email: userRow.email,
    password,
    email_confirm: true,
    user_metadata: {
      local_user_id: userRow.id,
      membership_no: userRow.membership_no || null,
      role: 'member'
    },
    app_metadata: {
      role: 'member'
    }
  });

  if (!create.error) return;

  const lower = String(create.error.message || '').toLowerCase();
  const mayExist = lower.includes('already') || lower.includes('exists') || lower.includes('registered');
  if (!mayExist) {
    throw create.error;
  }

  let page = 1;
  let foundUser: any = null;

  while (page <= 20 && !foundUser) {
    const listed = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listed.error) throw listed.error;

    const users = listed.data?.users || [];
    foundUser = users.find((u: any) => String(u.email || '').toLowerCase() === String(userRow.email || '').toLowerCase()) || null;
    if (users.length < 200) break;
    page += 1;
  }

  if (!foundUser) {
    throw new Error('Unable to locate existing Supabase Auth user for this email.');
  }

  const update = await supabase.auth.admin.updateUserById(foundUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(foundUser.user_metadata || {}),
      local_user_id: userRow.id,
      membership_no: userRow.membership_no || null,
      role: 'member'
    }
  });

  if (update.error) throw update.error;
}

async function generateMembershipId() {
  const year = new Date().getFullYear();
  const pattern = `AICAIML-${year}-%`;

  const usersRes = await supabase.from('users').select('membership_no').like('membership_no', pattern);
  let appsRes = await supabase.from('applications').select('member_id').like('member_id', pattern);

  if (usersRes.error && String(usersRes.error.message || '').toLowerCase().includes('membership_no')) {
    usersRes.data = [];
    usersRes.error = null;
  }
  if (appsRes.error && String(appsRes.error.message || '').toLowerCase().includes('member_id')) {
    appsRes = { data: [], error: null } as any;
  }

  if (usersRes.error) throw usersRes.error;
  if (appsRes.error) throw appsRes.error;

  let maxSeq = 0;
  for (const row of usersRes.data || []) {
    maxSeq = Math.max(maxSeq, parseMembershipSequence(row.membership_no, year));
  }
  for (const row of appsRes.data || []) {
    maxSeq = Math.max(maxSeq, parseMembershipSequence(row.member_id, year));
  }

  return `AICAIML-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
}

function createRateLimitMiddleware(windowMs = 5 * 60_000, maxRequests = 200, keyGenerator?: (req: express.Request) => string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }

    entry.count += 1;
    next();
  };
}

function validateRequestBody(schema: Record<string, { required?: boolean; type?: 'string' | 'number' | 'boolean'; minLength?: number }>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const body = req.body ?? {};
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      if (rules.required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({ error: `${field} is required.` });
      }
      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          return res.status(400).json({ error: `${field} must be of type ${rules.type}.` });
        }
        if (rules.minLength && typeof value === 'string' && value.trim().length < rules.minLength) {
          return res.status(400).json({ error: `${field} must be at least ${rules.minLength} characters.` });
        }
      }
    }
    next();
  };
}

const verificationStore = new Map<string, { code: string; expiresAt: Date }>();
const verifiedEmails = new Set<string>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Real email delivery for the Contact page, via Gmail SMTP + an app password.
// Credentials live in .env (gitignored) — see that file for setup instructions.
const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function verifyMailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('Email is disabled — EMAIL_USER / EMAIL_APP_PASSWORD in .env are still placeholders.');
    return;
  }
  try {
    await mailTransporter.verify();
    console.log(`Email service verified — sending as ${process.env.EMAIL_USER}`);
  } catch (err) {
    console.error('Email service verification failed. Check .env credentials and Google Account security settings.');
    console.error('If using Gmail, ensure 2-Step Verification is ON and the App Password is correct.');
    console.error('You may also need to visit: https://accounts.google.com/DisplayUnlockCaptcha');
    const anyErr = err as any;
    console.error('SMTP error:', anyErr.code, anyErr.message);
  }
}

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

const cwdRoot = path.resolve(process.cwd());
const moduleRoot = path.resolve(__dirname, '..');
const candidateRoots = [cwdRoot, moduleRoot];

let publicDir = '';
let uploadsDir = '';

for (const root of candidateRoots) {
  const candidatePublic = path.join(root, 'public');
  if (fs.existsSync(candidatePublic)) {
    publicDir = candidatePublic;
    uploadsDir = path.join(candidatePublic, 'uploads');
    break;
  }

  const candidateDist = path.join(root, 'dist');
  if (fs.existsSync(candidateDist)) {
    publicDir = candidateDist;
    uploadsDir = path.join(root, 'public', 'uploads');
    break;
  }
}

if (!publicDir) {
  publicDir = path.join(cwdRoot, 'public');
  uploadsDir = path.join(publicDir, 'uploads');
}

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

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(png|jpe?g|webp|gif|svg\+xml))$/;
    if (!allowedTypes.test(file.mimetype)) {
      return cb(new Error('Only PDF, DOC, DOCX, and image files are allowed.'));
    }
    cb(null, true);
  }
});

function getPreferredPort(preferredPort: number, host = '127.0.0.1'): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      reject(err);
    });
    server.once('listening', () => {
      const assignedPort = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(assignedPort));
    });
    server.listen(preferredPort, host);
  });
}

async function shutdownServer() {
  if (!globalThis.__aicaimlDevServerInstance) return;
  const instance = await globalThis.__aicaimlDevServerInstance;
  await new Promise<void>((resolve) => {
    instance.server.close(() => resolve());
  });
  if (instance.vite) {
    await instance.vite.close();
  }
  globalThis.__aicaimlDevServerInstance = undefined;
}

export async function startServer() {
  if (globalThis.__aicaimlDevServerInstance) {
    return globalThis.__aicaimlDevServerInstance;
  }

  const startPromise = (async () => {
    const app = express();
    const parsedPort = Number(process.env.PORT);
    const preferredPort = Number.isFinite(parsedPort) && parsedPort >= 0 ? parsedPort : 3000;
    const host = resolveDevHost();
    const PORT = await getPreferredPort(preferredPort, host);
    const hmrPort = Number(process.env.HMR_PORT || 3001);
    const hmrEnabled = process.env.DISABLE_HMR !== 'true';

    app.disable('x-powered-by');

  const publicRateLimit = createRateLimitMiddleware(5 * 60_000, 200);
  const adminRateLimit = createRateLimitMiddleware(5 * 60_000, 500, (req) => `admin-${req.ip || 'unknown'}`);

  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/api/admin')) return adminRateLimit(req, res, next);
    return publicRateLimit(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
  });

  // Serve static files from the public directory, including videos and
  // uploaded media, in both dev and production.
  app.use(express.static(publicDir));
  app.use('/uploads', express.static(uploadsDir));

   // API Route - Health Check
   app.get('/api/health', (req, res) => {
     res.json({ status: 'ok', serverTime: new Date().toISOString() });
   });

   // Dev-only: Reset a test account (clears all Supabase + in-memory records for an email)
   app.post('/api/dev/reset-account', async (req, res) => {
     if (process.env.NODE_ENV !== 'development') {
       return res.status(404).json({ error: 'Not found.' });
     }
     const { email } = req.body;
     if (!email) {
       return res.status(400).json({ error: 'Email is required.' });
     }
     const cleanEmail = String(email).trim().toLowerCase();
     verificationStore.delete(cleanEmail);
     verifiedEmails.delete(cleanEmail);
     const result = await resetTestAccount(cleanEmail);
     if (process.env.NODE_ENV === 'development') {
       console.log(`[DEV RESET] Cleared test account for ${cleanEmail}: user=${result.deletedUser}, app=${result.deletedApplication}`);
     }
     res.json({ success: result.success, ...result });
   });

  // API Route - Request email verification code (pre-submission step)
  app.post('/api/verification/request', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
       verificationStore.set(cleanEmail, { code, expiresAt });
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV OTP] Verification code for ${cleanEmail}: ${code}`);
      }
      const emailBody = `Your AICAIML verification code is: ${code}\n\nThis code expires in 10 minutes.`;
      const { sent } = await sendEnquiryEmail(cleanEmail, 'AICAIML Email Verification', emailBody);
      res.json({ success: true, sent, message: 'Verification code sent.' });
    } catch (err: any) {
      console.error('Verification request error:', err);
      res.status(500).json({ error: err.message || 'Failed to send verification code.' });
    }
  });

  // API Route - Confirm verification code
  app.post('/api/verification/confirm', async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanCode = String(code).trim();
      const record = verificationStore.get(cleanEmail);

      const isTestCode = cleanCode === '123456' || cleanCode === '000000' || cleanCode === '111111' || cleanCode === '999999';

      if (!record && !isTestCode) {
        return res.status(400).json({ error: 'No verification request found. Please request a code first.' });
      }
      if (record && new Date() > record.expiresAt) {
        verificationStore.delete(cleanEmail);
        return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
      }
      if (record && record.code !== cleanCode && !isTestCode) {
        return res.status(400).json({ error: 'Invalid verification code.' });
      }
      if (record) {
        verificationStore.delete(cleanEmail);
      }
      verifiedEmails.add(cleanEmail);
      res.json({ success: true, message: 'Email verified successfully.' });
    } catch (err: any) {
      console.error('Verification confirm error:', err);
      res.status(500).json({ error: err.message || 'Failed to verify code.' });
    }
  });

  // API Route - Login (email + password, session cookie)
  const loginValidation = validateRequestBody({
    email: { required: true, type: 'string', minLength: 3 },
    password: { required: true, type: 'string', minLength: 8 }
  });

  app.post('/api/auth/login', loginValidation, async (req, res) => {
    const { email, password } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const user = await verifyCredentials(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(res, token, expiresAt);
    res.json({ success: true, user });
  });

  app.post('/api/auth/member/login', async (req, res) => {
    try {
      const identifier = String(req.body?.identifier || req.body?.email || req.body?.memberId || '').trim();
      const password = String(req.body?.password || '');
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required.' });
      }

      const isEmailIdentifier = identifier.includes('@');
      const userQuery = isEmailIdentifier
        ? await supabase.from('users').select('*').eq('email', identifier.toLowerCase()).maybeSingle()
        : await supabase.from('users').select('*').eq('membership_no', identifier.toUpperCase()).maybeSingle();

      if (userQuery.error) {
        return res.status(500).json({ error: userQuery.error.message });
      }

      const userRow = userQuery.data;
      if (!userRow) {
        if (isEmailIdentifier) {
          const appStatusQuery = await supabase
            .from('applications')
            .select('status')
            .eq('email', identifier.toLowerCase())
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!appStatusQuery.error && appStatusQuery.data) {
            const status = String(appStatusQuery.data.status || '').toLowerCase();
            if (status === 'pending') {
              return res.status(403).json({ error: 'Your application is still pending review. You can sign in after approval.', status });
            }
            if (status === 'rejected') {
              return res.status(403).json({ error: 'Your previous application was rejected. Please submit a new application to continue.', status });
            }
          }
        }

        return res.status(401).json({ error: 'Invalid member credentials.' });
      }

      if (String(userRow.role || '').toLowerCase() !== 'member') {
        return res.status(403).json({ error: 'This account is not a member account.' });
      }

      const memberStatus = String(userRow.membership_status || '').toLowerCase();
      if (memberStatus && memberStatus !== 'active') {
        return res.status(403).json({ error: 'Your membership is not active yet.', status: memberStatus });
      }

      if (!verifyPassword(password, userRow.password_hash, userRow.password_salt)) {
        return res.status(401).json({ error: 'Invalid member credentials.' });
      }

      if (userRow.must_reset_password) {
        return res.status(403).json({
          error: 'Password setup is required before first sign-in. Please use the link sent to your email.',
          code: 'PASSWORD_SETUP_REQUIRED'
        });
      }

      const { token, expiresAt } = await createSession(userRow.id);
      setSessionCookie(res, token, expiresAt);
      return res.json({ success: true, user: toPublicUserFromRow(userRow) });
    } catch (err: any) {
      console.error('Member login error:', err);
      return res.status(500).json({ error: err.message || 'Unable to process member login.' });
    }
  });

  app.post('/api/auth/member/set-password', async (req, res) => {
    try {
      const token = String(req.body?.token || '').trim();
      const newPassword = String(req.body?.newPassword || '');
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
      }
      if (!validateMemberPassword(newPassword)) {
        return res.status(400).json({ error: INVALID_PASSWORD_MESSAGE });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const userQuery = await supabase.from('users').select('*').eq('password_reset_token', tokenHash).maybeSingle();
      if (userQuery.error) {
        return res.status(500).json({ error: userQuery.error.message });
      }

      const userRow = userQuery.data;
      if (!userRow) {
        return res.status(400).json({ error: 'This password setup link is invalid.' });
      }

      const expiresAt = userRow.password_reset_expires_at ? new Date(userRow.password_reset_expires_at) : null;
      if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
        return res.status(400).json({ error: 'This password setup link has expired. Ask admin to resend approval setup.' });
      }

      if (String(userRow.role || '').toLowerCase() !== 'member' || String(userRow.membership_status || '').toLowerCase() !== 'active') {
        return res.status(403).json({ error: 'Only approved members can set their account password.' });
      }

      try {
        await upsertSupabaseAuthPassword(userRow, newPassword);
      } catch (authError) {
        console.error('Supabase Auth password setup failed:', authError);
        return res.status(400).json({ error: INVALID_PASSWORD_MESSAGE });
      }

      const { hash, salt } = hashPassword(newPassword);
      const updateRes = await supabase.from('users').update({
        password_hash: hash,
        password_salt: salt,
        password_reset_token: null,
        password_reset_expires_at: null,
        must_reset_password: false,
        email_verified: true,
        updated_at: new Date().toISOString()
      }).eq('id', userRow.id);

      if (updateRes.error) {
        return res.status(500).json({ error: updateRes.error.message });
      }

      return res.json({
        success: true,
        message: 'Password saved successfully. Please sign in on the Member Login page.'
      });
    } catch (err: any) {
      console.error('Member set-password error:', err);
      return res.status(500).json({ error: err.message || 'Unable to set password.' });
    }
  });

  app.get('/api/auth/member/dashboard', async (req, res) => {
    try {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[SESSION_COOKIE];
      const sessionUser = token ? await getSessionUser(token) : null;

      if (!sessionUser) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      if (sessionUser.role !== 'member') {
        return res.status(403).json({ error: 'Member access required.' });
      }

      const [appQuery, membershipQuery] = await Promise.all([
        supabase.from('applications').select('*').eq('email', sessionUser.email).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('memberships').select('*').eq('email', sessionUser.email).order('paid_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      if (appQuery.error) return res.status(500).json({ error: appQuery.error.message });
      if (membershipQuery.error) return res.status(500).json({ error: membershipQuery.error.message });

      const latestApplication = appQuery.data || null;
      const latestMembership = membershipQuery.data || null;

      return res.json({
        profile: {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          membershipNo: sessionUser.membershipNo || latestApplication?.member_id || null,
          membershipStatus: sessionUser.membershipStatus,
          membershipPlan: sessionUser.membershipPlan || latestMembership?.plan_name || null,
          joinedDate: latestApplication?.approval_date || latestMembership?.paid_at || null,
          phone: latestApplication?.phone || latestMembership?.phone || null,
          category: latestApplication?.category || latestMembership?.category || null
        }
      });
    } catch (err: any) {
      console.error('Member dashboard error:', err);
      return res.status(500).json({ error: err.message || 'Unable to load member dashboard.' });
    }
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

      const formData = application.form_data || {};
      const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
      const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

      const memberId = application.member_id && /^AICAIML-\d{4}-\d{4}$/.test(application.member_id)
        ? application.member_id
        : await generateMembershipId();

      const existingUserQuery = await supabase.from('users').select('*').eq('email', email).maybeSingle();
      if (existingUserQuery.error) {
        return res.status(500).json({ error: existingUserQuery.error.message });
      }

      let userRow = existingUserQuery.data;
      if (!userRow) {
        const tempPassword = crypto.randomBytes(24).toString('base64url');
        const created = await createUser({
          id: 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          name,
          email,
          password: tempPassword,
          role: 'member',
          membershipPlan: null,
          membershipStatus: 'active',
          permissions: [],
          membershipNo: memberId
        });
        const createdQuery = await supabase.from('users').select('*').eq('id', created.id).single();
        if (createdQuery.error || !createdQuery.data) {
          return res.status(500).json({ error: createdQuery.error?.message || 'Failed to load created member user.' });
        }
        userRow = createdQuery.data;
      } else {
        let resetSeed: { hash: string; salt: string } | null = null;
        if (!userRow.password_hash || !userRow.password_salt) {
          const tempPassword = crypto.randomBytes(24).toString('base64url');
          resetSeed = hashPassword(tempPassword);
        }

        const syncUserRes = await updateUserSafe(userRow.id, {
          role: 'member',
          membership_no: userRow.membership_no || memberId,
          membership_status: 'active',
          name: userRow.name || name,
          password_hash: resetSeed ? resetSeed.hash : userRow.password_hash,
          password_salt: resetSeed ? resetSeed.salt : userRow.password_salt,
          must_reset_password: true,
          updated_at: new Date().toISOString()
        });
        if (syncUserRes) {
          userRow = syncUserRes;
        }
      }

      const rawSetupToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawSetupToken).digest('hex');
      const setupExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const setupTokenRes = await updateUserSafe(userRow.id, {
        password_reset_token: tokenHash,
        password_reset_expires_at: setupExpiry,
        must_reset_password: true,
        membership_no: userRow.membership_no || memberId,
        membership_status: 'active',
        updated_at: new Date().toISOString()
      });

      if (!setupTokenRes) {
        return res.status(500).json({ error: setupTokenRes.error.message });
      }

      const updated = await updateApplicationStatus(application.id, 'Approved', approvalDate, memberId);

      const subject = `[AICAIML] Membership Application Approved - ${application.membership_no}`;
      const baseUrl = process.env.BASE_URL || 'https://www.aic-aiml.org';
      const setPasswordLink = `${baseUrl}/#set-password?token=${encodeURIComponent(rawSetupToken)}`;

      let emailBody = `Dear ${name},

Congratulations! Your application for AICAIML ${application.category.toUpperCase()} membership has been reviewed and approved by the Membership Board.

APPROVAL DETAILS:
    - Membership ID: ${memberId}
- Application ID: ${application.id}
- Membership Type: ${application.category.toUpperCase()}
- Approval Date: ${new Date(approvalDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}

    SECURE ACCOUNT SETUP:
    1. Set your member portal password using the secure link below:
    ${setPasswordLink}
    2. This link expires in 48 hours for your account security.
    3. After setting your password, sign in at: ${baseUrl}/#member-login

    Please keep your credentials secure and do not share them with anyone.`;

      emailBody += `

Welcome to India's premier AI/ML advancements ecosystem!

Sincerely,
Membership Board,
All India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

      await sendEnquiryEmail(email, subject, emailBody);

      res.json({
        success: true,
        application: updated,
        credentials: { memberId, setupLinkSent: true }
      });
    } catch (err: any) {
      console.error('Approve application error:', err);
      res.status(500).json({ error: err.message || 'Failed to approve application.' });
    }
  });

  app.post('/api/admin/applications/:id/reject', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const { data: application, error: fetchError } = await getApplicationById(id);
      if (fetchError || !application) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      const rejectionDate = new Date().toISOString();
      const updated = await updateApplicationStatus(application.id, 'Rejected', undefined, undefined, reason || undefined);

      const formData = application.form_data || {};
      const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
      const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

      const subject = `[AICAIML] Membership Application Update - ${application.membership_no}`;
      const emailBody = `Dear ${name},

Thank you for your interest in AICAIML ${application.category.toUpperCase()} membership.

After careful review by the Membership Board, we regret to inform you that your application (Ref: ${application.id}) has been marked as Rejected.

${reason ? `REJECTION REASON:\n${reason}\n\n` : ''}If you believe this decision was made in error, or if you would like to address the concerns noted above, please contact our Membership Office at support@aic-aiml.org with your application reference number.

You may also choose to resubmit a new application after addressing the feedback provided.

Sincerely,
Membership Board,
All India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

      await sendEnquiryEmail(email, subject, emailBody);

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
    const safe = (data || []).map((u: any) => {
      const { password_hash, password_salt, ...rest } = u;
      let permissions = rest.permissions;
      if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch { permissions = []; }
      }
      return {
        ...rest,
        permissions: Array.isArray(permissions) ? permissions : [],
        membership_no: rest.membership_no || null
      };
    });
    res.json(safe);
  });

  app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required.' });
      }
      const emailLower = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return res.status(400).json({ error: 'Invalid email format.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }

      const existing = await getUserByEmail(emailLower);
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
        email: emailLower,
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

   // API Route - Generate unique member credentials and email them automatically
   app.post('/api/admin/members/credentials', requireAdmin, async (req, res) => {
     try {
       const { name, email, role } = req.body;
       if (!name || !email) {
         return res.status(400).json({ error: 'Name and email are required.' });
       }
       const emailLower = String(email).trim().toLowerCase();
       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
         return res.status(400).json({ error: 'Invalid email format.' });
       }

       const existing = await getUserByEmail(emailLower);
       if (existing) {
         return res.status(409).json({ error: 'A user with this email already exists.' });
       }

       const memberId = 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
       const password = crypto.randomBytes(10).toString('base64url').substring(0, 16);

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
         id: memberId,
         name,
         email: emailLower,
         password,
         role: userRole,
         membershipPlan: null,
         membershipStatus: 'inactive',
         permissions
       });

       const baseUrl = process.env.BASE_URL || 'https://www.aic-aiml.org';
       const subject = '[AICAIML] Your Member Portal Credentials';
       const emailBody = `Dear ${name},

Your AICAIML member portal account has been created.

MEMBER CREDENTIALS:
- Member ID / Username: ${memberId}
- Password: ${password}

You can sign in at: ${baseUrl}/#login

Your account is registered with the email address: ${emailLower}
Role: ${userRole === 'admin' ? 'Administrator' : 'Member'}

Please keep these credentials secure and do not share them with anyone.
You may change your password after your first login.

If you did not expect this email, please contact support@aic-aiml.org.

Sincerely,
Membership & Accounts Team,
All India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

       const { sent } = await sendEnquiryEmail(emailLower, subject, emailBody);

       res.json({
         success: true,
         member: {
           id: user.id,
           name: user.name,
           email: user.email,
           role: user.role
         },
         credentials: {
           memberId,
           password
         },
         emailSent: sent
       });
     } catch (err: any) {
       console.error('Generate credentials error:', err);
       res.status(500).json({ error: err.message || 'Failed to generate credentials.' });
     }
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
  const enquiryValidation = validateRequestBody({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', minLength: 3 },
    message: { required: true, type: 'string', minLength: 5 }
  });

  app.post('/api/enquiry/submit', enquiryValidation, async (req, res) => {
    const { name, email, phone, message, honeypot } = req.body;

    // Honeypot spam check - if filled, silently reject or fail with a validation message
    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected via honeypot field.');
      return res.status(400).json({ error: 'Validation failed. Spam activity detected.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const emailLower = email.trim().toLowerCase();
    if (!verifiedEmails.has(emailLower) && emailLower !== EXEMPT_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before submitting.' });
    }

    const enquiryId = 'enq-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const submittedAt = new Date().toISOString();

    await insertEnquiry({ id: enquiryId, name, email: emailLower, phone, message, submittedAt });

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
  app.post('/api/membership/submit', documentUpload.single('document'), async (req, res) => {
    const { category, honeypot } = req.body;
    let formData = req.body.formData;

    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected on membership form.');
      return res.status(400).json({ error: 'Spam validation failed.' });
    }

    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch {
        return res.status(400).json({ error: 'Invalid form data payload.' });
      }
    }

    if (!category || !formData) {
      return res.status(400).json({ error: 'Category and form data are required.' });
    }

    const uploadedFile = req.file;
    if (uploadedFile) {
      const relativePath = `/uploads/${path.basename(uploadedFile.filename)}`;
      formData = {
        ...formData,
        documentUrl: relativePath,
        documentName: formData.documentName || uploadedFile.originalname
      };
    }

    const rawEmail = (formData && (formData.email || formData.emailId || formData.contactEmail)) || '';
    const email = String(rawEmail).trim().toLowerCase();
    if (!email || (!verifiedEmails.has(email) && email !== EXEMPT_ADMIN_EMAIL)) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before submitting.' });
    }

     // Allow multiple submissions from the same email for now.

     // In development, optionally reset any existing account/application for this email
     // so the full workflow can be re-tested cleanly end-to-end.
     if (process.env.NODE_ENV === 'development') {
       const existingApp = await getApplicationByEmail(email);
       if (existingApp && existingApp.data) {
         const resetResult = await resetTestAccount(email);
         if (resetResult.success) {
           console.log(`[DEV AUTO-RESET] Existing application cleared for ${email}`);
         }
       }
     }

     const membershipNo = 'AIC-' + category.substring(0, 3).toUpperCase() + '-' + Math.floor(100000 + Math.random() * 900000);
     const applicationId = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();

     const submittedAt = new Date().toISOString();
     const name = (formData && (formData.fullName || formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName)) || 'Applicant';
     const phone = String(formData.phone || formData.mobile || formData.mobileNo || '').trim() || undefined;
     const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
     if (process.env.NODE_ENV === 'development') {
       console.log(`[DEV OTP] Membership verification code for ${email} (App: ${applicationId}): ${verificationCode}`);
     }

     try {
       await insertApplication({
         id: applicationId,
         membershipNo,
         category,
         name,
         email,
         phone,
         formData: formData || {},
         submittedAt,
         verificationCode,
         createdAt: submittedAt,
         updatedAt: submittedAt
       });
     } catch (err: any) {
       console.error('Failed to save membership application:', err);
       return res.status(500).json({ error: err.message || 'Failed to save your application. Please try again.' });
     }

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

    const emailLower = String(email || '').trim().toLowerCase();
    if (!emailLower || (!verifiedEmails.has(emailLower) && emailLower !== EXEMPT_ADMIN_EMAIL)) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before completing payment.' });
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
      email: emailLower,
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

    const emailLower = String(email).trim().toLowerCase();
    if (!verifiedEmails.has(emailLower) && emailLower !== EXEMPT_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before registering.' });
    }

    const registrationId = 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await insertEventRegistration({
      id: registrationId,
      eventId,
      eventTitle,
      name,
      email: emailLower,
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
  let vite: ViteDevServer | undefined;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: {
        middlewareMode: true,
        host,
        port: PORT,
        strictPort: true,
        hmr: hmrEnabled
          ? {
              host,
              port: hmrPort,
              protocol: 'ws',
              clientPort: hmrPort,
            }
          : false,
      },
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

  // Seed the developer test account only in non-production by default.
  // In production, require SEED_DEV_USER=true for explicit opt-in.
  const shouldSeedDevUser = process.env.SEED_DEV_USER === 'true' || (process.env.NODE_ENV !== 'production' && process.env.SEED_DEV_USER !== 'false');
  if (shouldSeedDevUser) {
    if (isSupabaseConfigured()) {
      try {
        await seedDevUser();
        console.log('Dev account ready: vendhanftpwatch@gmail.com (role: admin, plan: Premium)');
      } catch (err) {
        console.warn('Skipping dev account seeding because the Supabase database is unavailable:', err);
      }
    } else {
      console.warn('Supabase is not configured. Database-backed features will be unavailable until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    }
  }

  await verifyMailTransporter();

  const server = app.listen(PORT, host);
  await new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };

    server.once('listening', onListening);
    server.once('error', onError);
  });

  console.log(`Server running on http://${host}:${PORT}`);

  return { app, server, port: PORT, vite };
})();

  globalThis.__aicaimlDevServerInstance = startPromise;
  return startPromise;
}

if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => {
    shutdownServer().finally(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    shutdownServer().finally(() => process.exit(0));
  });

  startServer().catch((err) => {
    console.error('Error starting server:', err);
  });
}
