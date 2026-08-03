import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getSupabaseSessionUser, verifySignedSessionToken, parseCookies, SESSION_COOKIE, SUPABASE_ENABLED, toPublicUser } from '../../server-lib/authFallback.js';
import { supabase } from '../../supabaseClient.js';

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch {
        try {
          const parsed = new URLSearchParams(data);
          const result = {};
          parsed.forEach((value, key) => { result[key] = value; });
          resolve(result);
        } catch { reject(new Error('Invalid JSON body')); }
      }
    });
    req.on('error', reject);
  });
}

async function getAdminUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  let user = await getSupabaseSessionUser(token);
  if (!user) user = verifySignedSessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function json(res, statusCode, obj) {
  res.status(statusCode).json(obj);
}

async function handleOverview(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const [
    enquiriesRes, applicationsRes, eventRegsRes, membershipsRes,
    usersRes, coursesRes, projectsRes, partnersRes, testimonialsRes, newsRes
  ] = await Promise.all([
    supabase.from('enquiries').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('event_registrations').select('*', { count: 'exact', head: true }),
    supabase.from('memberships').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('partners').select('*', { count: 'exact', head: true }),
    supabase.from('testimonials').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true })
  ]);

  json(res, 200, {
    enquiries: enquiriesRes.count || 0,
    applications: applicationsRes.count || 0,
    eventRegistrations: eventRegsRes.count || 0,
    memberships: membershipsRes.count || 0,
    users: usersRes.count || 0,
    courses: coursesRes.count || 0,
    projects: projectsRes.count || 0,
    partners: partnersRes.count || 0,
    testimonials: testimonialsRes.count || 0,
    news: newsRes.count || 0
  });
}

async function handleEnquiries(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data } = await supabase.from('enquiries').select('*').order('submitted_at', { ascending: false });
  json(res, 200, data || []);
}

async function handleApplications(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data } = await supabase.from('applications').select('*').order('submitted_at', { ascending: false });
  json(res, 200, data || []);
}

