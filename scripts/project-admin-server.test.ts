import { describe, expect, it } from 'vitest';
import {
  identityIsAllowed,
  normalizeProjectConfig,
  parseAllowedUsers,
} from './project-admin-server';

describe('Tailscale identity authorization', () => {
  it('normalizes a comma-separated allowlist', () => {
    expect(
      parseAllowedUsers(' Alice@example.com, bob@example.com ,, ')
    ).toEqual(['alice@example.com', 'bob@example.com']);
  });

  it('allows only an exact configured identity', () => {
    const allowed = ['owner@example.com'];
    expect(identityIsAllowed('OWNER@example.com', allowed)).toBe(true);
    expect(identityIsAllowed('attacker@example.com', allowed)).toBe(false);
    expect(identityIsAllowed(undefined, allowed)).toBe(false);
  });
});

function configWithSlug(slug: unknown): unknown {
  return {
    defaults: { categoryId: 'cat-experience', featured: false },
    repos: [
      {
        repo: 'owner/example',
        order: 1,
        overrides: { slug },
      },
    ],
  };
}

describe('project configuration normalizer', () => {
  it('accepts a kebab-case override slug', () => {
    const config = normalizeProjectConfig(configWithSlug('portfolio-site'));
    expect(config.repos[0].overrides?.slug).toBe('portfolio-site');
  });

  it('treats an omitted or empty override slug as absent', () => {
    expect(normalizeProjectConfig(configWithSlug(undefined)).repos[0].overrides?.slug)
      .toBeUndefined();
    expect(normalizeProjectConfig(configWithSlug('')).repos[0].overrides?.slug)
      .toBeUndefined();
  });

  it.each([
    '../../../AGENTS',
    '../../CLAUDE',
    'nested/AGENTS',
    '/etc/passwd',
    '..%2f..%2fAGENTS',
    'Portfolio-Site',
    'portfolio site',
    'portfolio-site.md',
    '.',
    '..',
    'a'.repeat(161),
  ])('rejects the unsafe override slug %s', (slug) => {
    expect(() => normalizeProjectConfig(configWithSlug(slug))).toThrow();
  });
});
