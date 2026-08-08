import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import { isEmailVerified } from '../../verificationStore.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { enquiryReceived } from '../../email-templates/index.js';

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
    const { name, email, phone, message, honeypot } = body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Validation failed. Spam activity detected.' });
    }
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const emailLower = email.trim().toLowerCase();
    if (!isEmailVerified(emailLower)) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before submitting.' });
    }
    const enquiryId = 'enq-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const submittedAt = new Date().toISOString();

    const { error } = await supabase.from('enquiries').insert({
      id: enquiryId,
      name,
      email: emailLower,
      phone: phone || null,
      message,
      submitted_at: submittedAt
    });
    if (error) throw error;

    const htmlBody = enquiryReceived({ name, enquiryId, message });
    const emailBody = `Dear ${name},\n\nThank you for reaching out to the All India Council for Artificial Intelligence and Machine Learning (AICAIML). We have received your enquiry.\n\nA representative from our executive team will review your message and get back to you within 2 business days.\n\nYour Enquiry Details:\nReference ID: ${enquiryId}\nMessage: "${message}"\n\nSincerely,\nExecutive Secretariat,\nAICAIML Council`;

    const { sent } = await sendHtmlEmail(email, `[AICAIML] Enquiry Received - Ref No: ${enquiryId}`, htmlBody, emailBody);
    if (process.env.EMAIL_USER) {
      await sendHtmlEmail(process.env.EMAIL_USER, `[AICAIML Admin] New Enquiry — Ref No: ${enquiryId}`, `A new enquiry was submitted on the Contact page.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || '—'}\nReference ID: ${enquiryId}\n\nMessage:\n${message}`);
    }

    res.json({
      success: true,
      referenceId: enquiryId,
      message: 'Enquiry submitted successfully.',
      emailSent: sent
    });
  } catch (err) {
    console.error('Enquiry submit error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit enquiry.' });
  }
};
