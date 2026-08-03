import { SESSION_COOKIE, parseCookies, deleteSupabaseSession } from '../_lib/authFallback.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (token) {
    await deleteSupabaseSession(token);
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
  return res.status(200).json({ success: true });
};
