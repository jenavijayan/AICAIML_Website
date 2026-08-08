import memberGoogleHandler from '../../server-lib/api-routes/auth/member-google.js';

export default async function handler(req, res) {
  return memberGoogleHandler(req, res);
}
