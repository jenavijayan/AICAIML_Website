import { afterEach, vi } from 'vitest';

vi.stubGlobal('fetch', globalThis.fetch);

afterEach(() => {
  vi.restoreAllMocks();
});
