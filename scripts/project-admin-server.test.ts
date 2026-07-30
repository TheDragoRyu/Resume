import { describe, expect, it } from 'vitest';
import {
  identityIsAllowed,
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
