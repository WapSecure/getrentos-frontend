import { StyleSheet } from 'react-native';
// The theme module directly: the package index pulls in reanimated, which jest cannot load.
import { resolveFontFamily, withFont, type FontFamilies } from '../../../packages/ui-native/src/theme';
import { BRAND_FONTS } from '@/lib/theme/fonts';

const fonts: FontFamilies = BRAND_FONTS;

describe('resolveFontFamily', () => {
  it('picks the face for the exact weight, in any spelling', () => {
    expect(resolveFontFamily(fonts, '600')).toBe('Manrope_600SemiBold');
    expect(resolveFontFamily(fonts, 600)).toBe('Manrope_600SemiBold');
    expect(resolveFontFamily(fonts, 'bold')).toBe('Manrope_700Bold');
    expect(resolveFontFamily(fonts, 'normal')).toBe('Manrope_400Regular');
    expect(resolveFontFamily(fonts, undefined)).toBe('Manrope_400Regular');
  });

  it('rounds weights the ramp does not use to the nearest loaded face', () => {
    expect(resolveFontFamily(fonts, '300')).toBe('Manrope_400Regular');
    expect(resolveFontFamily(fonts, '900')).toBe('Manrope_800ExtraBold');
    const partial: FontFamilies = { '400': 'R', '700': 'B' };
    expect(resolveFontFamily(partial, '600')).toBe('R');
    expect(resolveFontFamily(partial, '800')).toBe('B');
  });

  it('is undefined without loaded fonts, so the platform face is used', () => {
    expect(resolveFontFamily({}, '600')).toBeUndefined();
  });
});

describe('withFont', () => {
  const theme = {
    font: (weight: unknown) => {
      const fontFamily = resolveFontFamily(fonts, weight as never);
      return fontFamily
        ? { fontFamily, fontWeight: 'normal' as const }
        : { fontWeight: weight as never };
    },
  };

  it('renders an inline weight in that face and resets the weight so nothing is emboldened twice', () => {
    const flat = StyleSheet.flatten(withFont(theme, [{ fontWeight: '400' }, { fontWeight: '700' }]));
    expect(flat).toMatchObject({ fontFamily: 'Manrope_700Bold', fontWeight: 'normal' });
  });

  it('leaves a style that names its own family alone', () => {
    const style = [{ fontFamily: 'Courier', fontWeight: '600' as const }];
    expect(withFont(theme, style)).toBe(style);
  });
});
