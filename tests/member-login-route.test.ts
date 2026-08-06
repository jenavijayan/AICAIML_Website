import { beforeEach, describe, expect, it, vi } from 'vitest';

const state: {
  userResult: { data: any; error: any };
  applicationResult: { data: any; error: any };
  verifyPasswordImpl: (password: string, hash: string, salt: string) => boolean;
} = {
  userResult: { data: null, error: null },
  applicationResult: { data: null, error: null },
  verifyPasswordImpl: () => false
};

vi.mock('../server-lib/supabaseClient.js', () => ({
  SUPABASE_ENABLED: true,
  supabase: {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => state.userResult
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
                  maybeSingle: async () => state.applicationResult
                })
              })
            })
          })
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null })
          })
        })
      };
    }
  }
}));

vi.mock('../server-lib/authFallback.js', () => ({
  SESSION_COOKIE: 'aicaiml_session',
  parseJsonBody: async (req: any) => req.body || {},
  createSupabaseSession: async () => ({ token: 'token-123', expiresAt: new Date(Date.now() + 3600_000).toUTCString() }),
  toPublicUser: (row: any) => ({ id: row.id, email: row.email, role: row.role }),
  verifyPassword: (password: string, hash: string, salt: string) => state.verifyPasswordImpl(password, hash, salt)
}));

function createMockRes() {
  return {
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
}

describe('member login route hardening', () => {
  beforeEach(() => {
    state.userResult = { data: null, error: null };
    state.applicationResult = { data: null, error: null };
    state.verifyPasswordImpl = () => false;
  });

  it('returns PASSWORD_SETUP_REQUIRED before password verification when must_reset_password is true', async () => {
    state.userResult = {
      data: {
        id: 'u-1',
        email: 'member@example.com',
        role: 'member',
        membership_status: 'active',
        must_reset_password: true,
        password_hash: null,
        password_salt: null
      },
      error: null
    };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-login.js');
    const req: any = { method: 'POST', body: { identifier: 'member@example.com', password: 'Password@123' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body?.code).toBe('PASSWORD_SETUP_REQUIRED');
  });

  it('returns ACCOUNT_SETUP_REQUIRED instead of 500 when password verification throws due malformed auth fields', async () => {
    state.userResult = {
      data: {
        id: 'u-2',
        email: 'member2@example.com',
        role: 'member',
        membership_status: 'active',
        must_reset_password: false,
        membership_no: 'AICAIML-2026-0002',
        password_hash: 'not-a-valid-hex-hash',
        password_salt: 'salt'
      },
      error: null
    };
    state.verifyPasswordImpl = () => {
      throw new Error('Invalid hash encoding');
    };

    const { default: handler } = await import('../server-lib/api-routes/auth/member-login.js');
    const req: any = { method: 'POST', body: { identifier: 'member2@example.com', password: 'Password@123' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body?.code).toBe('ACCOUNT_SETUP_REQUIRED');
  });

  it('still succeeds for a valid active member account', async () => {
    state.userResult = {
      data: {
        id: 'u-3',
        email: 'ok@example.com',
        role: 'member',
        membership_status: 'active',
        must_reset_password: false,
        membership_no: 'AICAIML-2026-0003',
        password_hash: 'abcd',
        password_salt: 'efgh'
      },
      error: null
    };
    state.verifyPasswordImpl = () => true;

    const { default: handler } = await import('../server-lib/api-routes/auth/member-login.js');
    const req: any = { method: 'POST', body: { identifier: 'ok@example.com', password: 'Password@123' } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.headers['Set-Cookie']).toContain('aicaiml_session=');
  });
});
