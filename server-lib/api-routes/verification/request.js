import { SUPABASE_ENABLED } from '../../supabaseClient.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

async function sendEmail(to, subject, text) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    return { sent: false };
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });
    await transporter.sendMail({ from: `"AICAIML Council" <${process.env.EMAIL_USER}>`, to, subject, text });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { sent: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await new Promise((resolve, reject) => {
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

    const { email } = body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
     const code = String(Math.floor(100000 + Math.random() * 900000));
    const emailBody = `Your AICAIML verification code is: ${code}\n\nThis code expires in 10 minutes.`;
    const { sent } = await sendEmail(cleanEmail, 'AICAIML Email Verification', emailBody);
    const response = { success: true, sent, message: 'Verification code sent.' };
    if (process.env.NODE_ENV === 'development') {
      response.devCode = code;
      console.log(`[DEV OTP] Verification code for ${cleanEmail}: ${code}`);
    }
    res.json(response);
  } catch (err) {
    console.error('Verification request error:', err);
    res.status(500).json({ error: err.message || 'Failed to send verification code.' });
  }
}
