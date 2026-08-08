import partnersHandler from '../server-lib/api-routes/partners.js';

export default async function handler(req, res) {
  return partnersHandler(req, res);
}
