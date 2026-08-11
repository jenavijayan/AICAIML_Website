import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const SUPABASE_ENABLED = !!supabaseUrl && !!supabaseServiceRoleKey;
console.log('Supabase Enabled:', SUPABASE_ENABLED, 'URL:', supabaseUrl ? 'set' : 'missing', 'Key:', supabaseServiceRoleKey ? 'set' : 'missing');

let supabase = null;
if (SUPABASE_ENABLED) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    realtime: {
      enabled: false
    }
  });
}

export function isSupabaseConfigured() {
  return SUPABASE_ENABLED;
}

export { supabase, SUPABASE_ENABLED };
