import { darkColors, lightColors, type Palette } from '@getrentos/tokens';

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const semanticPairs: [keyof Palette, keyof Palette][] = [
  ['foreground', 'background'],
  ['cardForeground', 'card'],
  ['mutedForeground', 'background'],
  ['mutedForeground', 'card'],
  ['primary', 'card'],
  ['accentForeground', 'accent'],
  ['success', 'successSubtle'],
  ['background', 'success'],
  ['warning', 'warningSubtle'],
  ['purple', 'purpleSubtle'],
  ['destructive', 'destructiveSubtle'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s theme contrast', (_scheme, palette) => {
  it.each(semanticPairs)('%s remains readable on %s', (foreground, background) => {
    expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(4.5);
  });
});
