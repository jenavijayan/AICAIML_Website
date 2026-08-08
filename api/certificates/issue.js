import certificatesIssueHandler from '../../server-lib/api-routes/certificates/issue.js';

export default async function handler(req, res) {
  return certificatesIssueHandler(req, res);
}
