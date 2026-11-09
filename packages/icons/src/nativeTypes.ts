import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import type { SvgProps } from 'react-native-svg';

export interface SgNativeIconProps extends Omit<SvgProps, 'width' | 'height'> {
  /** Width and height. Default 24. */
  size?: number;
  /** Stroke and fill colour. Default black, as react-native-svg has no inherited text colour. */
  color?: ColorValue;
  /** Default 1.75. */
  strokeWidth?: number;
  /** Keep the stroke the same pixel width at any size. */
  absoluteStrokeWidth?: boolean;
  /** Any colour other than "none" paints the tinted body solid (filled star, saved heart). */
  fill?: ColorValue;
  /** Opacity of the tinted body. Default 0.16. */
  tint?: number;
}

export type SgNativeIcon = ComponentType<SgNativeIconProps>;
