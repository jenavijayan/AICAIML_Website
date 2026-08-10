import newsHandler from '../../server-lib/api-routes/news.js';
import eventsHandler from '../../server-lib/api-routes/events.js';
import partnersHandler from '../../server-lib/api-routes/partners.js';
import testimonialsHandler from '../../server-lib/api-routes/testimonials.js';
import projectsHandler from '../../server-lib/api-routes/projects.js';

export default async function handler(req, res) {
  const path = req.query && req.query.path;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);

  if (segments[0] === 'news' || segments.length === 0) {
    return newsHandler(req, res);
  }
  if (segments[0] === 'events') {
    return eventsHandler(req, res);
  }
  if (segments[0] === 'partners') {
    return partnersHandler(req, res);
  }
  if (segments[0] === 'testimonials') {
    return testimonialsHandler(req, res);
  }
  if (segments[0] === 'projects') {
    return projectsHandler(req, res);
  }

  return res.status(404).json({ error: 'Not found.' });
}
