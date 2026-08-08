import healthHandler from '../server-lib/api-routes/health.js';

export default async function handler(req, res) {
  return healthHandler(req, res);
}
