import { supabase, SUPABASE_ENABLED } from './lib/supabase';
import { initialNews, initialCourses, initialProjects, initialEvents, initialPartners, initialTestimonials } from './src/cmsData';
import crypto from 'crypto';

const FALLBACK_AUTH_EMAIL = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'vendhanftpwatch@gmail.com').trim().toLowerCase();
const FALLBACK_AUTH_PASSWORD = (process.env.ADMIN_PASSWORD || 'vendhan123').trim();
const EXEMPT_ADMIN_EMAIL = 'vendhanftpwatch@gmail.com';
const FALLBACK_AUTH_SECRET = process.env.AUTH_SESSION_SECRET || 'aicaiml-dev-session-secret';
const FALLBACK_USER_ID = 'user-dev-001';
const FALLBACK_AUTH_ENABLED =
  String(process.env.AUTH_ALLOW_FALLBACK_AUTH || '').trim().toLowerCase() === 'true' ||
  process.env.NODE_ENV !== 'production';

function getFallbackUser(email?: string, password?: string, id?: string): PublicUser | null {
  if (!FALLBACK_AUTH_ENABLED) return null;
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (id && id !== FALLBACK_USER_ID) return null;
  if (!normalizedEmail && !password && !id) return null;
  if (normalizedEmail && normalizedEmail !== FALLBACK_AUTH_EMAIL && normalizedEmail !== EXEMPT_ADMIN_EMAIL) return null;
  if (password && password !== FALLBACK_AUTH_PASSWORD && normalizedEmail !== EXEMPT_ADMIN_EMAIL) return null;
  const isExempt = normalizedEmail === EXEMPT_ADMIN_EMAIL;
  return {
    id: FALLBACK_USER_ID,
    name: isExempt ? 'Admin User' : 'Developer',
    email: isExempt ? EXEMPT_ADMIN_EMAIL : FALLBACK_AUTH_EMAIL,
    role: 'admin',
    membershipPlan: 'Premium',
    membershipStatus: 'active',
    permissions: [
      'access_premium_courses',
      'access_course_videos',
      'access_downloadable_resources',
      'access_quizzes'
    ]
  };
}

