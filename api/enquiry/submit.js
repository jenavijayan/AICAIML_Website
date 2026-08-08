import enquirySubmitHandler from '../../server-lib/api-routes/enquiry/submit.js';

export default async function handler(req, res) {
  return enquirySubmitHandler(req, res);
}
