const { supabase, SUPABASE_ENABLED } = require('../_lib/supabaseClient');

module.exports = async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  const code = String(req.query.code || '').trim();
  if (!code) {
    return res.status(400).json({ error: 'A certificate or membership number is required.' });
  }

  const { data: certificate } = await supabase.from('certificates').select('*').eq('code', code).maybeSingle();
  if (certificate) {
    return res.json({
      found: true,
      type: 'certificate',
      holderName: certificate.user_name,
      courseTitle: certificate.course_title,
      issuedAt: certificate.issued_at,
      code: certificate.code
    });
  }

  const { data: membership } = await supabase.from('memberships').select('*').eq('membership_no', code).maybeSingle();
  if (membership) {
    return res.json({
      found: true,
      type: 'membership',
      holderName: membership.name,
      planName: membership.plan_name,
      issuedAt: membership.paid_at,
      code: membership.membership_no,
      status: membership.status
    });
  }

  res.json({ found: false });
};
