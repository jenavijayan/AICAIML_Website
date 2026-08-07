import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getSupabaseSessionUser, verifySignedSessionToken, parseCookies, SESSION_COOKIE, SUPABASE_ENABLED, toPublicUser } from '../../authFallback.js';
import { supabase } from '../../supabaseClient.js';

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

async function getAdminUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  let user = await getSupabaseSessionUser(token);
  if (!user) user = verifySignedSessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function json(res, statusCode, obj) {
  res.status(statusCode).json(obj);
}

function createTraceId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function serializeError(error) {
  if (!error) return { message: 'Unknown error' };
  return {
    message: String(error.message || error),
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    stack: error.stack || null
  };
}

function createStepLogger(scope, metadata) {
  return (event, details = {}) => {
    const payload = {
      timestamp: new Date().toISOString(),
      scope,
      event,
      ...metadata,
      ...details
    };
    try {
      console.log(`[${scope}]`, JSON.stringify(payload));
    } catch {
      console.log(`[${scope}]`, payload);
    }
  };
}

function failIfSupabaseError(result, context) {
  if (result && result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }
}

function errorMentionsColumn(error, columnName) {
  if (!error || !columnName) return false;
  const message = String(error.message || '').toLowerCase();
  return message.includes(columnName.toLowerCase());
}

function isDuplicateRowsError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('multiple') && (message.includes('rows') || message.includes('results'))
  ) || error.code === 'PGRST116';
}

function rowCountError(context, rows) {
  const count = Array.isArray(rows) ? rows.length : 0;
  const error = new Error(`${context}: expected exactly 1 row, got ${count}`);
  error.code = 'ROW_COUNT_MISMATCH';
  error.details = { rowCount: count };
  return error;
}

