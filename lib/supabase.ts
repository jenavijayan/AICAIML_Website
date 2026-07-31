import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export const SUPABASE_ENABLED = Boolean(
  supabaseUrl &&
  supabaseServiceRoleKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('your-project.supabase.co') &&
  supabaseServiceRoleKey !== 'your-service-role-key'
);

const missingSupabaseError = new Error(
  'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
);

function createDisabledSupabaseClient() {
  const resultPromise = Promise.resolve({ data: null, error: missingSupabaseError });

  const handler: ProxyHandler<any> = {
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return (resultPromise as any)[prop].bind(resultPromise);
      }
      if (prop === 'from') {
        return () => proxy;
      }
      return () => proxy;
    },
    apply() {
      return proxy;
    }
  };

  const proxy = new Proxy(() => proxy, handler);
  return proxy;
}

export const supabase = SUPABASE_ENABLED
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!)
  : createDisabledSupabaseClient();
