import { afterEach, describe, expect, it, vi } from 'vitest';

describe('API_CONFIG', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([
    ['bundled Capacitor app', 'https://app', 'https:', 'app'],
    ['bundled Tauri app', 'http://tauri.localhost', 'http:', 'tauri.localhost'],
    [
      'deployed website',
      'https://preview.example.com',
      'https:',
      'preview.example.com',
    ],
  ])(
    'disables the built-in API inside a %s without NEXT_PUBLIC_API_URL',
    async (_name, origin, protocol, hostname) => {
      vi.stubEnv('NEXT_PUBLIC_API_URL', '');
      vi.stubGlobal('window', { location: { origin, protocol, hostname } });

      const { API_CONFIG, IS_BUILTIN_API_ENABLED } = await import('./config');

      expect(API_CONFIG.baseURL).toBe('');
      expect(IS_BUILTIN_API_ENABLED).toBe(false);
    }
  );

  it('uses an explicit API URL and enables the built-in API', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com/');
    vi.stubGlobal('window', {
      location: {
        origin: 'https://app',
        protocol: 'https:',
        hostname: 'app',
      },
    });

    const { API_CONFIG, IS_BUILTIN_API_ENABLED } = await import('./config');

    expect(API_CONFIG.baseURL).toBe('https://api.example.com');
    expect(IS_BUILTIN_API_ENABLED).toBe(true);
  });
});