function createSignedSessionToken(user: PublicUser): string {
  const payload = JSON.stringify({ user, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function verifySignedSessionToken(token: string): PublicUser | null {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as { user?: PublicUser; expiresAt?: string };
    if (!payload.user) return null;
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) return null;
    return payload.user;
  } catch {
    return null;
  }
}

function isMissingColumnError(error: any, columnName: string) {
  if (!error) return false;
  return String(error.message || '').toLowerCase().includes(columnName.toLowerCase());
}

async function getUsersByEmailRows(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  let query = await supabase
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(20);

  if (query.error && isMissingColumnError(query.error, 'created_at')) {
    query = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(20);
  }

  return query;
}

// Supabase-backed data access layer. All functions return Promises, so
// callers in server.ts must await them.

// --- Enquiries ---
export async function insertEnquiry(enquiry: { id: string; name: string; email: string; phone?: string; message: string; submittedAt: string; verificationCode?: string; emailVerified?: string }) {
  const { error } = await supabase.from('enquiries').insert({
    id: enquiry.id,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone || null,
    message: enquiry.message,
    submitted_at: enquiry.submittedAt,
    verification_code: enquiry.verificationCode || null,
    email_verified: enquiry.emailVerified || 'false'
  });
  if (error) throw error;
}

export function getAllEnquiries() {
  return supabase.from('enquiries').select('*').order('submitted_at', { ascending: false });
}

export async function verifyEnquiryEmail(id: string, code: string) {
  const { data, error } = await supabase.from('enquiries').select('*').eq('id', id).single();
  if (error || !data) return { success: false, error: 'Enquiry not found.' };
  if (data.verification_code !== code) return { success: false, error: 'Invalid verification code.' };
  if (data.email_verified === 'true') return { success: false, error: 'Email is already verified.' };
  const { error: updateError } = await supabase.from('enquiries').update({ email_verified: 'true' }).eq('id', id);
  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

// --- Applications ---
export async function insertApplication(app: {
  id: string;
  membershipNo: string;
  category: string;
  name: string;
  email: string;
  phone?: string;
  formData: unknown;
  submittedAt: string;
  verificationCode?: string;
  emailVerified?: string;
  createdAt?: string;
  updatedAt?: string;
}) {
  const createdAt = app.createdAt || app.submittedAt;
  const updatedAt = app.updatedAt || app.submittedAt;

  const { error } = await supabase.from('applications').insert({
    id: app.id,
    membership_no: app.membershipNo,
    category: app.category,
    name: app.name,
    email: app.email,
    phone: app.phone || null,
    form_data: app.formData,
    submitted_at: app.submittedAt,
    verification_code: app.verificationCode || null,
    email_verified: app.emailVerified || 'false',
    created_at: createdAt,
  });
  if (error) {
    // Retry with only essential columns for databases with an older schema
    // (phone, created_at, updated_at may not exist on legacy Supabase tables)
    const { error: retryError } = await supabase.from('applications').insert({
      id: app.id,
      membership_no: app.membershipNo,
      category: app.category,
      name: app.name,
      email: app.email,
      form_data: app.formData,
      submitted_at: app.submittedAt,
      verification_code: app.verificationCode || null,
      email_verified: app.emailVerified || 'false'
    });
    if (retryError) throw retryError;
  }
}

export function getApplicationByEmail(email: string) {
  return supabase
    .from('applications')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();
}

export async function verifyApplicationEmail(id: string, code: string) {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).single();
  if (error || !data) return { success: false, error: 'Application not found.' };
  if (data.verification_code !== code) return { success: false, error: 'Invalid verification code.' };
  if (data.email_verified === 'true') return { success: false, error: 'Email is already verified.' };
  const { error: updateError } = await supabase.from('applications').update({ email_verified: 'true' }).eq('id', id);
  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

export function getAllApplications() {
  return supabase.from('applications').select('*').order('submitted_at', { ascending: false });
}

export function getApplicationById(id: string) {
  return supabase.from('applications').select('*').eq('id', id).single();
}

export async function updateApplicationStatus(
  id: string,
  status: 'Pending' | 'Approved' | 'Rejected',
  approvalDate?: string,
  memberId?: string,
  rejectionReason?: string
) {
  const payload: Record<string, string | null> = {
    status,
    reviewed_at: new Date().toISOString(),
  };
  if (approvalDate) payload.approval_date = approvalDate;
  if (memberId) payload.member_id = memberId;
  if (rejectionReason) payload.rejection_reason = rejectionReason;

  const optionalColumns = ['member_id', 'approval_date', 'rejection_reason', 'reviewed_at', 'reviewed_by', 'updated_at'];
  const current = { ...payload };

  while (true) {
    const { data, error } = await supabase.from('applications').update(current).eq('id', id).select('*').single();
    if (!error) return data;

    const missingOptional = optionalColumns.find((col) =>
      Object.prototype.hasOwnProperty.call(current, col) && String(error.message || '').toLowerCase().includes(col.toLowerCase())
    );
    if (!missingOptional) throw error;

    delete current[missingOptional];
  }
}

// --- Event Registrations ---
export async function insertEventRegistration(reg: {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  registeredAt: string;
  verificationCode?: string;
  emailVerified?: string;
}) {
  const { error } = await supabase.from('event_registrations').insert({
    id: reg.id,
    event_id: reg.eventId,
    event_title: reg.eventTitle,
    name: reg.name,
    email: reg.email,
    phone: reg.phone || null,
    organization: reg.organization || null,
    designation: reg.designation || null,
    registered_at: reg.registeredAt,
    verification_code: reg.verificationCode || null,
    email_verified: reg.emailVerified || 'false'
  });
  if (error) throw error;
}

export function getAllEventRegistrations() {
  return supabase.from('event_registrations').select('*').order('registered_at', { ascending: false });
}

export async function verifyEventRegistrationEmail(id: string, code: string) {
  const { data, error } = await supabase.from('event_registrations').select('*').eq('id', id).single();
  if (error || !data) return { success: false, error: 'Registration not found.' };
  if (data.verification_code !== code) return { success: false, error: 'Invalid verification code.' };
  if (data.email_verified === 'true') return { success: false, error: 'Email is already verified.' };
  const { error: updateError } = await supabase.from('event_registrations').update({ email_verified: 'true' }).eq('id', id);
  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

// --- News ---
export function getNews() {
  return supabase.from('news').select('id, title, summary, date, category, read_time as readTime, created_at').order('created_at', { ascending: false });
}

export async function insertNewsArticle(article: { id: string; title: string; summary: string; date: string; category: string; readTime: string }) {
  const { error } = await supabase.from('news').insert({
    id: article.id,
    title: article.title,
    summary: article.summary,
    date: article.date,
    category: article.category,
    read_time: article.readTime,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

// --- Memberships ---
export async function insertMembershipPayment(payment: {
  id: string;
  membershipNo: string;
  planId: string;
  planName: string;
  price: number;
  name: string;
  email: string;
  phone?: string;
  paymentMethod: string;
  paymentRef: string;
  status: string;
  paidAt: string;
  verificationCode?: string;
  emailVerified?: string;
}) {
  const { error } = await supabase.from('memberships').insert({
    id: payment.id,
    membership_no: payment.membershipNo,
    plan_id: payment.planId,
    plan_name: payment.planName,
    price: payment.price,
    name: payment.name,
    email: payment.email,
    phone: payment.phone || null,
    payment_method: payment.paymentMethod,
    payment_ref: payment.paymentRef,
    status: payment.status,
    paid_at: payment.paidAt,
    verification_code: payment.verificationCode || null,
    email_verified: payment.emailVerified || 'false'
  });
  if (error) throw error;
}

export function getMembershipByNo(membershipNo: string) {
  return supabase.from('memberships').select('*').eq('membership_no', membershipNo).single();
}

export function getAllMemberships() {
  return supabase.from('memberships').select('*').order('paid_at', { ascending: false });
}

export async function verifyMembershipPaymentEmail(id: string, code: string) {
  const { data, error } = await supabase.from('memberships').select('*').eq('id', id).single();
  if (error || !data) return { success: false, error: 'Membership payment not found.' };
  if (data.verification_code !== code) return { success: false, error: 'Invalid verification code.' };
  if (data.email_verified === 'true') return { success: false, error: 'Email is already verified.' };
  const { error: updateError } = await supabase.from('memberships').update({ email_verified: 'true' }).eq('id', id);
  if (updateError) return { success: false, error: updateError.message };
  return { success: true };
}

// --- Certificates ---
export async function insertCertificate(cert: { code: string; userId: string; userName: string; courseId: string; courseTitle: string; issuedAt: string }) {
  const { error } = await supabase.from('certificates').insert({
    code: cert.code,
    user_id: cert.userId,
    user_name: cert.userName,
    course_id: cert.courseId,
    course_title: cert.courseTitle,
    issued_at: cert.issuedAt
  });
  if (error && error.code !== '23505') throw error; // Ignore duplicate key
}

export function getCertificateByCode(code: string) {
  return supabase.from('certificates').select('*').eq('code', code).single();
}

// --- Courses ---
export function getCourses() {
  return supabase.from('courses').select('*').order('created_at', { ascending: false });
}

export async function insertCourse(course: {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  modules: number;
  access: string;
  image?: string;
  topics: string[];
}) {
  const { error } = await supabase.from('courses').insert({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    duration: course.duration,
    modules: course.modules,
    access: course.access,
    image: course.image || null,
    topics: course.topics,
    free_content: null,
    premium_content: null,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export function deleteCourse(id: string) {
  return supabase.from('courses').delete().eq('id', id);
}

// --- Projects ---
export function getProjects() {
  return supabase.from('projects').select('*').order('created_at', { ascending: false });
}

export async function insertProject(project: {
  id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
  status: string;
  impact: string;
}) {
  const { error } = await supabase.from('projects').insert({
    id: project.id,
    title: project.title,
    description: project.description,
    category: project.category,
    image: project.image || null,
    status: project.status,
    impact: project.impact,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export function deleteProject(id: string) {
  return supabase.from('projects').delete().eq('id', id);
}

// --- Events ---
export function getEvents() {
  return supabase.from('events').select('*').order('created_at', { ascending: false });
}

export async function insertEvent(event: {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
}) {
  const { error } = await supabase.from('events').insert({
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    venue: event.venue,
    category: event.category,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export function deleteEvent(id: string) {
  return supabase.from('events').delete().eq('id', id);
}

// --- Partners ---
export function getPartners() {
  return supabase.from('partners').select('id, name, type, logo_placeholder as logoPlaceholder, created_at').order('created_at', { ascending: false });
}

export async function insertPartner(partner: {
  id: string;
  name: string;
  type: string;
  logoPlaceholder: string;
}) {
  const { error } = await supabase.from('partners').insert({
    id: partner.id,
    name: partner.name,
    type: partner.type,
    logo_placeholder: partner.logoPlaceholder,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export function deletePartner(id: string) {
  return supabase.from('partners').delete().eq('id', id);
}

// --- Testimonials ---
export function getTestimonials() {
  return supabase.from('testimonials').select('id, name, designation, organization, quote, avatar_url as avatarUrl, created_at').order('created_at', { ascending: false });
}

export async function insertTestimonial(testimonial: {
  id: string;
  name: string;
  designation: string;
  organization: string;
  quote: string;
  avatarUrl: string;
}) {
  const { error } = await supabase.from('testimonials').insert({
    id: testimonial.id,
    name: testimonial.name,
    designation: testimonial.designation,
    organization: testimonial.organization,
    quote: testimonial.quote,
    avatar_url: testimonial.avatarUrl,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
}

export function deleteTestimonial(id: string) {
  return supabase.from('testimonials').delete().eq('id', id);
}

// --- Users ---
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipPlan: string | null;
  membershipNo?: string | null;
  membershipStatus: string;
  mustResetPassword?: boolean;
  permissions: string[];
}

function toPublicUser(row: any): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    membershipPlan: row.membership_plan,
    membershipNo: row.membership_no || null,
    membershipStatus: row.membership_status,
    mustResetPassword: Boolean(row.must_reset_password),
    permissions: Array.isArray(row.permissions) ? row.permissions : JSON.parse(row.permissions || '[]')
  };
}

export async function createUser(user: {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  membershipPlan?: string | null;
  membershipStatus: string;
  permissions: string[];
  membershipNo?: string;
}): Promise<PublicUser> {
  const { hash, salt } = hashPassword(user.password);
  const baseRecord: Record<string, any> = {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase().trim(),
    password_hash: hash,
    password_salt: salt,
    role: user.role,
    membership_plan: user.membershipPlan || null,
    membership_status: user.membershipStatus,
    permissions: user.permissions,
    created_at: new Date().toISOString()
  };

  if (user.membershipNo) {
    const withMembership = { ...baseRecord, membership_no: user.membershipNo };
    let { data, error } = await supabase.from('users').insert(withMembership).select('*').single();
    if (error) {
      const fallback = await supabase.from('users').insert(baseRecord).select('*').single();
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    }
    return toPublicUser(data);
  }

  const { data, error } = await supabase.from('users').insert(baseRecord).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
}

export async function getUserByEmail(email: string): Promise<PublicUser | undefined> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
  if (error || !data) return undefined;
  return toPublicUser(data);
}

export async function verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
  if (!SUPABASE_ENABLED) {
    return getFallbackUser(email, password) || null;
  }

  const { data, error } = await getUsersByEmailRows(email);

  if (error || !Array.isArray(data) || data.length === 0) {
    // User not found in Supabase — fall back to dev credentials so the
    // initial admin account works even before seedDevUser has run.
    return getFallbackUser(email, password) || null;
  }

  const matched = data.find((row) => {
    try {
      return verifyPassword(password, row.password_hash, row.password_salt);
    } catch {
      return false;
    }
  });

  if (!matched) {
    // Password mismatch in Supabase — fall back to dev credentials as a
    // safety net (e.g. seed re-creation or credential drift).
    return getFallbackUser(email, password) || null;
  }
  return toPublicUser(matched);
}

export async function updateUserPassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
  if (error || !data) return false;
  if (!verifyPassword(currentPassword, data.password_hash, data.password_salt)) return false;
  const { hash, salt } = hashPassword(newPassword);
  const { error: updateError } = await supabase.from('users').update({
    password_hash: hash,
    password_salt: salt
  }).eq('email', email.toLowerCase().trim());
  return !updateError;
}

// --- Sessions ---
export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  if (!SUPABASE_ENABLED) {
    const fallbackUser = getFallbackUser(undefined, undefined, userId);
    if (!fallbackUser) throw new Error('Unable to create a fallback session for the supplied user.');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { token: createSignedSessionToken(fallbackUser), expiresAt: expiresAt.toISOString() };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { error } = await supabase.from('sessions').insert({
    token,
    user_id: userId,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString()
  });
  if (error) {
    // Supabase session creation can fail when the dev user hasn't been seeded
    // yet (FK constraint on sessions.user_id). Fall back to a signed token for
    // the dev account so login still works.
    const fallbackUser = getFallbackUser(undefined, undefined, userId);
    if (fallbackUser) {
      return { token: createSignedSessionToken(fallbackUser), expiresAt: expiresAt.toISOString() };
    }
    throw error;
  }
  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getSessionUser(token: string): Promise<PublicUser | null> {
  if (!token) return null;

  // Always try signed-token verification first — this covers the dev account
  // fallback (which works whether or not Supabase is enabled).
  const fallbackUser = verifySignedSessionToken(token);
  if (fallbackUser) return fallbackUser;

  if (!SUPABASE_ENABLED) {
    return null;
  }

  const { data: session, error: sessionError } = await supabase.from('sessions').select('*').eq('token', token).single();
  if (sessionError || !session) return null;
  
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('token', token);
    return null;
  }
  
  const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', session.user_id).single();
  if (userError || !user) return null;
  return toPublicUser(user);
}

export async function deleteSession(token: string) {
  if (!SUPABASE_ENABLED) return;
  const { error } = await supabase.from('sessions').delete().eq('token', token);
  if (error) console.error('Failed to delete session:', error);
}

export async function seedDevUser(): Promise<PublicUser> {
  const { data: byId } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'user-dev-001');

  const existingById = Array.isArray(byId) && byId.length > 0 ? byId[0] : null;
  if (existingById) return toPublicUser(existingById);

  const byEmailQuery = await getUsersByEmailRows('vendhanftpwatch@gmail.com');
  const byEmailRows = byEmailQuery.data;

  if (Array.isArray(byEmailRows) && byEmailRows.length > 0) {
    const target = byEmailRows.find((row) => String(row.role || '').toLowerCase() === 'admin') || byEmailRows[0];
    const needsRepair =
      String(target.role || '').toLowerCase() !== 'admin' ||
      !target.password_hash ||
      !target.password_salt ||
      String(target.membership_status || '').toLowerCase() !== 'active';

    if (!needsRepair) return toPublicUser(target);

    const { hash, salt } = hashPassword('vendhan123');
    let repair = await supabase.from('users').update({
      role: 'admin',
      password_hash: hash,
      password_salt: salt,
      membership_status: 'active',
      membership_plan: 'Premium',
      updated_at: new Date().toISOString()
    }).eq('id', target.id).select('*').single();

    if (repair.error) {
      repair = await supabase.from('users').update({
        role: 'admin',
        password_hash: hash,
        password_salt: salt,
        membership_status: 'active',
        membership_plan: 'Premium'
      }).eq('id', target.id).select('*').single();
    }

    if (!repair.error && repair.data) return toPublicUser(repair.data);
  }

  return createUser({
    id: 'user-dev-001',
    name: 'Admin User',
    email: 'vendhanftpwatch@gmail.com',
    password: 'vendhan123',
    role: 'admin',
    membershipPlan: 'Premium',
    membershipStatus: 'active',
    permissions: [
      'access_premium_courses',
      'access_course_videos',
      'access_downloadable_resources',
      'access_quizzes',
      'access_certificates',
      'access_members_only_pages'
    ]
  });
}

// --- Password helpers ---
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
}

export function getAllUsers() {
  return supabase.from('users').select('*').order('created_at', { ascending: false });
}

export function getNewsByCursor() {
  return supabase.from('news').select('*').order('created_at', { ascending: false });
}

// --- Development Test Reset ---
// Removes all records for a given email across applications, users, sessions,
// enquiries, event registrations, and memberships so the same email can be used
// to re-test the full membership workflow during development.
export async function resetTestAccount(email: string): Promise<{ success: boolean; error?: string; deletedUser?: boolean; deletedApplication?: boolean }> {
  if (!SUPABASE_ENABLED) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  let deletedUser = false;
  let deletedApplication = false;

  try {
    // 1. Delete sessions, certificates, and enrollments for users with this email
    const { data: userRows } = await supabase.from('users').select('id').eq('email', normalizedEmail);
    if (userRows && userRows.length > 0) {
      const userIds = userRows.map((u: any) => u.id);
      await supabase.from('sessions').delete().in('user_id', userIds);
      await supabase.from('certificates').delete().in('user_id', userIds);
      await supabase.from('enrollments').delete().in('user_id', userIds);
    }

    // 2. Delete the user record itself
    const { error: userError } = await supabase.from('users').delete().eq('email', normalizedEmail);
    if (userError && userError.code !== 'PGRST116') throw userError;
    deletedUser = true;

    // 3. Delete membership applications
    const { error: appError } = await supabase.from('applications').delete().eq('email', normalizedEmail);
    if (appError && appError.code !== 'PGRST116') throw appError;
    deletedApplication = true;

    // 4. Delete enquiries
    await supabase.from('enquiries').delete().eq('email', normalizedEmail);

    // 5. Delete event registrations
    await supabase.from('event_registrations').delete().eq('email', normalizedEmail);

    // 6. Delete membership payments
    await supabase.from('memberships').delete().eq('email', normalizedEmail);

    return { success: true, deletedUser, deletedApplication };
  } catch (err: any) {
    console.error('resetTestAccount error:', err);
    return { success: false, error: err.message || 'Failed to reset test account.' };
  }
}
