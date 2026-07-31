const { SESSION_COOKIE } = require('../_lib/authFallback');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`);
  return res.status(200).json({ success: true });
};
