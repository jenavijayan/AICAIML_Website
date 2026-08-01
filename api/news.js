const { supabase, SUPABASE_ENABLED } = require('../_lib/supabaseClient');

module.exports = async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  const { data } = await supabase.from('news').select('id, title, summary, date, category, read_time as readTime, created_at').order('created_at', { ascending: false });
  res.json(data || []);
};
