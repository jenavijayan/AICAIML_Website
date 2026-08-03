import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
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
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { planId, planName, price, name, email, phone, paymentMethod, cardNumber, upiId, honeypot } = body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Spam submission detected.' });
    }
    if (!planId || !planName || !price || !name || !email) {
      return res.status(400).json({ error: 'Plan, name and email are required.' });
    }
    if (!paymentMethod || (paymentMethod === 'card' && !cardNumber) || (paymentMethod === 'upi' && !upiId)) {
      return res.status(400).json({ error: 'Valid payment details are required.' });
    }

    const emailLower = String(email || '').trim().toLowerCase();
    if (!emailLower) {
      return res.status(403).json({ error: 'Email verification required. Please verify your email before completing payment.' });
    }

    const membershipNo = 'AIC-MEM-' + Math.floor(100000 + Math.random() * 900000);
    const paymentId = 'PAY-' + Math.random().toString(36).substr(2, 10).toUpperCase();
    const paymentRef = paymentMethod === 'card'
      ? `Card ending ${String(cardNumber).slice(-4)}`
      : `UPI: ${upiId}`;
    const paidAt = new Date().toISOString();

    const { error } = await supabase.from('memberships').insert({
      id: paymentId,
      membership_no: membershipNo,
      plan_id: planId,
      plan_name: planName,
      price,
      name,
      email: emailLower,
      phone: phone || null,
      payment_method: paymentMethod,
      payment_ref: paymentRef,
      status: 'paid',
      paid_at: paidAt
    });
    if (error) throw error;

    const subject = `[AICAIML] Payment Confirmed - ${planName}`;
    const emailBody = `Dear ${name},\n\nYour payment for the AICAIML ${planName} has been received and confirmed.\n\nPAYMENT RECEIPT:\n - Transaction ID: ${paymentId}\n - Membership No: ${membershipNo}\n - Plan: ${planName}\n - Amount Paid: INR ${price} (Annual)\n - Payment Method: ${paymentRef}\n - Date: ${new Date(paidAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nYour membership is now active. Login credentials for the member learning portal will be issued to this email shortly.\n\nWelcome to the AICAIML national network!\n\nSincerely,\nMembership & Treasury Desk, AICAIML Council`;

    const { sent: emailSent } = await sendEmail(email, subject, emailBody);
    if (process.env.EMAIL_USER) {
      await sendEmail(process.env.EMAIL_USER, `[AICAIML Admin] New Membership Payment — ${membershipNo}`, `A new membership payment was received.\n\nName: ${name}\nEmail: ${email}\nPlan: ${planName}\nAmount: INR ${price}\nPayment Method: ${paymentRef}\nMembership No: ${membershipNo}\nTransaction ID: ${paymentId}`);
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
      emailSent
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to process payment.' });
  }
};
