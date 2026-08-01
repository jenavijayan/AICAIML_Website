const { supabase, SUPABASE_ENABLED } = require('../_lib/supabaseClient');

module.exports = async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  const { data } = await supabase.from('testimonials').select('id, name, designation, organization, quote, avatar_url as avatarUrl, created_at').order('created_at', { ascending: false });
  res.json(data || []);
};
