import memberSetPasswordHandler from '../../server-lib/api-routes/auth/member-set-password.js';

export default async function handler(req, res) {
  return memberSetPasswordHandler(req, res);
}
