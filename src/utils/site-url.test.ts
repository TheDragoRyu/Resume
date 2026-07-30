import { describe, expect, it } from 'vitest';
import {
  buildSiteUrl,
  normalizeBasePath,
  resolveSitePath,
} from './site-url';

describe('site URL utilities', () => {
  it('normalizes deployment base paths', () => {
    expect(normalizeBasePath(undefined)).toBe('');
    expect(normalizeBasePath('/')).toBe('');
    expect(normalizeBasePath('Resume/')).toBe('/Resume');
  });

  it('prefixes root-relative paths exactly once', () => {
    expect(resolveSitePath('/projects/example?tab=code#results', '/Resume/')).toBe(
      '/Resume/projects/example?tab=code#results'
    );
    expect(resolveSitePath('/Resume/projects/example', '/Resume')).toBe(
      '/Resume/projects/example'
    );
    expect(resolveSitePath('https://example.com/path', '/Resume')).toBe(
      'https://example.com/path'
    );
    expect(resolveSitePath('mailto:hello@example.com', '/Resume')).toBe(
      'mailto:hello@example.com'
    );
    expect(resolveSitePath('#results', '/Resume')).toBe('#results');
  });

  it('builds absolute production URLs without duplicate separators', () => {
    expect(
      buildSiteUrl('https://example.com/', '/Resume/', '/og-default.png')
    ).toBe('https://example.com/Resume/og-default.png');
  });
});
