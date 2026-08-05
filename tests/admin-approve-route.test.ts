import { beforeEach, describe, expect, it, vi } from 'vitest';

type AnyRow = Record<string, any>;

const state: {
  application: AnyRow | null;
  existingUser: AnyRow | null;
  duplicateUsers: AnyRow[];
  usersMaybeSingleDuplicateError: boolean;
  usersMembershipNoMissing: boolean;
  usersUpdateCalls: Array<{ payload: AnyRow; id: string }>;
  usersDeleteCalls: Array<{ id: string }>;
  applicationsUpdateCalls: Array<{ payload: AnyRow; id: string }>;
  failApplicationUpdate: boolean;
} = {
  application: null,
  existingUser: null,
  duplicateUsers: [],
  usersMaybeSingleDuplicateError: false,
  usersMembershipNoMissing: false,
  usersUpdateCalls: [],
  usersDeleteCalls: [],
  applicationsUpdateCalls: [],
  failApplicationUpdate: false
};

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin'
};

function missingColumnError(column: string) {
  return {
    message: `Could not find the '${column}' column of 'users' in the schema cache`,
    code: 'PGRST204'
  };
}

function createSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === 'applications') {
        return {
          select: () => ({
            eq: (column: string, value: string) => ({
              single: async () => {
                if (column === 'id') {
                  return { data: state.application, error: state.application ? null : { message: 'Not found' } };
                }
                return { data: null, error: null };
              }
            }),
            like: async () => ({ data: [], error: null })
          }),
          update: (payload: AnyRow) => ({
            eq: (_column: string, id: string) => ({
              select: async () => {
                state.applicationsUpdateCalls.push({ payload, id });

                if (Object.prototype.hasOwnProperty.call(payload, 'rejection_reason')) {
                  return { data: null, error: { message: "Could not find the 'rejection_reason' column of 'applications' in the schema cache", code: 'PGRST204' } };
                }

                if (state.failApplicationUpdate) {
                  return { data: null, error: { message: 'applications update failed' } };
                }
                return { data: [{ id, ...payload }], error: null };
              }
            })
          })
        };
      }

      if (table === 'users') {
        return {
          select: () => ({
            eq: (column: string, value: string) => ({
              maybeSingle: async () => {
                if (column === 'email') {
                  if (state.usersMaybeSingleDuplicateError) {
                    return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
                  }
                  return { data: state.existingUser, error: null };
                }
                return { data: null, error: null };
              },
              order: (_column2: string, _opts: AnyRow) => ({
                limit: async () => ({ data: state.duplicateUsers, error: null })
              }),
              limit: async () => ({ data: state.duplicateUsers, error: null })
            }),
            like: async () => {
              if (state.usersMembershipNoMissing) {
                return { data: null, error: { message: "column users.membership_no does not exist", code: '42703' } };
              }
              return { data: [], error: null };
            }
          }),
          insert: (payload: AnyRow) => ({
            select: async () => {
              if (state.usersMembershipNoMissing && Object.prototype.hasOwnProperty.call(payload, 'membership_no')) {
                return { data: null, error: { message: "column users.membership_no does not exist", code: '42703' } };
              }
              return { data: [{ ...payload }], error: null };
            }
          }),
          update: (payload: AnyRow) => ({
            eq: (_column: string, id: string) => ({
              select: async () => {
                state.usersUpdateCalls.push({ payload, id });

                if (Object.prototype.hasOwnProperty.call(payload, 'password_reset_token')) {
                  return { data: null, error: missingColumnError('password_reset_token') };
                }
                if (Object.prototype.hasOwnProperty.call(payload, 'password_reset_expires_at')) {
                  return { data: null, error: missingColumnError('password_reset_expires_at') };
                }

                return { data: [{ ...(state.existingUser || {}), id, ...payload }], error: null };
              }
            })
          }),
          delete: () => ({
            eq: async (_column: string, id: string) => {
              state.usersDeleteCalls.push({ id });
              return { error: null };
            }
          })
        };
      }

      return {
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: null }) }),
          like: async () => ({ data: [], error: null })
        })
      };
    }
  };
}

vi.mock('../server-lib/supabaseClient.js', () => ({
  SUPABASE_ENABLED: true,
  supabase: createSupabaseMock()
}));

