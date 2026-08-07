import { describe, it, expect, vi, beforeEach } from 'vitest';
import https from 'node:https';

process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

const state: {
  userRow: any | null;
  userError: any;
  application: any | null;
  applicationError: any;
  googleTokenInfo: any;
  googleTokenError: boolean;
} = {
  userRow: null,
  userError: null,
  application: null,
  applicationError: null,
  googleTokenInfo: null,
  googleTokenError: false
};

const mockCreateSession = vi.fn();
const mockToPublicUser = (row: any) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  membershipPlan: row.membership_plan,
  membershipNo: row.membership_no || null,
  membershipStatus: row.membership_status,
  mustResetPassword: Boolean(row.must_reset_password),
  permissions: Array.isArray(row.permissions) ? row.permissions : []
});

vi.mock('../server-lib/supabaseClient.js', () => ({
  SUPABASE_ENABLED: true,
  supabase: {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => {
                if (state.userError) return { data: null, error: state.userError };
                return { data: state.userRow, error: null };
              }
            })
          })
        };
      }

      if (table === 'applications') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => {
                    if (state.applicationError) return { data: null, error: state.applicationError };
                    return { data: state.application, error: null };
                  }
                })
              })
            })
          })
        };
      }

      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) };
    }
  }
}));

vi.mock('../server-lib/authFallback.js', () => ({
  SESSION_COOKIE: 'aicaiml_session',
  parseJsonBody: async (req: any) => req.body || {},
  createSupabaseSession: mockCreateSession,
  toPublicUser: mockToPublicUser
}));

vi.mock('node:https', () => ({
  default: {
    get: vi.fn()
  }
}));

function mockHttpsResponse(statusCode: number, body: any) {
  const dataStr = JSON.stringify(body);
  const mockRes = {
    statusCode,
    on(event: string, cb: (chunk?: string) => void) {
      if (event === 'data') {
        cb(dataStr);
      } else if (event === 'end') {
        cb();
      }
    }
  };
  return mockRes;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as any,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

describe('member Google login route', () => {
  beforeEach(() => {
    state.userRow = null;
    state.userError = null;
    state.application = null;
    state.applicationError = null;
    state.googleTokenInfo = null;
    state.googleTokenError = false;
    mockCreateSession.mockReset();
  });

  beforeEach(() => {
    const mockedHttps = vi.mocked(https.get as any);
    mockedHttps.mockImplementation((url: string, opts: any, cb: (res: any) => void) => {
      const callback = typeof opts === 'function' ? opts : cb;
      if (state.googleTokenError) {
        callback(mockHttpsResponse(400, { error: 'invalid_token' }));
      } else {
        callback(mockHttpsResponse(200, state.googleTokenInfo));
      }
      return { on: () => {} } as any;
    });
  });

  it('returns 400 when idToken is missing', async () => {
    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: {} };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body?.error).toMatch(/id token is required/i);
  });

  it('returns 401 when Google token verification fails', async () => {
    state.googleTokenError = true;

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'bad-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body?.error).toMatch(/google token verification failed/i);
  });

  it('returns 401 when token audience does not match', async () => {
    state.googleTokenInfo = {
      aud: 'wrong-client-id',
      email: 'member@example.com',
      name: 'Test User'
    };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'fake-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body?.error).toMatch(/not issued for this application/i);
  });

  it('returns 403 with notApproved when email not found and no application exists', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'unknown@example.com',
      name: 'Unknown User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userError = { code: 'PGRST116' };
    state.applicationError = { code: 'PGRST116' };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body?.notApproved).toBe(true);
    expect(res.body?.error).toMatch(/couldn't find an approved membership/i);
  });

  it('returns 403 pending when application status is pending', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'pending@example.com',
      name: 'Pending User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userError = { code: 'PGRST116' };
    state.application = { status: 'Pending' };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body?.status).toBe('pending');
    expect(res.body?.notApproved).toBe(true);
    expect(res.body?.error).toMatch(/still pending review/i);
  });

  it('returns 403 rejected when application status is rejected', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'rejected@example.com',
      name: 'Rejected User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userError = { code: 'PGRST116' };
    state.application = { status: 'Rejected' };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body?.status).toBe('rejected');
    expect(res.body?.notApproved).toBe(true);
  });

  it('returns 403 when user role is not member', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'admin@example.com',
      name: 'Admin User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userRow = {
      id: 'u-admin',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      membership_no: 'AICAIML-2026-0001',
      membership_status: 'active',
      membership_plan: null,
      permissions: [],
      must_reset_password: false
    };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body?.notApproved).toBe(true);
  });

  it('returns 403 when membership status is not active', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'inactive@example.com',
      name: 'Inactive User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userRow = {
      id: 'u-inactive',
      email: 'inactive@example.com',
      name: 'Inactive User',
      role: 'member',
      membership_no: 'AICAIML-2026-0002',
      membership_status: 'suspended',
      membership_plan: null,
      permissions: [],
      must_reset_password: false
    };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body?.status).toBe('suspended');
    expect(res.body?.notApproved).toBe(true);
  });

  it('succeeds for an approved active member', async () => {
    state.googleTokenInfo = {
      aud: 'test-client-id',
      email: 'approved@example.com',
      name: 'Approved User',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    state.userRow = {
      id: 'u-approved',
      email: 'approved@example.com',
      name: 'Approved User',
      role: 'member',
      membership_no: 'AICAIML-2026-0003',
      membership_status: 'active',
      membership_plan: 'Premium',
      permissions: ['read'],
      must_reset_password: false
    };
    mockCreateSession.mockResolvedValue({
      token: 'session-token-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    });

    const { default: handler } = await import('../server-lib/api-routes/auth/member-google.js');
    const req: any = { method: 'POST', body: { idToken: 'valid-id-token' } };
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.user?.email).toBe('approved@example.com');
    expect(res.body?.user?.role).toBe('member');
    expect(res.headers['Set-Cookie']).toContain('aicaiml_session=');
  });
});
