import { createElement } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { IconNode } from './types';
import type { SgNativeIcon, SgNativeIconProps } from './nativeTypes';

const DEFAULT_STROKE = 1.75;
const DEFAULT_TINT = 0.16;
const TAGS = { path: Path, circle: Circle, rect: Rect } as const;

export function createNativeIcon(name: string, node: IconNode): SgNativeIcon {
  function Icon({
    size = 24,
    color = 'black',
    strokeWidth = DEFAULT_STROKE,
    absoluteStrokeWidth,
    fill,
    tint = DEFAULT_TINT,
    children,
    ...rest
  }: SgNativeIconProps) {
    const width = absoluteStrokeWidth ? (strokeWidth * 24) / size : strokeWidth;
    const solid = fill && fill !== 'none' ? fill : undefined;
    return createElement(
      Svg,
      { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', ...rest },
      ...node.map(([tag, attrs, kind], i) =>
        createElement(
          TAGS[tag] as typeof Path,
          kind === 's'
            ? {
                key: i,
                ...(attrs as object),
                fill: 'none',
                stroke: color,
                strokeWidth: width,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }
            : {
                key: i,
                ...(attrs as object),
                fill: kind === 't' ? (solid ?? color) : color,
                fillOpacity: kind === 't' && !solid ? tint : 1,
              }
        )
      ),
      children
    );
  }
  Icon.displayName = name;
  return Icon;
}
