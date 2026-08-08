import memberLoginHandler from '../../server-lib/api-routes/auth/member-login.js';

export default async function handler(req, res) {
  return memberLoginHandler(req, res);
}
