import crypto from 'crypto';

const VERIFICATION_COOKIE = 'aicaiml_email_verify';
const DEFAULT_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_SECRET =
  (process.env.EMAIL_VERIFICATION_SECRET || process.env.AUTH_SESSION_SECRET || process.env.SESSION_SECRET || 'aicaiml-dev-email-verify-secret').trim();

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of String(cookieHeader).split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieValue]);
    return;
  }
  res.setHeader('Set-Cookie', [String(existing), cookieValue]);
}

function signPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', VERIFICATION_SECRET).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function verifySignedPayload(token) {
  if (!token) return null;
  const [encoded, signature] = String(token).split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', VERIFICATION_SECRET).update(encoded).digest('hex');
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function toCookieAttributes(maxAgeSeconds) {
  const attrs = [
    `Max-Age=${maxAgeSeconds}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
    attrs.push('Secure');
  }
  return attrs.join('; ');
}

function setVerificationCookie(res, email, code, ttlMs = DEFAULT_TTL_MS) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  if (!cleanEmail || !cleanCode) return;

  const expiresAt = Date.now() + ttlMs;
  const token = signPayload({
    email: cleanEmail,
    code: cleanCode,
    expiresAt
  });

  const maxAgeSeconds = Math.max(1, Math.floor(ttlMs / 1000));
  appendSetCookie(res, `${VERIFICATION_COOKIE}=${encodeURIComponent(token)}; ${toCookieAttributes(maxAgeSeconds)}`);
}

function clearVerificationCookie(res) {
  appendSetCookie(res, `${VERIFICATION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
}

function verifyVerificationCookie(req, email, code) {
  const cookies = parseCookies(req?.headers?.cookie || '');
  const token = cookies[VERIFICATION_COOKIE];
  if (!token) return { found: false, ok: false };

  const payload = verifySignedPayload(token);
  if (!payload) {
    return { found: true, ok: false, error: 'Verification request is invalid. Please request a new code.' };
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  const payloadEmail = String(payload.email || '').trim().toLowerCase();
  const payloadCode = String(payload.code || '').trim();
  const expiresAt = Number(payload.expiresAt || 0);

  if (!cleanEmail || !cleanCode || cleanEmail !== payloadEmail) {
    return { found: true, ok: false, error: 'Verification request does not match this email. Please request a new code.' };
  }

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return { found: true, ok: false, error: 'Verification code expired. Please request a new code.' };
  }

  if (cleanCode !== payloadCode) {
    return { found: true, ok: false, error: 'Invalid verification code.' };
  }

  return { found: true, ok: true };
}

export {
  setVerificationCookie,
  verifyVerificationCookie,
  clearVerificationCookie
};