function normalizePublicBaseUrl(raw) {
  if (!raw) return null;
  let input = String(raw).trim();
  if (!input) return null;

  if (!/^https?:\/\//i.test(input)) {
    input = `https://${input}`;
  }

  try {
    const url = new URL(input);
    if (url.hostname.toLowerCase() === 'www.aic-aiml.org') {
      url.hostname = 'aic-aiml.org';
    }
    url.hash = '';
    url.search = '';
    url.pathname = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resolvePublicBaseUrl(req, logStep) {
  const forwardedProto = String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req?.headers?.['x-forwarded-host'] || '').split(',')[0].trim();

  const candidates = [
    { source: 'BASE_URL', value: process.env.BASE_URL },
    { source: 'PUBLIC_BASE_URL', value: process.env.PUBLIC_BASE_URL },
    { source: 'APP_BASE_URL', value: process.env.APP_BASE_URL },
    { source: 'VITE_APP_BASE_URL', value: process.env.VITE_APP_BASE_URL },
    { source: 'VERCEL_URL', value: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '' },
    { source: 'request.origin', value: req?.headers?.origin || '' },
    { source: 'request.forwarded', value: (forwardedProto && forwardedHost) ? `${forwardedProto}://${forwardedHost}` : '' },
    { source: 'request.host', value: req?.headers?.host ? `https://${req.headers.host}` : '' },
    { source: 'default', value: 'https://aic-aiml.org' }
  ];

  for (const candidate of candidates) {
    const normalized = normalizePublicBaseUrl(candidate.value);
    if (normalized) {
      logStep?.('config.base_url.resolved', { source: candidate.source, baseUrl: normalized });
      return normalized;
    }
  }

  const fallback = 'https://aic-aiml.org';
  logStep?.('config.base_url.fallback', { baseUrl: fallback });
  return fallback;
}

async function selectWithOrderFallback(table, primaryOrderColumn) {
  let result = await supabase.from(table).select('*').order(primaryOrderColumn, { ascending: false });
  if (!result.error && Array.isArray(result.data) && result.data.length > 0) return result;

  if (!result.error && (!result.data || result.data.length === 0)) {
    const emptyCheck = await supabase.from(table).select('*');
    if (!emptyCheck.error && Array.isArray(emptyCheck.data) && emptyCheck.data.length > 0) {
      return emptyCheck;
    }
  }

  if (result.error && errorMentionsColumn(result.error, primaryOrderColumn)) {
    result = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (!result.error && Array.isArray(result.data) && result.data.length > 0) return result;
  }

  result = await supabase.from(table).select('*');
  
  if (!result.data || result.data.length === 0) {
    const idCheck = await supabase.from(table).select('id').limit(100);
    if (!idCheck.error && Array.isArray(idCheck.data) && idCheck.data.length > 0) {
      return { data: idCheck.data, error: null };
    }
  }
  
  return result;
}

async function countTable(table) {
  const result = await supabase.from(table).select('*', { count: 'exact', head: true });
  return {
    count: result.count || 0,
    error: result.error ? String(result.error.message || 'Unknown error') : null
  };
}

async function updateRowCompatById(table, id, payload, optionalColumns, logStep) {
  const current = { ...payload };
  const removedColumns = [];

  while (true) {
    logStep?.('query.update.start', { table, id, keys: Object.keys(current) });
    const result = await supabase.from(table).update(current).eq('id', id).select('*');
    if (!result.error) {
      const rows = Array.isArray(result.data) ? result.data : [];
      if (rows.length === 1) {
        logStep?.('query.update.success', { table, id, keys: Object.keys(current), removedColumns, rowId: rows[0]?.id || null });
        return { error: null, appliedPayload: current, removedColumns, data: rows[0] };
      }

      if (rows.length === 0) {
        // Some deployments can complete updates while returning no representation rows.
        const probe = await supabase.from(table).select('*').eq('id', id).maybeSingle();
        if (!probe.error && probe.data) {
          logStep?.('query.update.success_via_probe', { table, id, keys: Object.keys(current), removedColumns, rowId: probe.data?.id || null });
          return { error: null, appliedPayload: current, removedColumns, data: probe.data };
        }

        logStep?.('query.update.success_no_representation', {
          table,
          id,
          keys: Object.keys(current),
          removedColumns,
          probeError: probe.error ? serializeError(probe.error) : null
        });
        return { error: null, appliedPayload: current, removedColumns, data: null };
      }

      const mismatch = rowCountError(`Failed to update ${table} row ${id}`, rows);
      logStep?.('query.update.row_count_mismatch', { table, id, keys: Object.keys(current), rowCount: rows.length });
      return { error: mismatch, appliedPayload: current, removedColumns, data: null };
    }

    logStep?.('query.update.error', { table, id, error: serializeError(result.error), keys: Object.keys(current) });
    const missingOptional = optionalColumns.find((col) => Object.prototype.hasOwnProperty.call(current, col) && errorMentionsColumn(result.error, col));
    if (!missingOptional) {
      return { error: result.error, appliedPayload: current, removedColumns, data: null };
    }

    delete current[missingOptional];
    removedColumns.push(missingOptional);
    logStep?.('query.update.drop_optional_column', { table, id, droppedColumn: missingOptional });
  }
}

async function insertRowCompat(table, payload, optionalColumns, logStep) {
  const current = { ...payload };
  const removedColumns = [];

  while (true) {
    logStep?.('query.insert.start', { table, keys: Object.keys(current) });
    const result = await supabase.from(table).insert(current).select('*');
    if (!result.error) {
      const rows = Array.isArray(result.data) ? result.data : [];
      if (rows.length === 1) {
        logStep?.('query.insert.success', { table, keys: Object.keys(current), removedColumns, rowId: rows[0]?.id || null });
        return { data: rows[0], error: null, appliedPayload: current, removedColumns };
      }

      if (rows.length === 0) {
        const fallbackData = Object.prototype.hasOwnProperty.call(current, 'id') ? { ...current } : null;
        logStep?.('query.insert.success_no_representation', {
          table,
          keys: Object.keys(current),
          removedColumns,
          hasFallbackData: Boolean(fallbackData)
        });
        return { data: fallbackData, error: null, appliedPayload: current, removedColumns };
      }

      const mismatch = rowCountError(`Failed to insert ${table} row`, rows);
      logStep?.('query.insert.row_count_mismatch', { table, keys: Object.keys(current), rowCount: rows.length });
      return { data: null, error: mismatch, appliedPayload: current, removedColumns };
    }

    logStep?.('query.insert.error', { table, error: serializeError(result.error), keys: Object.keys(current) });
    const missingOptional = optionalColumns.find((col) => Object.prototype.hasOwnProperty.call(current, col) && errorMentionsColumn(result.error, col));
    if (!missingOptional) {
      return { data: null, error: result.error, appliedPayload: current, removedColumns };
    }

    delete current[missingOptional];
    removedColumns.push(missingOptional);
    logStep?.('query.insert.drop_optional_column', { table, droppedColumn: missingOptional });
  }
}

async function findUserByEmailCompat(email, logStep) {
  const normalized = String(email || '').trim().toLowerCase();
  logStep?.('query.users.by_email_primary.start', { email: normalized });

  const primary = await supabase.from('users').select('*').eq('email', normalized).maybeSingle();
  logStep?.('query.users.by_email_primary.result', {
    found: Boolean(primary.data),
    error: primary.error ? serializeError(primary.error) : null
  });

  if (!primary.error) {
    return primary.data || null;
  }

  if (!isDuplicateRowsError(primary.error)) {
    failIfSupabaseError(primary, 'Failed to check existing member user');
  }

  logStep?.('query.users.by_email_duplicates.detected', { email: normalized });

  let list = await supabase.from('users').select('*').eq('email', normalized).order('created_at', { ascending: false }).limit(20);
  if (list.error && errorMentionsColumn(list.error, 'created_at')) {
    list = await supabase.from('users').select('*').eq('email', normalized).limit(20);
  }
  failIfSupabaseError(list, 'Failed to list duplicate member users by email');

  const rows = Array.isArray(list.data) ? list.data : [];
  const preferred = rows.find((row) => String(row.role || '').toLowerCase() === 'member') || rows[0] || null;
  logStep?.('query.users.by_email_duplicates.resolved', { count: rows.length, selectedUserId: preferred?.id || null });
  return preferred;
}

async function updateApplicationCompat(id, payload) {
  const optionalColumns = ['member_id', 'approval_date', 'rejection_reason', 'reviewed_at', 'reviewed_by', 'updated_at'];
  return updateRowCompatById('applications', id, payload, optionalColumns);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function parseMembershipSequence(memberId, year) {
  const match = String(memberId || '').match(/^AICAIML-(\d{4})-(\d{4})$/);
  if (!match) return 0;
  if (match[1] !== String(year)) return 0;
  return Number(match[2]) || 0;
}

async function generateMembershipId(logStep) {
  const year = new Date().getFullYear();
  const pattern = `AICAIML-${year}-%`;

  logStep?.('query.membership_sequence.users.start', { pattern });
  let usersRes = await supabase.from('users').select('membership_no').like('membership_no', pattern);
  logStep?.('query.membership_sequence.users.result', { rowCount: (usersRes.data || []).length, error: usersRes.error ? serializeError(usersRes.error) : null });

  if (usersRes.error && String(usersRes.error.message || '').toLowerCase().includes('membership_no')) {
    logStep?.('query.membership_sequence.users.missing_column', { column: 'membership_no' });
    usersRes = { data: [], error: null };
  }

  let membershipsRes = { data: [], error: null };
  if (!usersRes.data || usersRes.data.length === 0) {
    logStep?.('query.membership_sequence.memberships.start', { pattern });
    membershipsRes = await supabase.from('memberships').select('membership_no').like('membership_no', pattern);
    logStep?.('query.membership_sequence.memberships.result', { rowCount: (membershipsRes.data || []).length, error: membershipsRes.error ? serializeError(membershipsRes.error) : null });
    if (membershipsRes.error && String(membershipsRes.error.message || '').toLowerCase().includes('membership_no')) {
      logStep?.('query.membership_sequence.memberships.missing_column', { column: 'membership_no' });
      membershipsRes = { data: [], error: null };
    }
  }

  logStep?.('query.membership_sequence.applications.start', { pattern });
  let appsRes = await supabase.from('applications').select('member_id').like('member_id', pattern);
  logStep?.('query.membership_sequence.applications.result', { rowCount: (appsRes.data || []).length, error: appsRes.error ? serializeError(appsRes.error) : null });

  // Backward compatibility for deployments where member_id may not exist yet.
  if (appsRes.error && String(appsRes.error.message || '').toLowerCase().includes('member_id')) {
    appsRes = { data: [], error: null };
  }

  failIfSupabaseError(usersRes, 'Failed to read users for membership ID generation');
  failIfSupabaseError(membershipsRes, 'Failed to read memberships for membership ID generation');
  failIfSupabaseError(appsRes, 'Failed to read applications for membership ID generation');

  let maxSeq = 0;

  for (const row of usersRes.data || []) {
    maxSeq = Math.max(maxSeq, parseMembershipSequence(row.membership_no, year));
  }
  for (const row of membershipsRes.data || []) {
    maxSeq = Math.max(maxSeq, parseMembershipSequence(row.membership_no, year));
  }
  for (const row of appsRes.data || []) {
    maxSeq = Math.max(maxSeq, parseMembershipSequence(row.member_id, year));
  }

  const nextSeq = maxSeq + 1;
  return `AICAIML-${year}-${String(nextSeq).padStart(4, '0')}`;
}

async function ensureMemberUser({ name, email, membershipId }, logStep) {
  const mutation = { created: false, userId: null, previousUser: null };

  let existingUser = await findUserByEmailCompat(email, logStep);
  logStep?.('query.users.by_email.result', { found: Boolean(existingUser), selectedUserId: existingUser?.id || null });

  if (!existingUser) {
    const tempPassword = crypto.randomBytes(24).toString('base64url');
    const { hash, salt } = hashPassword(tempPassword);
    const now = new Date().toISOString();
    const newUserId = 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    logStep?.('query.users.insert.start', { email, generatedUserId: newUserId });
    let createRes = await insertRowCompat(
      'users',
      {
      id: newUserId,
      name,
      email,
      password_hash: hash,
      password_salt: salt,
      role: 'member',
      membership_no: membershipId,
      membership_plan: null,
      membership_status: 'active',
      must_reset_password: true,
      permissions: '[]',
      created_at: now,
      updated_at: now
      },
      ['membership_no', 'membership_plan', 'must_reset_password', 'updated_at'],
      logStep
    );

    // Fallback payload for deployments with older users schema.
    if (createRes.error) {
      createRes = await insertRowCompat(
        'users',
        {
        id: newUserId,
        name,
        email,
        password_hash: hash,
        password_salt: salt,
        role: 'member',
        membership_no: membershipId,
        membership_status: 'active',
        permissions: '[]',
        created_at: now
        },
        ['membership_no'],
        logStep
      );
    }

    if (createRes.error) {
      const message = String(createRes.error.message || '').toLowerCase();
      if (createRes.error.code === '23505' || message.includes('duplicate') || message.includes('already exists')) {
        logStep?.('query.users.insert.duplicate_retry', { email });
        existingUser = await findUserByEmailCompat(email, logStep);
        if (existingUser && existingUser.id) {
          mutation.created = false;
          mutation.userId = existingUser.id;
          mutation.previousUser = {
            role: existingUser.role,
            membership_no: existingUser.membership_no,
            membership_status: existingUser.membership_status,
            name: existingUser.name,
            password_hash: existingUser.password_hash,
            password_salt: existingUser.password_salt,
            must_reset_password: existingUser.must_reset_password,
            updated_at: existingUser.updated_at
          };
          return { user: existingUser, mutation };
        }
      }
    }

    logStep?.('query.users.insert.result', { error: createRes.error ? serializeError(createRes.error) : null, userId: createRes.data?.id || null });
    failIfSupabaseError(createRes, 'Failed to create approved member user');
    existingUser = createRes.data;
    mutation.created = true;
    mutation.userId = existingUser.id;
  } else {
    mutation.created = false;
    mutation.userId = existingUser.id;
    mutation.previousUser = {
      role: existingUser.role,
      membership_no: existingUser.membership_no,
      membership_status: existingUser.membership_status,
      name: existingUser.name,
      password_hash: existingUser.password_hash,
      password_salt: existingUser.password_salt,
      must_reset_password: existingUser.must_reset_password,
      updated_at: existingUser.updated_at
    };

    let resetSeed = null;
    if (!existingUser.password_hash || !existingUser.password_salt) {
      const tempPassword = crypto.randomBytes(24).toString('base64url');
      resetSeed = hashPassword(tempPassword);
    }

    logStep?.('query.users.update_existing.start', { userId: existingUser.id });
    let updateRes = await updateRowCompatById(
      'users',
      existingUser.id,
      {
      role: 'member',
      membership_no: existingUser.membership_no || membershipId,
      membership_status: 'active',
      name: existingUser.name || name,
      password_hash: resetSeed ? resetSeed.hash : existingUser.password_hash,
      password_salt: resetSeed ? resetSeed.salt : existingUser.password_salt,
      must_reset_password: true,
      updated_at: new Date().toISOString()
      },
      ['membership_no', 'must_reset_password', 'updated_at'],
      logStep
    );

    if (updateRes.error) {
      updateRes = await updateRowCompatById(
        'users',
        existingUser.id,
        {
        role: 'member',
        membership_no: existingUser.membership_no || membershipId,
        membership_status: 'active',
        name: existingUser.name || name,
        password_hash: resetSeed ? resetSeed.hash : existingUser.password_hash,
        password_salt: resetSeed ? resetSeed.salt : existingUser.password_salt,
        must_reset_password: true
        },
        ['membership_no', 'must_reset_password'],
        logStep
      );
    }

    logStep?.('query.users.update_existing.result', { userId: existingUser.id, error: updateRes.error ? serializeError(updateRes.error) : null });

    if (!updateRes.error) {
      existingUser = updateRes.data || existingUser;
    }
  }

  return { user: existingUser, mutation };
}

async function rollbackMemberUserMutation(mutation, logStep) {
  if (!mutation || !mutation.userId) return;

  if (mutation.created) {
    logStep?.('query.users.rollback_delete.start', { userId: mutation.userId });
    const deleteRes = await supabase.from('users').delete().eq('id', mutation.userId);
    if (deleteRes.error) {
      logStep?.('query.users.rollback_delete.error', { userId: mutation.userId, error: serializeError(deleteRes.error) });
    } else {
      logStep?.('query.users.rollback_delete.success', { userId: mutation.userId });
    }
    return;
  }

  if (!mutation.previousUser) return;
  const restorePayload = {
    role: mutation.previousUser.role,
    membership_no: mutation.previousUser.membership_no,
    membership_status: mutation.previousUser.membership_status,
    name: mutation.previousUser.name,
    password_hash: mutation.previousUser.password_hash,
    password_salt: mutation.previousUser.password_salt,
    must_reset_password: mutation.previousUser.must_reset_password,
    updated_at: mutation.previousUser.updated_at || new Date().toISOString()
  };

  const restore = await updateRowCompatById('users', mutation.userId, restorePayload, ['membership_no', 'must_reset_password', 'updated_at'], logStep);
  if (restore.error) {
    logStep?.('query.users.rollback_restore.error', { userId: mutation.userId, error: serializeError(restore.error) });
  } else {
    logStep?.('query.users.rollback_restore.success', { userId: mutation.userId });
  }
}

async function issuePasswordSetupToken(userId, logStep) {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const tokenPayload = {
    password_reset_token: tokenHash,
    password_reset_expires_at: expiresAt,
    must_reset_password: true,
    updated_at: new Date().toISOString()
  };

  const tokenUpdate = await updateRowCompatById(
    'users',
    userId,
    tokenPayload,
    ['password_reset_token', 'password_reset_expires_at', 'must_reset_password', 'updated_at'],
    logStep
  );

  if (tokenUpdate.error) {
    failIfSupabaseError(tokenUpdate, 'Failed to create password setup token');
  }

  const tokenColumnsPersisted =
    Object.prototype.hasOwnProperty.call(tokenUpdate.appliedPayload, 'password_reset_token') &&
    Object.prototype.hasOwnProperty.call(tokenUpdate.appliedPayload, 'password_reset_expires_at');

  if (tokenColumnsPersisted) {
    logStep?.('workflow.password_setup.mode', { mode: 'setup_link', expiresAt });
    return { mode: 'setup_link', rawToken, expiresAt };
  }

  const tempPassword = crypto.randomBytes(18).toString('base64url');
  const { hash, salt } = hashPassword(tempPassword);
  const passwordFallback = await updateRowCompatById(
    'users',
    userId,
    {
      password_hash: hash,
      password_salt: salt,
      must_reset_password: true,
      updated_at: new Date().toISOString()
    },
    ['must_reset_password', 'updated_at'],
    logStep
  );
  failIfSupabaseError(passwordFallback, 'Failed to provision temporary password fallback');
  logStep?.('workflow.password_setup.mode', { mode: 'temporary_password' });
  return { mode: 'temporary_password', tempPassword, expiresAt: null };
}

async function handleOverview(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const [enquiries, applications, eventRegistrations, memberships, users, courses, projects, partners, testimonials, news] = await Promise.all([
    countTable('enquiries'),
    countTable('applications'),
    countTable('event_registrations'),
    countTable('memberships'),
    countTable('users'),
    countTable('courses'),
    countTable('projects'),
    countTable('partners'),
    countTable('testimonials'),
    countTable('news')
  ]);

  const warningMap = {
    enquiries: enquiries.error,
    applications: applications.error,
    eventRegistrations: eventRegistrations.error,
    memberships: memberships.error,
    users: users.error,
    courses: courses.error,
    projects: projects.error,
    partners: partners.error,
    testimonials: testimonials.error,
    news: news.error
  };

  const warningEntries = Object.entries(warningMap).filter(([, value]) => Boolean(value));
  if (warningEntries.length === Object.keys(warningMap).length) {
    return json(res, 500, {
      error: 'Failed to query overview metrics. Check admin diagnostics and schema migrations.',
      details: warningMap
    });
  }

  return json(res, 200, {
    enquiries: enquiries.count,
    applications: applications.count,
    eventRegistrations: eventRegistrations.count,
    memberships: memberships.count,
    users: users.count,
    courses: courses.count,
    projects: projects.count,
    partners: partners.count,
    testimonials: testimonials.count,
    news: news.count,
    warnings: warningEntries.length > 0 ? warningMap : undefined
  });
}

async function handleEnquiries(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data, error } = await selectWithOrderFallback('enquiries', 'submitted_at');
  if (error) return json(res, 500, { error: `Failed to load enquiries: ${error.message}` });

  if (!data || data.length === 0) {
    const { count } = await countTable('enquiries');
    if (count > 0) {
      const retry = await supabase.from('enquiries').select('*');
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return json(res, 200, retry.data);
      }
    }
  }

  json(res, 200, data || []);
}

