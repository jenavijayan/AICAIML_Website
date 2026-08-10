import newsHandler from '../server-lib/api-routes/news.js';
import eventsHandler from '../server-lib/api-routes/events.js';
import partnersHandler from '../server-lib/api-routes/partners.js';
import testimonialsHandler from '../server-lib/api-routes/testimonials.js';
import projectsHandler from '../server-lib/api-routes/projects.js';

export default async function handler(req, res) {
  const url = req.url || '';

  if (url === '/api/news' || url === '/api/news/') return newsHandler(req, res);
  if (url === '/api/events' || url === '/api/events/') return eventsHandler(req, res);
  if (url === '/api/partners' || url === '/api/partners/') return partnersHandler(req, res);
  if (url === '/api/testimonials' || url === '/api/testimonials/') return testimonialsHandler(req, res);
  if (url === '/api/projects' || url === '/api/projects/') return projectsHandler(req, res);

  return res.status(404).json({ error: 'Not found.' });
}
