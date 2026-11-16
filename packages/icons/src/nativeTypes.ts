import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import type { SvgProps } from 'react-native-svg';

export interface SgNativeIconProps extends Omit<SvgProps, 'width' | 'height'> {
  size?: number;
  /** Default black: react-native-svg has no inherited text colour. */
  color?: ColorValue;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  fill?: ColorValue;
  tint?: number;
}

export type SgNativeIcon = ComponentType<SgNativeIconProps>;
