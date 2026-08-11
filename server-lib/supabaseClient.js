import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const SUPABASE_ENABLED =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceRoleKey) &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseServiceRoleKey !== 'your-service-role-key';

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
