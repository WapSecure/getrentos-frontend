import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import type { FontFamilies } from '@sureground/ui-native';

// ui-native's Text picks the face for a weight, so screens keep writing `fontWeight`.
export const BRAND_FONT_SOURCES = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  Newsreader_400Regular,
};

/** Page titles and display text, matching the web's serif. */
export const DISPLAY_FONT = 'Newsreader_400Regular';

export const BRAND_FONTS: FontFamilies = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};
