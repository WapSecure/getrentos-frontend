import { SHARED_TAB_SCREENS } from '../lib/roles';

// The mobile tsconfig has no Node types; these are the two calls the test needs.
interface NodeFs {
  readdirSync(path: string): string[];
}
interface NodePath {
  join(...parts: string[]): string;
}
declare const __dirname: string;
const { readdirSync } = jest.requireActual<NodeFs>('fs');
const { join } = jest.requireActual<NodePath>('path');

const APP = join(__dirname, '..', 'app', '(app)');

function screensByName(): Map<string, string[]> {
  const byName = new Map<string, string[]>();
  for (const group of readdirSync(APP).filter((d: string) => /^\(.+\)$/.test(d))) {
    const portal = group.slice(1, -1);
    for (const file of readdirSync(join(APP, group))) {
      const name = file.replace(/\.tsx$/, '');
      if (file === name || name.startsWith('_') || name === 'index') continue;
      byName.set(name, [...(byName.get(name) ?? []), portal]);
    }
  }
  return byName;
}

describe('SHARED_TAB_SCREENS', () => {
  it('lists every screen name that more than one portal defines, with the right portals', () => {
    const shared = [...screensByName()].filter(([, portals]) => portals.length > 1);
    for (const [name, portals] of shared) {
      expect({ name, portals: [...(SHARED_TAB_SCREENS[name] ?? [])].sort() }).toEqual({
        name,
        portals: [...portals].sort(),
      });
    }
  });
});
