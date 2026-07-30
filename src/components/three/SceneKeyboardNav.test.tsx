import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SceneNode } from '@/content/content-types';
import SceneKeyboardNav from './SceneKeyboardNav';

function node(id: string, label: string): SceneNode {
  return {
    id,
    slug: id,
    label,
    destination: 'project',
    type: 'moon',
    route: `/projects/${id}`,
    orbit: {
      orbitRadius: 1,
      orbitSpeed: 1,
      size: 1,
      color: '#fff',
    },
    children: [],
  };
}

describe('SceneKeyboardNav', () => {
  it('supports roving arrow navigation and keyboard selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SceneKeyboardNav
        nodes={[node('alpha', 'Alpha'), node('beta', 'Beta')]}
        onSelect={onSelect}
        label="Scene destinations"
      />
    );

    const alpha = screen.getByRole('option', { name: 'Alpha' });
    const beta = screen.getByRole('option', { name: 'Beta' });
    alpha.focus();

    await user.keyboard('{ArrowDown}');
    expect(beta).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'beta' })
    );

    await user.keyboard('{Home}');
    expect(alpha).toHaveFocus();
  });
});
