import { createElement, forwardRef } from 'react';
import type { IconNode, SgIcon, SgIconProps } from './types';

export const DEFAULT_STROKE = 1.75;
export const DEFAULT_TINT = 0.16;

const kebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

export function createIcon(name: string, node: IconNode): SgIcon {
  const Icon = forwardRef<SVGSVGElement, SgIconProps>(
    (
      {
        size = 24,
        color = 'currentColor',
        strokeWidth = DEFAULT_STROKE,
        absoluteStrokeWidth,
        fill,
        tint = DEFAULT_TINT,
        className,
        children,
        ...rest
      },
      ref
    ) => {
      const width = absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth;
      const solid = fill && fill !== 'none' ? fill : undefined;
      const labelled = rest['aria-label'] || rest['aria-labelledby'] || rest.role === 'img';
      return createElement(
        'svg',
        {
          ref,
          xmlns: 'http://www.w3.org/2000/svg',
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: color,
          strokeWidth: width,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': labelled ? undefined : true,
          className: ['sg-icon', `sg-icon-${kebab(name)}`, className].filter(Boolean).join(' '),
          ...rest,
        },
        ...node.map(([tag, attrs, kind], i) =>
          kind === 's'
            ? createElement(tag, { key: i, ...attrs })
            : createElement(tag, {
                key: i,
                ...attrs,
                stroke: 'none',
                fill: kind === 't' ? (solid ?? color) : color,
                fillOpacity: kind === 't' && !solid ? tint : undefined,
              })
        ),
        children
      );
    }
  );
  Icon.displayName = name;
  return Icon;
}
