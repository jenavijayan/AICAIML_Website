import { supabase, SUPABASE_ENABLED } from '../_lib/supabaseClient.js';

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      resolve(req.body);
      return;
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch {
        try {
          const parsed = new URLSearchParams(data);
          const result = {};
          parsed.forEach((value, key) => { result[key] = value; });
          resolve(result);
        } catch { reject(new Error('Invalid JSON body')); }
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = await parseJsonBody(req);
    const { eventId, eventTitle, name, email, phone, organization, designation, honeypot } = body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ error: 'Spam activity blocked.' });
    }
    if (!eventId || !name || !email) {
      return res.status(400).json({ error: 'Event details, Name and Email are required.' });
    }

    const emailLower = String(email).trim().toLowerCase();
    const registrationId = 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const { error } = await supabase.from('event_registrations').insert({
      id: registrationId,
      event_id: eventId,
      event_title: eventTitle,
      name,
      email: emailLower,
      phone: phone || null,
      organization: organization || null,
      designation: designation || null,
      registered_at: new Date().toISOString()
    });
    if (error) throw error;

    res.json({
      success: true,
      registrationId,
      message: `Successfully registered interest for ${eventTitle}`
    });
  } catch (err) {
    console.error('Event registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to register for event.' });
  }
};
