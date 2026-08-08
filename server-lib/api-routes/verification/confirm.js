import { consumeVerificationCode, markEmailVerified, isEmailVerified } from '../../verificationStore.js';
import { clearVerificationCookie, verifyVerificationCookie } from '../../verificationCookie.js';

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

    const { email, code } = body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required.' });
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length !== 6) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const cookieVerification = verifyVerificationCookie(req, email, cleanCode);
    if (cookieVerification.found) {
      if (!cookieVerification.ok) {
        clearVerificationCookie(res);
        return res.status(400).json({ error: cookieVerification.error });
      }
      clearVerificationCookie(res);
      await markEmailVerified(email);
      return res.json({ success: true, message: 'Email verified successfully.' });
    }

    const verified = await consumeVerificationCode(email, cleanCode);
    if (!verified.ok) {
      return res.status(400).json({ error: verified.error });
    }

    clearVerificationCookie(res);
    await markEmailVerified(email);
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    console.error('Verification confirm error:', err);
    res.status(500).json({ error: err.message || 'Failed to verify code.' });
  }
}
