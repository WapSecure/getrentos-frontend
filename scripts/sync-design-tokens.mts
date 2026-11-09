import { readFileSync, writeFileSync } from 'node:fs';
import { colors, radius } from '../packages/tokens/src/index.ts';

const target = new URL('../packages/ui/src/styles/theme.css', import.meta.url);
const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const palette = Object.entries(colors).map(([scheme, values]) => {
  const declarations = Object.entries(values).map(
    ([name, value]) => `  --${kebab(name)}: ${value};`
  );
  return `${scheme === 'light' ? ':root' : '.dark'} {\n${declarations.join('\n')}\n}`;
});
const radii = Object.entries(radius)
  .filter(([name]) => name !== 'none' && name !== 'full')
  .map(([name, value]) => `  --radius-${name}: ${value / 16}rem;`);
const css = `/* Generated from @sureground/tokens. Run pnpm tokens:sync to update. */\n${palette.join('\n\n')}\n\n@theme {\n${radii.join('\n')}\n}\n`;

if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== css) {
    throw new Error('Design tokens have drifted. Run pnpm tokens:sync.');
  }
  console.log('Web and native design tokens agree.');
} else {
  writeFileSync(target, css);
  console.log('Updated shared web theme from native design tokens.');
}