vi.mock('../server-lib/authFallback.js', () => ({
  SESSION_COOKIE: 'aicaiml_session',
  SUPABASE_ENABLED: true,
  parseCookies: () => ({ aicaiml_session: 'session-token' }),
  getSupabaseSessionUser: async () => adminUser,
  verifySignedSessionToken: () => null,
  toPublicUser: (u: AnyRow) => u
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async () => ({ messageId: 'test' })
    })
  }
}));

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.payload = data;
      return this;
    }
  };
}

describe('admin approve route compatibility', () => {
  beforeEach(() => {
    state.application = {
      id: 'app-1',
      status: 'Pending',
      category: 'professional',
      membership_no: 'AICAIML-2026-1001',
      form_data: {
        applicantName: 'Jena VJ',
        email: 'jena@example.com'
      }
    };
    state.existingUser = null;
    state.duplicateUsers = [];
    state.usersMaybeSingleDuplicateError = false;
    state.usersMembershipNoMissing = false;
    state.usersUpdateCalls = [];
    state.usersDeleteCalls = [];
    state.applicationsUpdateCalls = [];
    state.failApplicationUpdate = false;
  });

  it('approves successfully when users password reset token columns are missing', async () => {
    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
    expect(res.payload?.credentials?.deliveryMode).toBe('temporary_password');
    expect(state.applicationsUpdateCalls.length).toBeGreaterThan(0);

    const hadFallbackPasswordHashWrite = state.usersUpdateCalls.some((call) => Object.prototype.hasOwnProperty.call(call.payload, 'password_hash'));
    expect(hadFallbackPasswordHashWrite).toBe(true);
  });

  it('rolls back created member user when application update fails', async () => {
    state.failApplicationUpdate = true;

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(String(res.payload?.error || '')).toMatch(/applications update failed/i);
    expect(state.usersDeleteCalls.length).toBeGreaterThan(0);
  });

  it('returns 404 for invalid application id', async () => {
    state.application = null;

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'missing-id', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
    expect(String(res.payload?.error || '')).toMatch(/Application not found/i);
  });

  it('is idempotent for already approved application', async () => {
    state.application = {
      ...state.application,
      status: 'Approved',
      member_id: 'AICAIML-2026-0009'
    };

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.alreadyApproved).toBe(true);
    expect(res.payload?.credentials?.memberId).toBe('AICAIML-2026-0009');
  });

  it('rejects successfully when rejection_reason column is missing', async () => {
    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'reject'] },
      headers: { cookie: 'aicaiml_session=session-token' },
      body: { reason: 'Incomplete documents' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
    const hadRetryWithoutReason = state.applicationsUpdateCalls.some(
      (call) => call.id === 'app-1' && !Object.prototype.hasOwnProperty.call(call.payload, 'rejection_reason')
    );
    expect(hadRetryWithoutReason).toBe(true);
  });

  it('approves successfully when users.membership_no column is missing', async () => {
    state.usersMembershipNoMissing = true;

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
    expect(res.payload?.credentials?.memberId).toMatch(/^AICAIML-\d{4}-\d{4}$/);
  });

  it('approves successfully when member user already exists', async () => {
    state.existingUser = {
      id: 'user-existing-1',
      email: 'jena@example.com',
      name: 'Jena Existing',
      role: 'member',
      membership_status: 'active',
      password_hash: 'abc',
      password_salt: 'def',
      membership_no: null
    };

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
    expect(res.payload?.credentials?.memberId).toMatch(/^AICAIML-\d{4}-\d{4}$/);
  });

  it('approves successfully when duplicate member users exist for same email', async () => {
    state.usersMaybeSingleDuplicateError = true;
    state.duplicateUsers = [
      {
        id: 'dup-user-2',
        email: 'jena@example.com',
        name: 'Duplicate Two',
        role: 'member',
        membership_status: 'active',
        password_hash: 'hash2',
        password_salt: 'salt2',
        membership_no: null
      },
      {
        id: 'dup-user-1',
        email: 'jena@example.com',
        name: 'Duplicate One',
        role: 'member',
        membership_status: 'active',
        password_hash: 'hash1',
        password_salt: 'salt1',
        membership_no: null
      }
    ];

    const { default: handler } = await import('../server-lib/api-routes/admin/[[...path]].js');
    const req: any = {
      method: 'POST',
      query: { path: ['applications', 'app-1', 'approve'] },
      headers: { cookie: 'aicaiml_session=session-token' }
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload?.success).toBe(true);
    const touchedDuplicate = state.usersUpdateCalls.some((call) => call.id === 'dup-user-2' || call.id === 'dup-user-1');
    expect(touchedDuplicate).toBe(true);
  });
});
