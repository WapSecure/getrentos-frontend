import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import type { FontFamilies } from '@getrentos/ui-native';

/**
 * The brand typeface, the same one the website uses. Static faces, one per
 * weight the type ramp and screens ask for; ui-native's Text picks the face
 * for a weight, so screens keep writing `fontWeight` as before.
 */
export const BRAND_FONT_SOURCES = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

export const BRAND_FONTS: FontFamilies = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};
