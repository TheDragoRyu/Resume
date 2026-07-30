import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SceneNode } from '@/content/content-types';
import ContextPanel from './ContextPanel';

const sceneNode: SceneNode = {
  id: 'project',
  slug: 'project',
  label: 'Project',
  destination: 'project',
  type: 'moon',
  route: '/projects/project',
  orbit: {
    orbitRadius: 1,
    orbitSpeed: 1,
    size: 1,
    color: '#fff',
  },
  children: [],
};

describe('ContextPanel', () => {
  it('focuses the dialog, traps focus, and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ContextPanel
        node={sceneNode}
        onClose={onClose}
        onPrimary={vi.fn()}
        primaryLabel="Open Project"
      />
    );

    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog).toHaveFocus());

    const close = screen.getByRole('button', { name: 'Close panel' });
    const open = screen.getByRole('button', { name: 'Open Project' });
    open.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