async function handleApproveApplication(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const { data: application, error: fetchError } = await supabase.from('applications').select('*').eq('id', id).single();
  if (fetchError || !application) return json(res, 404, { error: 'Application not found.' });

  const approvalDate = new Date().toISOString();
  const formData = application.form_data || {};
  const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
  const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

  let memberId = null;
  let generatedPassword = null;

  const { data: existingUser } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (!existingUser) {
    memberId = 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    generatedPassword = crypto.randomBytes(10).toString('base64url').substring(0, 16);
    const { hash, salt } = (() => {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(generatedPassword, salt, 64).toString('hex');
      return { hash, salt };
    })();
    const { error: createError } = await supabase.from('users').insert({
      id: memberId,
      name,
      email,
      password_hash: hash,
      password_salt: salt,
      role: 'member',
      membership_plan: null,
      membership_status: 'active',
      permissions: [],
      created_at: new Date().toISOString()
    });
    if (createError) {
      console.error('Failed to create member user:', createError);
    }
  }

  const { error: updateError } = await supabase.from('applications').update({
    status: 'Approved',
    reviewed_at: new Date().toISOString(),
    approval_date: approvalDate,
    member_id: memberId || existingUser?.id
  }).eq('id', id);

  if (updateError) {
    const { error: retryError } = await supabase.from('applications').update({
      status: 'Approved',
      reviewed_at: new Date().toISOString(),
      approval_date: approvalDate
    }).eq('id', id);
    if (retryError) return json(res, 500, { error: retryError.message });
  }

  const baseUrl = process.env.BASE_URL || 'https://www.aic-aiml.org';
  let emailBody = `Dear ${name},\n\nCongratulations! Your application for AICAIML ${application.category.toUpperCase()} membership has been reviewed and approved by the Membership Board.\n\nAPPROVAL DETAILS:\n - Membership ID: ${application.membership_no}\n - Application ID: ${application.id}\n - Membership Type: ${application.category.toUpperCase()}\n - Approval Date: ${new Date(approvalDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nNEXT STEPS:\n 1. Please use your Membership ID for all future correspondence with the Council.\n 2. Access to member-only courses, events, and chapter activities will be enabled upon first login.`;

  if (memberId && generatedPassword) {
    emailBody += `\n\nSECURE MEMBER PORTAL CREDENTIALS:\n - Member ID / Username: ${memberId}\n - Password: ${generatedPassword}\n\nYou can sign in at: ${baseUrl}/#login\n\nPlease keep these credentials secure and do not share them with anyone.\nYou may change your password after your first login.`;
  } else if (existingUser) {
    emailBody += `\n\n1. Your existing member portal account (linked to this email) is now active. You can sign in at: ${baseUrl}/#login`;
  } else {
    emailBody += `\n\n1. Your digital membership certificate and secure member portal login credentials will be issued shortly to this email address.`;
  }

  emailBody += `\n\nWelcome to India's premier AI/ML advancements ecosystem!\n\nSincerely,\nMembership Board,\nAll India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      await transporter.sendMail({ from: `"AICAIML Council" <${process.env.EMAIL_USER}>`, to: email, subject: `[AICAIML] Membership Application Approved - ${application.membership_no}`, text: emailBody });
    }
  } catch (err) {
    console.error('Failed to send approval email:', err);
  }

  json(res, 200, {
    success: true,
    application: { ...application, status: 'Approved', approval_date: approvalDate },
    credentials: memberId && generatedPassword ? { memberId, password: generatedPassword } : null
  });
}

async function handleRejectApplication(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const body = await parseJsonBody(req);
  const reason = body.reason || '';
  const { data: application, error: fetchError } = await supabase.from('applications').select('*').eq('id', id).single();
  if (fetchError || !application) return json(res, 404, { error: 'Application not found.' });

  const rejectionDate = new Date().toISOString();
  const { error: updateError } = await supabase.from('applications').update({
    status: 'Rejected',
    reviewed_at: rejectionDate,
    rejection_reason: reason || null
  }).eq('id', id);
  if (updateError) return json(res, 500, { error: updateError.message });

  const formData = application.form_data || {};
  const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
  const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

  const emailBody = `Dear ${name},\n\nThank you for your interest in AICAIML ${application.category.toUpperCase()} membership.\n\nAfter careful review by the Membership Board, we regret to inform you that your application (Ref: ${application.id}) has been marked as Rejected.\n\n${reason ? `REJECTION REASON:\n${reason}\n\n` : ''}If you believe this decision was made in error, or if you would like to address the concerns noted above, please contact our Membership Office at support@aic-aiml.org with your application reference number.\n\nYou may also choose to resubmit a new application after addressing the feedback provided.\n\nSincerely,\nMembership Board,\nAll India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      await transporter.sendMail({ from: `"AICAIML Council" <${process.env.EMAIL_USER}>`, to: email, subject: `[AICAIML] Membership Application Update - ${application.membership_no}`, text: emailBody });
    }
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  json(res, 200, { success: true, application: { ...application, status: 'Rejected' } });
}

async function handleEventRegistrations(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data } = await supabase.from('event_registrations').select('*').order('registered_at', { ascending: false });
  json(res, 200, data || []);
}

async function handleMemberships(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data } = await supabase.from('memberships').select('*').order('paid_at', { ascending: false });
  json(res, 200, data || []);
}

async function handleUsers(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  const safe = (data || []).map((u) => {
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
  json(res, 200, safe);
}

async function handleCreateUser(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const body = await parseJsonBody(req);
  const { name, email, password, role } = body;
  if (!name || !email || !password) return json(res, 400, { error: 'Name, email and password are required.' });
  const emailLower = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return json(res, 400, { error: 'Invalid email format.' });
  if (password.length < 8) return json(res, 400, { error: 'Password must be at least 8 characters.' });

  const { data: existing } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
  if (existing) return json(res, 409, { error: 'A user with this email already exists.' });

  const id = 'user-' + Date.now();
  const userRole = role === 'admin' ? 'admin' : 'member';
  const permissions = userRole === 'admin'
    ? ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes', 'access_certificates', 'access_members_only_pages']
    : [];
  const { hash, salt } = (() => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  })();

  const { data, error } = await supabase.from('users').insert({
    id,
    name,
    email: emailLower,
    password_hash: hash,
    password_salt: salt,
    role: userRole,
    membership_plan: null,
    membership_status: 'inactive',
    permissions,
    created_at: new Date().toISOString()
  }).select('*').single();

  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true, user: toPublicUser(data) });
}

