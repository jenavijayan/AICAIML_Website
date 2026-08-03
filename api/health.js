export default async function handler(req, res) {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
};
