import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('Email not sent — EMAIL_USER/EMAIL_APP_PASSWORD in .env are still placeholders.');
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"AICAIML Council" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    return true;
  } catch (err) {
    console.error('Failed to send mail:', err);
    return false;
  }
}

export async function sendHtmlMail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_USER === 'your-email@gmail.com') {
    console.warn('Email not sent — EMAIL_USER/EMAIL_APP_PASSWORD in .env are still placeholders.');
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"AICAIML Council" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || stripHtml(html),
      html
    });
    return true;
  } catch (err) {
    console.error('Failed to send HTML mail:', err);
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
