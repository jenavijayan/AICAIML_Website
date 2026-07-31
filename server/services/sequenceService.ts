import { supabase } from '../../lib/supabase';

export async function getImmutableMembershipSequence(category: string): Promise<number> {
  const year = new Date().getFullYear();
  const prefix = `AIC-${category}-${year}-`;

  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .like('membership_no', `${prefix}%`);

  return (count || 0) + 1;
}

export async function getNextSequence(category: string, year: number): Promise<number> {
  const prefix = `AIC-${category}-${year}-`;

  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .like('membership_no', `${prefix}%`);

  return (count || 0) + 1;
}
