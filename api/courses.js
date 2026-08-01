const { supabase, SUPABASE_ENABLED } = require('../_lib/supabaseClient');

module.exports = async function handler(req, res) {
  try {
    if (!SUPABASE_ENABLED) {
      return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
    }
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    console.error('api/courses error:', err);
    res.status(500).json({ error: err.message || 'Failed to load courses.' });
  }
};
