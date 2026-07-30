import { describe, expect, it } from 'vitest';
import { buildSceneGraph } from './scene-data-builder';

describe('scene graph construction', () => {
  it('maps Resume categories and the Projects index into planets', async () => {
    const scene = await buildSceneGraph();
    const projectsPlanet = scene.children.find(
      (node) => node.destination === 'projects-index'
    );

    expect(scene.type).toBe('sun');
    expect(
      scene.children.filter((node) => node.destination === 'resume-section')
    ).not.toHaveLength(0);
    expect(projectsPlanet?.route).toBe('/projects');
    expect(projectsPlanet?.children).not.toHaveLength(0);
    expect(
      projectsPlanet?.children.every(
        (node) => node.destination === 'project' && node.route.startsWith('/projects/')
      )
    ).toBe(true);
  });
});
