import { describe, expect, it } from 'vitest';
import {
  formatSyncDiagnostic,
  redactSyncDiagnosticUrl,
} from '@/lib/sync/types';

describe('sync diagnostics', () => {
  it('redacts signed URL credentials while keeping the target readable', () => {
    const redacted = redactSyncDiagnosticUrl(
      'https://bucket.example.com/brew-guide-data.json?X-Amz-Credential=AKIA/test&X-Amz-Signature=abc&prefix=brew-guide'
    );

    expect(redacted).toContain(
      'https://bucket.example.com/brew-guide-data.json'
    );
    expect(redacted).toContain('X-Amz-Credential=%5Bredacted%5D');
    expect(redacted).toContain('X-Amz-Signature=%5Bredacted%5D');
    expect(redacted).toContain('prefix=brew-guide');
    expect(redacted).not.toContain('AKIA');
    expect(redacted).not.toContain('abc');
  });

  it('formats the useful failure fields for copied sync logs', () => {
    const lines = formatSyncDiagnostic({
      provider: 'WebDAV',
      operation: 'upload',
      target: 'brew-guide-data.json',
      method: 'PUT',
      url: 'https://dav.example.com/brew-guide-data.json',
      status: 403,
      statusText: 'Forbidden',
      ok: false,
      error: 'Ошибка WebDAV: Forbidden',
      responseSnippet: '<error> Forbidden </error>',
      details: { remotePath: 'brew-guide' },
    });

    expect(lines).toContain('Сервис: WebDAV');
    expect(lines).toContain('Действие: upload');
    expect(lines).toContain('HTTP: 403 Forbidden');
    expect(lines).toContain('Ошибка: Ошибка WebDAV: Forbidden');
    expect(lines).toContain('Дополнительно: remotePath=brew-guide');
  });
});
