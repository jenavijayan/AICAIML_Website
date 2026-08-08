import newsHandler from '../server-lib/api-routes/news.js';

export default async function handler(req, res) {
  return newsHandler(req, res);
}
