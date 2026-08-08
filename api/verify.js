import verifyHandler from '../server-lib/api-routes/verify.js';

export default async function handler(req, res) {
  return verifyHandler(req, res);
}
