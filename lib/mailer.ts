import 'dotenv/config';
import nodemailer from 'nodemailer';

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
