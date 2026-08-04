import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { startServer } from '../server';

describe('public API routes', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_APP_PASSWORD = 'test-password';
    process.env.LOAD_LOCAL_ENV = 'false';
    process.env.HOST = '0.0.0.0';

    const instance = await startServer();
    server = instance.server;
    baseUrl = `http://127.0.0.1:${instance.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('normalizes a wildcard host to localhost for dev startup', async () => {
    const address = server.address();
    expect(address).not.toBeNull();
    if (address && typeof address !== 'string') {
      expect(address.address).toBe('127.0.0.1');
    }
  });

  it('serves the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.status).toBe('ok');
  });

  it('rejects malformed login payloads', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' })
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/password|characters|email/i);
  });

  it('rejects invalid enquiry submissions', async () => {
    const response = await fetch(`${baseUrl}/api/enquiry/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'invalid', message: '' })
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/name|email|message/i);
  });
});
