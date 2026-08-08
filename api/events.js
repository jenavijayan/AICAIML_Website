import eventsHandler from '../server-lib/api-routes/events.js';

export default async function handler(req, res) {
  return eventsHandler(req, res);
}
