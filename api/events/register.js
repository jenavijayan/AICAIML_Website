import eventsRegisterHandler from '../../server-lib/api-routes/events/register.js';

export default async function handler(req, res) {
  return eventsRegisterHandler(req, res);
}
