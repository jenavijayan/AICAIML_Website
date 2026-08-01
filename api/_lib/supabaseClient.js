const { createClient } = require('@supabase/supabase-js');

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
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

module.exports = { supabase, SUPABASE_ENABLED };
