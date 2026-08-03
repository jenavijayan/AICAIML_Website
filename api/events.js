import { supabase, SUPABASE_ENABLED } from '../_lib/supabaseClient.js';

export default async function handler(req, res) {
  try {
    if (!SUPABASE_ENABLED) {
      return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
    }
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) {
    console.error('api/events error:', err);
    res.status(500).json({ error: err.message || 'Failed to load events.' });
  }
};
