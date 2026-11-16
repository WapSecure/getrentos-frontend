import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

/** One baked element: tag, geometry, and how it is painted (s = stroke, t = tint, f = solid fill). */
export type IconNode = ReadonlyArray<
  readonly ['path' | 'circle' | 'rect', Readonly<Record<string, string | number>>, 's' | 't' | 'f']
>;

export interface SgIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  fill?: string;
  tint?: number;
}

export type SgIcon = ForwardRefExoticComponent<SgIconProps & RefAttributes<SVGSVGElement>>;
