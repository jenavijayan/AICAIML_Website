import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import { SESSION_COOKIE, parseCookies, getSupabaseSessionUser } from '../../authFallback.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!SUPABASE_ENABLED || !supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies[SESSION_COOKIE];
    const user = await getSupabaseSessionUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (String(user.role || '').toLowerCase() !== 'member') {
      return res.status(403).json({ error: 'Member access required.' });
    }

    const [applicationRes, membershipRes] = await Promise.all([
      supabase
        .from('applications')
        .select('*')
        .eq('email', user.email)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('memberships')
        .select('*')
        .eq('email', user.email)
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    if (applicationRes.error) {
      return res.status(500).json({ error: applicationRes.error.message });
    }
    if (membershipRes.error) {
      return res.status(500).json({ error: membershipRes.error.message });
    }

    const latestApplication = applicationRes.data || null;
    const latestMembership = membershipRes.data || null;

    return res.status(200).json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        membershipNo: user.membershipNo || latestApplication?.member_id || null,
        membershipStatus: user.membershipStatus,
        membershipPlan: user.membershipPlan || latestMembership?.plan_name || null,
        joinedDate: latestApplication?.approval_date || latestMembership?.paid_at || null,
        phone: latestApplication?.phone || latestMembership?.phone || null,
        category: latestApplication?.category || latestMembership?.category || null
      },
      latestApplication,
      latestMembership,
      sections: {
        dashboard: { enabled: true },
        profile: { enabled: false },
        courses: { enabled: false },
        certificates: { enabled: false },
        events: { enabled: false },
        downloads: { enabled: false },
        notifications: { enabled: false },
        settings: { enabled: false }
      }
    });
  } catch (error) {
    console.error('Member dashboard error:', error);
    return res.status(500).json({ error: 'Unable to load member dashboard.' });
  }
}
