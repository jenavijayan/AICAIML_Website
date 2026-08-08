import projectsHandler from '../server-lib/api-routes/projects.js';

export default async function handler(req, res) {
  return projectsHandler(req, res);
}