async function handleApplications(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data, error } = await selectWithOrderFallback('applications', 'submitted_at');
  if (error) return json(res, 500, { error: `Failed to load applications: ${error.message}` });

  if (!data || data.length === 0) {
    const { count } = await countTable('applications');
    if (count > 0) {
      const retry = await supabase.from('applications').select('*');
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return json(res, 200, retry.data);
      }
    }
  }

  json(res, 200, data || []);
}

async function handleApproveApplication(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const traceId = createTraceId();
  const startedAt = Date.now();
  const logStep = createStepLogger('admin.approve', {
    traceId,
    endpoint: '/api/admin/applications/:id/approve',
    method: req.method,
    applicationId: id,
    adminId: admin.id,
    adminEmail: admin.email
  });
  let memberMutation = null;

  try {
    logStep('request.received', {
      hasCookie: Boolean(req.headers?.cookie),
      userAgent: req.headers?.['user-agent'] || null,
      origin: req.headers?.origin || null
    });

    logStep('query.applications.fetch.start');
    const { data: application, error: fetchError } = await supabase.from('applications').select('*').eq('id', id).single();
    logStep('query.applications.fetch.result', { found: Boolean(application), error: fetchError ? serializeError(fetchError) : null });
    if (fetchError || !application) return json(res, 404, { error: 'Application not found.' });

    if (String(application.status || '').toLowerCase() === 'approved') {
      logStep('workflow.idempotent_already_approved', { existingMemberId: application.member_id || null });
      return json(res, 200, {
        success: true,
        application,
        credentials: { memberId: application.member_id || null, setupLinkSent: true },
        alreadyApproved: true
      });
    }

    const approvalDate = new Date().toISOString();
    const formData = application.form_data || {};
    const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
    const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

    const memberId = application.member_id && /^AICAIML-\d{4}-\d{4}$/.test(application.member_id)
      ? application.member_id
      : await generateMembershipId(logStep);
    logStep('workflow.membership_id.resolved', { memberId });

    const memberUserResult = await ensureMemberUser({ name, email, membershipId: memberId }, logStep);
    const memberUser = memberUserResult.user;
    memberMutation = memberUserResult.mutation;
    logStep('workflow.member_user.ready', { userId: memberUser.id, created: Boolean(memberMutation?.created) });

    const setup = await issuePasswordSetupToken(memberUser.id, logStep);
    const updateResult = await updateRowCompatById(
      'applications',
      id,
      {
        status: 'Approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        approval_date: approvalDate,
        member_id: memberId,
        updated_at: new Date().toISOString()
      },
      ['member_id', 'approval_date', 'reviewed_at', 'reviewed_by', 'updated_at'],
      logStep
    );
    if (updateResult.error) {
      throw new Error(`Application update failed: ${updateResult.error.message}`);
    }

    const baseUrl = resolvePublicBaseUrl(req, logStep);
    const setPasswordLink = setup.mode === 'setup_link'
      ? `${baseUrl}/#set-password?token=${encodeURIComponent(setup.rawToken)}`
      : null;
    const membershipType = String(application.category || application.membership_category || 'member').toUpperCase();
    let emailBody = `Dear ${name},\n\nCongratulations! Your application for AICAIML ${membershipType} membership has been reviewed and approved by the Membership Board.\n\nAPPROVAL DETAILS:\n - Membership ID: ${memberId}\n - Application ID: ${application.id}\n - Membership Type: ${membershipType}\n - Approval Date: ${new Date(approvalDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n`;

    if (setup.mode === 'setup_link') {
      emailBody += `SECURE ACCOUNT SETUP:\n 1. Set your member portal password using the secure link below:\n ${setPasswordLink}\n 2. This link expires in 48 hours for your account security.\n 3. After setting the password, sign in at: ${baseUrl}/#member-login\n\nPlease keep your credentials private and do not share them.`;
    } else {
      emailBody += `LOGIN CREDENTIALS (LEGACY SETUP MODE):\n - Username: ${email}\n - Temporary Password: ${setup.tempPassword}\n\nPlease sign in at ${baseUrl}/#member-login and change your password immediately after first login.`;
    }

    emailBody += `\n\nWelcome to India's premier AI/ML advancements ecosystem!\n\nSincerely,\nMembership Board,\nAll India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

    let emailSent = false;
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
      });
      if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_USER !== 'your-email@gmail.com') {
        await transporter.sendMail({ from: `"AICAIML Council" <${process.env.EMAIL_USER}>`, to: email, subject: `[AICAIML] Membership Application Approved - ${application.membership_no}`, text: emailBody });
        emailSent = true;
      }
      logStep('notification.email.result', { sent: emailSent, mode: setup.mode });
    } catch (err) {
      logStep('notification.email.error', { error: serializeError(err), mode: setup.mode });
    }

    logStep('request.success', { durationMs: Date.now() - startedAt, mode: setup.mode, emailSent });
    json(res, 200, {
      success: true,
      application: { ...application, status: 'Approved', approval_date: approvalDate, member_id: memberId },
      credentials: {
        memberId,
        setupLinkSent: setup.mode === 'setup_link',
        deliveryMode: setup.mode,
        temporaryPasswordIssued: setup.mode === 'temporary_password'
      },
      traceId
    });
  } catch (err) {
    logStep('request.error', { durationMs: Date.now() - startedAt, error: serializeError(err) });
    await rollbackMemberUserMutation(memberMutation, logStep);
    throw err;
  }
}

async function handleRejectApplication(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const body = await parseJsonBody(req);
  const reason = body.reason || '';
  const { data: application, error: fetchError } = await supabase.from('applications').select('*').eq('id', id).single();
  if (fetchError || !application) return json(res, 404, { error: 'Application not found.' });

  const rejectionDate = new Date().toISOString();
  const updateResult = await updateApplicationCompat(id, {
    status: 'Rejected',
    reviewed_at: rejectionDate,
    rejection_reason: reason || null
  });
  if (updateResult.error) return json(res, 500, { error: updateResult.error.message });

  const formData = application.form_data || {};
  const name = formData.studentName || formData.applicantName || formData.authorizedRepresentativeName || formData.institutionName || formData.universityName || 'Applicant';
  const email = (formData.emailId || formData.email || 'applicant@aic-aiml.org').trim().toLowerCase();

  const membershipType = String(application.category || application.membership_category || 'member').toUpperCase();
  const emailBody = `Dear ${name},\n\nThank you for your interest in AICAIML ${membershipType} membership.\n\nAfter careful review by the Membership Board, we regret to inform you that your application (Ref: ${application.id}) has been marked as Rejected.\n\n${reason ? `REJECTION REASON:\n${reason}\n\n` : ''}If you believe this decision was made in error, or if you would like to address the concerns noted above, please contact our Membership Office at support@aic-aiml.org with your application reference number.\n\nYou may also choose to resubmit a new application after addressing the feedback provided.\n\nSincerely,\nMembership Board,\nAll India Council for Artificial Intelligence & Machine Learning (AICAIML)`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });
    if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      await transporter.sendMail({ from: `"AICAIML Council" <${process.env.EMAIL_USER}>`, to: email, subject: `[AICAIML] Membership Application Update - ${application.membership_no}`, text: emailBody });
    }
  } catch (err) {
    console.error('Failed to send rejection email:', err);
  }

  json(res, 200, { success: true, application: { ...application, status: 'Rejected' } });
}

async function handleEventRegistrations(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data, error } = await selectWithOrderFallback('event_registrations', 'registered_at');
  if (error) return json(res, 500, { error: `Failed to load event registrations: ${error.message}` });

  if (!data || data.length === 0) {
    const { count } = await countTable('event_registrations');
    if (count > 0) {
      const retry = await supabase.from('event_registrations').select('*');
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return json(res, 200, retry.data);
      }
    }
  }

  json(res, 200, data || []);
}

async function handleMemberships(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data, error } = await selectWithOrderFallback('memberships', 'paid_at');
  if (error) return json(res, 500, { error: `Failed to load memberships: ${error.message}` });

  if (!data || data.length === 0) {
    const { count } = await countTable('memberships');
    if (count > 0) {
      const retry = await supabase.from('memberships').select('*');
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return json(res, 200, retry.data);
      }
    }
  }

  json(res, 200, data || []);
}

async function handleUsers(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { data, error } = await selectWithOrderFallback('users', 'created_at');
  if (error) return json(res, 500, { error: `Failed to load users: ${error.message}` });

  if (!data || data.length === 0) {
    const { count } = await countTable('users');
    if (count > 0) {
      const retry = await supabase.from('users').select('*');
      if (!retry.error && Array.isArray(retry.data) && retry.data.length > 0) {
        return json(res, 200, retry.data);
      }
    }
  }

  const safe = (data || []).map((u) => {
    const { password_hash, password_salt, ...rest } = u;
    let permissions = rest.permissions;
    if (typeof permissions === 'string') {
      try { permissions = JSON.parse(permissions); } catch { permissions = []; }
    }
    return {
      ...rest,
      permissions: Array.isArray(permissions) ? permissions : [],
      membership_no: rest.membership_no || null
    };
  });
  json(res, 200, safe);
}

async function handleDiagnostics(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const projectUrl = (process.env.SUPABASE_URL || '').trim();
  const projectRef = projectUrl ? projectUrl.replace(/^https?:\/\//, '').split('.')[0] : 'missing';

  const [applicationsRes, usersRes, membershipsRes] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('memberships').select('*', { count: 'exact', head: true })
  ]);

  return json(res, 200, {
    supabaseEnabled: SUPABASE_ENABLED,
    projectRef,
    tables: {
      applications: { count: applicationsRes.count || 0, error: applicationsRes.error?.message || null },
      users: { count: usersRes.count || 0, error: usersRes.error?.message || null },
      memberships: { count: membershipsRes.count || 0, error: membershipsRes.error?.message || null }
    }
  });
}

async function handleCreateUser(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  const body = await parseJsonBody(req);
  const { name, email, password, role } = body;
  if (!name || !email || !password) return json(res, 400, { error: 'Name, email and password are required.' });
  const emailLower = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return json(res, 400, { error: 'Invalid email format.' });
  if (password.length < 8) return json(res, 400, { error: 'Password must be at least 8 characters.' });

  const { data: existing } = await supabase.from('users').select('*').eq('email', emailLower).maybeSingle();
  if (existing) return json(res, 409, { error: 'A user with this email already exists.' });

  const id = 'user-' + Date.now();
  const userRole = role === 'admin' ? 'admin' : 'member';
  const permissions = userRole === 'admin'
    ? ['access_premium_courses', 'access_course_videos', 'access_downloadable_resources', 'access_quizzes', 'access_certificates', 'access_members_only_pages']
    : [];
  const { hash, salt } = (() => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  })();

  const { data, error } = await supabase.from('users').insert({
    id,
    name,
    email: emailLower,
    password_hash: hash,
    password_salt: salt,
    role: userRole,
    membership_plan: null,
    membership_status: 'inactive',
    permissions,
    created_at: new Date().toISOString()
  }).select('*').single();

  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true, user: toPublicUser(data) });
}

async function handleCourses(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, category, level, duration, modules, access, image, topics } = body;
    if (!title || !description || !category || !level || !duration || !access) {
      return json(res, 400, { error: 'Title, description, category, level, duration and access are required.' });
    }
    const course = {
      id: 'course-' + Date.now(),
      title,
      description,
      category,
      level,
      duration,
      modules: Number(modules) || 0,
      access,
      image: image || undefined,
      topics: Array.isArray(topics) ? topics : String(topics || '').split(',').map((t) => t.trim()).filter(Boolean),
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('courses').insert(course);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, course });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteCourse(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleProjects(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, category, image, status, impact } = body;
    if (!title || !description || !category || !status || !impact) {
      return json(res, 400, { error: 'Title, description, category, status and impact are required.' });
    }
    const project = {
      id: 'proj-' + Date.now(),
      title,
      description,
      category,
      image: image || undefined,
      status,
      impact,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('projects').insert(project);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, project });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteProject(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleEvents(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { title, description, date, time, venue, category } = body;
    if (!title || !description || !date || !time || !venue || !category) {
      return json(res, 400, { error: 'All event fields are required.' });
    }
    const event = {
      id: 'evt-' + Date.now(),
      title,
      description,
      date,
      time,
      venue,
      category,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('events').insert(event);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, event });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteEvent(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handlePartners(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('partners').select('id, name, type, logo_placeholder as logoPlaceholder, created_at').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { name, type, logoPlaceholder } = body;
    if (!name || !type || !logoPlaceholder) return json(res, 400, { error: 'Name, type and logo placeholder are required.' });
    const partner = {
      id: 'part-' + Date.now(),
      name,
      type,
      logo_placeholder: logoPlaceholder,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('partners').insert(partner);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, partner });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeletePartner(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleTestimonials(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  if (req.method === 'GET') {
    const { data } = await supabase.from('testimonials').select('id, name, designation, organization, quote, avatar_url as avatarUrl, created_at').order('created_at', { ascending: false });
    return json(res, 200, data || []);
  }

  if (req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { name, designation, organization, quote, avatarUrl } = body;
    if (!name || !designation || !organization || !quote || !avatarUrl) {
      return json(res, 400, { error: 'All testimonial fields are required.' });
    }
    const testimonial = {
      id: 'test-' + Date.now(),
      name,
      designation,
      organization,
      quote,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('testimonials').insert(testimonial);
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { success: true, testimonial });
  }

  json(res, 405, { error: 'Method not allowed.' });
}

async function handleDeleteTestimonial(req, res, id) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) return json(res, 500, { error: error.message });
  json(res, 200, { success: true });
}

async function handleUpload(req, res) {
  const admin = await getAdminUser(req);
  if (!admin) return json(res, 401, { error: 'Admin access required.' });

  // Vercel serverless functions don't have easy multipart parsing.
  // Fallback: expect base64 data URL in a JSON body field 'fileData'
  const body = await parseJsonBody(req);
  const { fileData, filename } = body;
  if (!fileData) return json(res, 400, { error: 'No file provided. Send base64 data URL in fileData.' });
  
  const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return json(res, 400, { error: 'Invalid data URL format.' });
  
  const ext = matches[1].split('/')[1]?.split('+')[0] || 'bin';
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');
  const safeName = String(filename || 'upload-' + Date.now()).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const finalName = `${Date.now()}-${safeName}`;
  
  const { error } = await supabase.storage.from('uploads').upload(finalName, buffer, {
    contentType: matches[1],
    upsert: true
  });
  if (error) {
    return json(res, 500, { error: error.message });
  }
  
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(finalName);
  json(res, 200, { success: true, url: urlData.publicUrl });
}

export default async function handler(req, res) {
  if (!SUPABASE_ENABLED) {
    return json(res, 500, { error: 'Supabase is not configured on this deployment. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const path = req.query && req.query.path;
  const segments = Array.isArray(path) ? path : (path ? [path] : []);

  try {
    if (segments.length === 0 || segments[0] === 'overview') {
      if (req.method === 'GET') return await handleOverview(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'enquiries') {
      if (req.method === 'GET') return await handleEnquiries(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'applications') {
      if (req.method === 'GET') return await handleApplications(req, res);
      if (req.method === 'POST') {
        if (segments[2] === 'approve' && segments[1]) return await handleApproveApplication(req, res, segments[1]);
        if (segments[2] === 'reject' && segments[1]) return await handleRejectApplication(req, res, segments[1]);
        return json(res, 400, { error: 'Expected /approve or /reject with an application ID.' });
      }
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'event-registrations') {
      if (req.method === 'GET') return await handleEventRegistrations(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'memberships') {
      if (req.method === 'GET') return await handleMemberships(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'users') {
      if (req.method === 'GET') return await handleUsers(req, res);
      if (req.method === 'POST') return await handleCreateUser(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'diagnostics') {
      if (req.method === 'GET') return await handleDiagnostics(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    if (segments[0] === 'courses') {
      if (segments.length === 1) return await handleCourses(req, res);
      if (segments.length === 2) return await handleDeleteCourse(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'projects') {
      if (segments.length === 1) return await handleProjects(req, res);
      if (segments.length === 2) return await handleDeleteProject(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'events') {
      if (segments.length === 1) return await handleEvents(req, res);
      if (segments.length === 2) return await handleDeleteEvent(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'partners') {
      if (segments.length === 1) return await handlePartners(req, res);
      if (segments.length === 2) return await handleDeletePartner(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'testimonials') {
      if (segments.length === 1) return await handleTestimonials(req, res);
      if (segments.length === 2) return await handleDeleteTestimonial(req, res, segments[1]);
      return json(res, 404, { error: 'Not found.' });
    }

    if (segments[0] === 'upload') {
      if (req.method === 'POST') return await handleUpload(req, res);
      return json(res, 405, { error: 'Method not allowed.' });
    }

    return json(res, 404, { error: 'Not found.' });
  } catch (err) {
    console.error('Admin API error:', err);
    return json(res, 500, { error: err.message || 'Internal server error.' });
  }
};
