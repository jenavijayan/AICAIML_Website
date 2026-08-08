export default async function handler(req, res) {
  return res.status(405).json({ error: 'Method not allowed.' });
}
