import coursesHandler from '../server-lib/api-routes/courses.js';

export default async function handler(req, res) {
  return coursesHandler(req, res);
}
