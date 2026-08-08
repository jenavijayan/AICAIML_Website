import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import { resetTestAccount } from '../../authFallback.js';
import { isEmailVerified } from '../../verificationStore.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { applicationReceived } from '../../email-templates/index.js';

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

async function sendHtmlEmail(to, subject, html, text) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    return { sent: false };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });
    await transporter.sendMail({
      from: `"AICAIML Council" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim(),
      html
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { sent: false };
  }
}

async function insertApplicationCompat(payload) {
  const optionalColumns = ['phone', 'created_at', 'updated_at'];
  const current = { ...payload };

  while (true) {
    const result = await supabase.from('applications').insert(current);
    if (!result.error) return result;

    const missingOptional = optionalColumns.find((column) =>
      Object.prototype.hasOwnProperty.call(current, column) && String(result.error.message || '').toLowerCase().includes(column.toLowerCase())
    );

    if (!missingOptional) return result;
    delete current[missingOptional];
  }
}

export default async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { category, honeypot, formData } = body;
    let parsedFormData = formData;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Spam validation failed.' });
    }

    if (typeof parsedFormData === 'string') {
      try { parsedFormData = JSON.parse(parsedFormData); }
      catch { return res.status(400).json({ error: 'Invalid form data payload.' }); }
    }

    if (!category || !parsedFormData) {
      return res.status(400).json({ error: 'Category and form data are required.' });
    }

    const rawEmail = (parsedFormData && (parsedFormData.email || parsedFormData.emailId || parsedFormData.contactEmail)) || '';
    const email = String(rawEmail).trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!isEmailVerified(email)) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before submitting.' });
    }

    // Allow multiple submissions from the same email for now.

    // In development, auto-reset any existing account/application for this email
    // so the full workflow can be re-tested cleanly end-to-end.
    if (process.env.NODE_ENV === 'development') {
      const { data: existingApp } = await supabase.from('applications').select('id').eq('email', email).limit(1).maybeSingle();
      if (existingApp) {
        const resetResult = await resetTestAccount(email);
        if (resetResult.success) {
          console.log(`[DEV AUTO-RESET] Existing application cleared for ${email}`);
        }
      }
    }

    const membershipNo = 'AIC-' + category.substring(0, 3).toUpperCase() + '-' + Math.floor(100000 + Math.random() * 900000);
    const applicationId = 'APP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const submittedAt = new Date().toISOString();
    const name = (parsedFormData && (parsedFormData.fullName || parsedFormData.studentName || parsedFormData.applicantName || parsedFormData.authorizedRepresentativeName || parsedFormData.institutionName || parsedFormData.universityName)) || 'Applicant';
    const phone = String(parsedFormData.phone || parsedFormData.mobile || parsedFormData.mobileNo || '').trim() || undefined;
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV OTP] Membership verification code for ${email} (App: ${applicationId}): ${verificationCode}`);
    }

    const { error } = await insertApplicationCompat({
      id: applicationId,
      membership_no: membershipNo,
      category,
      name,
      email,
      phone: phone || null,
      form_data: parsedFormData || {},
      submitted_at: submittedAt,
      verification_code: verificationCode,
      email_verified: 'false',
      created_at: submittedAt,
      updated_at: submittedAt
    });
    if (error) throw error;

    const subject = `[AICAIML] Membership Application Submitted - No: ${membershipNo}`;
    const emailBody = `Dear ${name},\n\nThank you for applying for AICAIML ${category.toUpperCase()} membership with the All India Council for Artificial Intelligence and Machine Learning.\n\nYour application has been received and logged securely in our Council database.\n\nAPPLICATION SUMMARY:\n - Application ID: ${applicationId}\n - Allocated Membership No. (Pending Verification): ${membershipNo}\n - Category: ${category.toUpperCase()}\n - Submission Date: ${new Date(submittedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nEMAIL VERIFICATION:\nPlease verify your email address using this code: ${verificationCode}\n\nOur Membership Review Committee will verify the submitted details against academic or organizational registries. This process typically takes 3 to 5 business days. Once verified, we will issue your digital membership certificate and secure member credentials.\n\nWelcome to India's premier AI/ML advancements ecosystem!\n\nSincerely,\nMembership Board,\nAll India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

    const htmlBody = applicationReceived({
      name,
      applicationId,
      membershipNo,
      category,
      submissionDate: submittedAt,
      verificationCode
    });

    const { sent: emailSent } = await sendHtmlEmail(email, subject, htmlBody, emailBody);
    if (process.env.EMAIL_USER) {
      await sendHtmlEmail(process.env.EMAIL_USER, `[AICAIML Admin] New ${category.toUpperCase()} Membership Application — ${membershipNo}`, `A new ${category} membership application was submitted.\n\nApplicant: ${name}\nEmail: ${email}\nMembership No: ${membershipNo}\nApplication ID: ${applicationId}\nSubmitted: ${submittedAt}`);
    }

    res.json({
      success: true,
      applicationId,
      membershipNo,
      message: `Your ${category} application has been logged successfully.`,
      emailSent
    });
  } catch (err) {
    console.error('Membership submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit membership application.' });
  }
};
