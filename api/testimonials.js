import testimonialsHandler from '../server-lib/api-routes/testimonials.js';

export default async function handler(req, res) {
  return testimonialsHandler(req, res);
}
