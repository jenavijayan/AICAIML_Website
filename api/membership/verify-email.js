import membershipVerifyEmailHandler from '../../server-lib/api-routes/membership/verify-email.js';

export default async function handler(req, res) {
  return membershipVerifyEmailHandler(req, res);
}