async function handleCourses(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, category, level, duration, modules, access, image, topics } = body;
    if (!title || !description || !category || !level || !duration || !access) {
      return json(res, 400, { error: 'Title, description, category, level, duration and access are required.' });
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
      topics: Array.isArray(topics) ? topics : String(topics || '').split(',').map((t) => t.trim()).filter(Boolean),
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('courses').insert(course);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, course });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteCourse(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleProjects(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, category, image, status, impact } = body;
    if (!title || !description || !category || !status || !impact) {
      return json(res, 400, { error: 'Title, description, category, status and impact are required.' });
    }
    const project = {
      id: 'proj-' + Date.now(),
      title,
      description,
      category,
      image: image || undefined,
      status,
      impact,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('projects').insert(project);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, project });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteProject(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleEvents(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, date, time, venue, category } = body;
    if (!title || !description || !date || !time || !venue || !category) {
      return json(res, 400, { error: 'All event fields are required.' });
    }
    const event = {
      id: 'evt-' + Date.now(),
      title,
      description,
      date,
      time,
      venue,
      category,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('events').insert(event);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, event });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteEvent(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handlePartners(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('partners').select('id, name, type, logo_placeholder as logoPlaceholder, created_at').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { name, type, logoPlaceholder } = body;
    if (!name || !type || !logoPlaceholder) return json(res, 400, { error: 'Name, type and logo placeholder are required.' });
    const partner = {
      id: 'part-' + Date.now(),
      name,
      type,
      logo_placeholder: logoPlaceholder,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('partners').insert(partner);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, partner });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeletePartner(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleTestimonials(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('testimonials').select('id, name, designation, organization, quote, avatar_url as avatarUrl, created_at').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { name, designation, organization, quote, avatarUrl } = body;
    if (!name || !designation || !organization || !quote || !avatarUrl) {
      return json(res, 400, { error: 'All testimonial fields are required.' });
    }
    const testimonial = {
      id: 'test-' + Date.now(),
      name,
      designation,
      organization,
      quote,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('testimonials').insert(testimonial);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, testimonial });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteTestimonial(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleUpload(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  // Vercel serverless functions don't have easy multipart parsing.
  // Fallback: expect base64 data URL in a JSON body field 'fileData'
  const body = await parseJsonBody(req);
  const { fileData, filename } = body;
  if (!fileData) return json(res, 400, { error: 'No file provided. Send base64 data URL in fileData.' });
  
  const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return json(res, 400, { error: 'Invalid data URL format.' });
  
  const ext = matches[1].split('/')[1]?.split('+')[0] || 'bin';
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');
  const safeName = String(filename || 'upload-' + Date.now()).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const finalName = `${Date.now()}-${safeName}`;
  
  const { error } = await supabase.storage.from('uploads').upload(finalName, buffer, {
    contentType: matches[1],
    upsert: true
  });
  if (error) {
    return json(res, 500, { error: error.message });
  }
  
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(finalName);
  json(res, 200, { success: true, url: urlData.publicUrl });
}

export default async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return json(res, 500, { error: 'Supabase is not configured on this deployment. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const path = req.query && req.query.path;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);

  try {
    if (segments.length === 0 || segments[0] === 'overview') {
      if (req.method === 'GET') return handleOverview(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'enquiries') {
      if (req.method === 'GET') return handleEnquiries(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'applications') {
      if (req.method === 'GET') return handleApplications(req, res);
      if (req.method === 'POST') {
        if (segments[2] === 'approve' && segments[1]) return handleApproveApplication(req, res, segments[1]);
        if (segments[2] === 'reject' && segments[1]) return handleRejectApplication(req, res, segments[1]);
        return json(res, 400, { error: 'Expected /approve or /reject with an application ID.' });
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'event-registrations') {
      if (req.method === 'GET') return handleEventRegistrations(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'memberships') {
      if (req.method === 'GET') return handleMemberships(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'users') {
      if (req.method === 'GET') return handleUsers(req, res);
      if (req.method === 'POST') return handleCreateUser(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'courses') {
      if (segments.length === 1) return handleCourses(req, res);
      if (segments.length === 2) return handleDeleteCourse(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'projects') {
      if (segments.length === 1) return handleProjects(req, res);
      if (segments.length === 2) return handleDeleteProject(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'events') {
      if (segments.length === 1) return handleEvents(req, res);
      if (segments.length === 2) return handleDeleteEvent(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'partners') {
      if (segments.length === 1) return handlePartners(req, res);
      if (segments.length === 2) return handleDeletePartner(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'testimonials') {
      if (segments.length === 1) return handleTestimonials(req, res);
      if (segments.length === 2) return handleDeleteTestimonial(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'upload') {
      if (req.method === 'POST') return handleUpload(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    return json(res, 404, { error: 'Not found.' });
  } catch (err) {
    console.error('Admin API error:', err);
    return json(res, 500, { error: err.message || 'Internal server error.' });
  }
};
