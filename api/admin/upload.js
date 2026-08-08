import adminUploadHandler from '../server-lib/api-routes/admin/upload.js';

export default async function handler(req, res) {
  return adminUploadHandler(req, res);
}
