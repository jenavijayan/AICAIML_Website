const crypto = require('crypto');

const FALLBACK_AUTH_EMAIL = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'developer@aicaiml.org').trim().toLowerCase();
const FALLBACK_AUTH_PASSWORD = (process.env.ADMIN_PASSWORD || 'Test@123456').trim();
const FALLBACK_AUTH_SECRET = process.env.AUTH_SESSION_SECRET || 'aicaiml-dev-session-secret';
const SESSION_COOKIE = 'aicaiml_session';
const FALLBACK_USER_ID = 'user-dev-001';

function getFallbackUser(email, password, id) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (id && id !== FALLBACK_USER_ID) return null;
  if (!normalizedEmail && !password && !id) return null;
  if (normalizedEmail && normalizedEmail !== FALLBACK_AUTH_EMAIL) return null;
  if (password && password !== FALLBACK_AUTH_PASSWORD) return null;
  return {
    id: FALLBACK_USER_ID,
    name: 'Developer',
    email: FALLBACK_AUTH_EMAIL,
    role: 'admin',
    membershipPlan: 'Premium',
    membershipStatus: 'active',
    permissions: ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes']
  };
}

function createSignedSessionToken(user) {
  const payload = JSON.stringify({ user, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function verifySignedSessionToken(token) {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', FALLBACK_AUTH_SECRET).update(encoded).digest('hex');
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.user) return null;
    if (payload.expiresAt && new Date(payload.expiresAt) < new Date()) return null;
    return payload.user;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      resolve(req.body);
      return;
    }

    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        try {
          const parsed = new URLSearchParams(data);
          const result = {};
          parsed.forEach((value, key) => {
            result[key] = value;
          });
          resolve(result);
        } catch {
          reject(error);
        }
      }
    });
    req.on('error', reject);
  });
}

module.exports = {
  SESSION_COOKIE,
  FALLBACK_AUTH_EMAIL,
  getFallbackUser,
  createSignedSessionToken,
  verifySignedSessionToken,
  parseCookies,
  parseJsonBody
};
