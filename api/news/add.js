import newsAddHandler from '../server-lib/api-routes/news/add.js';

export default async function handler(req, res) {
  return newsAddHandler(req, res);
}
