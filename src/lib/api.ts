export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: any,
    public readonly isHtml: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  const contentType = res.headers.get('content-type') || '';
  const isHtml = contentType.includes('text/html') || contentType === '';

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    if (isHtml) {
      throw new ApiError(
        'API endpoint returned HTML instead of JSON. Check Vercel API routing.',
        res.status,
        null,
        true
      );
    }
    body = null;
  }

  if (!res.ok) {
    const message = (body && typeof body === 'object' && body.error)
      ? String(body.error)
      : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body, isHtml);
  }

  if (isHtml && res.status === 200) {
    throw new ApiError(
      'API endpoint returned HTML instead of JSON. Check Vercel API routing.',
      res.status,
      body,
      true
    );
  }

  return body as T;
}
