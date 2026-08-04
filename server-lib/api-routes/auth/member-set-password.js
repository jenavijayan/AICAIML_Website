import crypto from 'crypto';
import { supabase, SUPABASE_ENABLED } from '../../supabaseClient.js';
import {
  parseJsonBody,
  hashPassword
} from '../../authFallback.js';

const INVALID_PASSWORD_MESSAGE = 'This password cannot be used. Please choose a different password and try again.';

function hashSetupToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function validateMemberPassword(password) {
  if (!password || password.length < 8 || password.length > 72) return false;
  if (/\s/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

async function upsertSupabaseAuthPassword(userRow, password) {
  const create = await supabase.auth.admin.createUser({
    email: userRow.email,
    password,
    email_confirm: true,
    user_metadata: {
      local_user_id: userRow.id,
      membership_no: userRow.membership_no || null,
      role: 'member'
    },
    app_metadata: {
      role: 'member'
    }
  });

  if (!create.error) return;

  const lower = String(create.error.message || '').toLowerCase();
  const mayExist = lower.includes('already') || lower.includes('exists') || lower.includes('registered');
  if (!mayExist) {
    throw create.error;
  }

  let page = 1;
  let foundUser = null;

  while (page <= 20 && !foundUser) {
    const listed = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listed.error) throw listed.error;

    const users = listed.data?.users || [];
    foundUser = users.find((u) => String(u.email || '').toLowerCase() === String(userRow.email || '').toLowerCase()) || null;
    if (users.length < 200) break;
    page += 1;
  }

  if (!foundUser) {
    throw new Error('Unable to locate existing Supabase Auth user for this email.');
  }

  const update = await supabase.auth.admin.updateUserById(foundUser.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(foundUser.user_metadata || {}),
      local_user_id: userRow.id,
      membership_no: userRow.membership_no || null,
      role: 'member'
    }
  });

  if (update.error) throw update.error;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!SUPABASE_ENABLED || !supabase) {
    return res.status(500).json({ error: 'Supabase is not configured on this deployment.' });
  }

  try {
    const body = await parseJsonBody(req);
    const token = String(body.token || '').trim();
    const newPassword = String(body.newPassword || '');

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (!validateMemberPassword(newPassword)) {
      return res.status(400).json({ error: INVALID_PASSWORD_MESSAGE });
    }

    const tokenHash = hashSetupToken(token);
    const userQuery = await supabase.from('users').select('*').eq('password_reset_token', tokenHash).maybeSingle();
    if (userQuery.error) {
      return res.status(500).json({ error: userQuery.error.message });
    }

    const user = userQuery.data;
    if (!user) {
      return res.status(400).json({ error: 'This password setup link is invalid.' });
    }

    if (String(user.role || '').toLowerCase() !== 'member') {
      return res.status(403).json({ error: 'This password setup link is not valid for this account.' });
    }

    const expiresAt = user.password_reset_expires_at ? new Date(user.password_reset_expires_at) : null;
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return res.status(400).json({ error: 'This password setup link has expired. Ask admin to resend approval setup.' });
    }

    const membershipStatus = String(user.membership_status || '').toLowerCase();
    if (membershipStatus !== 'active') {
      return res.status(403).json({ error: 'Only approved members can set their account password.' });
    }

    try {
      await upsertSupabaseAuthPassword(user, newPassword);
    } catch (authError) {
      console.error('Supabase Auth password setup failed:', authError);
      return res.status(400).json({ error: INVALID_PASSWORD_MESSAGE });
    }

    const { hash, salt } = hashPassword(newPassword);
    const update = await supabase.from('users').update({
      password_hash: hash,
      password_salt: salt,
      password_reset_token: null,
      password_reset_expires_at: null,
      must_reset_password: false,
      email_verified: true,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (update.error) {
      return res.status(500).json({ error: update.error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Password saved successfully. Please sign in on the Member Login page.'
    });
  } catch (error) {
    console.error('Member set-password error:', error);
    return res.status(500).json({ error: 'Unable to set password.' });
  }
}
