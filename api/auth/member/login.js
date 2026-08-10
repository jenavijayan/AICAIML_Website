import handler from '../../../server-lib/api-routes/auth/member-login.js';

export default async function memberLoginHandler(req, res) {
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    if (body && body.user && !Object.prototype.hasOwnProperty.call(body.user, 'membershipStatus')) {
      body.user.membershipStatus = body.user.membership_status || null;
    }
    return originalJson(body);
  };
  return handler(req, res);
}
