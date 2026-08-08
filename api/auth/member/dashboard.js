import memberDashboardHandler from '../../server-lib/api-routes/auth/member-dashboard.js';

export default async function handler(req, res) {
  return memberDashboardHandler(req, res);
}
