import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import { isEmailVerified } from '../../verificationStore.js';
import nodemailer from 'nodemailer';

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
    const { eventId, eventTitle, name, email, phone, organization, designation, honeypot } = body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Spam activity blocked.' });
    }
    if (!eventId || !name || !email) {
      return res.status(400).json({ error: 'Event details, Name and Email are required.' });
    }

    const emailLower = String(email).trim().toLowerCase();
    if (!isEmailVerified(emailLower)) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before registering.' });
    }

    const registrationId = 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const { error } = await supabase.from('event_registrations').insert({
      id: registrationId,
      event_id: eventId,
      event_title: eventTitle,
      name,
      email: emailLower,
      phone: phone || null,
      organization: organization || null,
      designation: designation || null,
      registered_at: new Date().toISOString()
    });
    if (error) throw error;

    const emailBody = `Dear ${name},

We have registered your interest for "${eventTitle}" with AICAIML.

REGISTRATION RECEIPT:
- Ticket ID: ${registrationId}
- Event: ${eventTitle}
- Registrant: ${name} (${organization || 'Individual'})
- Mode: Hybrid/Online Access link will be shared 24 hours prior to the event.

We look forward to your active participation in advancing AI, Machine Learning, and Robotics in India.

Best Regards,
Events Secretariat, AICAIML`;

    const htmlBody = `
      <p>Dear <strong>${name}</strong>,</p>
      <p>We have registered your interest for <strong>"${eventTitle}"</strong> with AICAIML.</p>
      <h3>Registration Receipt</h3>
      <ul>
        <li><strong>Ticket ID:</strong> ${registrationId}</li>
        <li><strong>Event:</strong> ${eventTitle}</li>
        <li><strong>Registrant:</strong> ${name} (${organization || 'Individual'})</li>
        <li><strong>Mode:</strong> Hybrid/Online Access link will be shared 24 hours prior to the event.</li>
      </ul>
      <p>We look forward to your active participation in advancing AI, Machine Learning, and Robotics in India.</p>
      <p>Best Regards,<br>Events Secretariat, AICAIML</p>
    `;

    const { sent } = await sendHtmlEmail(emailLower, `[AICAIML] Registration Received - ${eventTitle}`, htmlBody, emailBody);

    res.json({
      success: true,
      registrationId,
      message: `Successfully registered interest for ${eventTitle}`,
      emailSent: sent,
      emailLog: emailBody
    });
  } catch (err) {
    console.error('Event registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to register for event.' });
  }
};
