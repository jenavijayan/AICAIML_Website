import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = process.env.SUPABASE_URL || 'https://luhqslotipwqtexyuiyu.supabase.co';
export const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_C6C-LwLw7E2D2UMC_VYkDA_e71hUB02';

export const supabase = createClient(supabaseUrl, supabaseKey);
