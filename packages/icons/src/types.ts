import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

/** One baked element: tag, geometry, and how it is painted (s = stroke, t = tint, f = solid fill). */
export type IconNode = ReadonlyArray<
  readonly ['path' | 'circle' | 'rect', Readonly<Record<string, string | number>>, 's' | 't' | 'f']
>;

export interface SgIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height, in px or any CSS length. Default 24. */
  size?: number | string;
  /** Stroke and fill colour. Default currentColor, so icons follow the text colour. */
  color?: string;
  /** Default 1.75. */
  strokeWidth?: number | string;
  /** Keep the stroke the same pixel width at any size. */
  absoluteStrokeWidth?: boolean;
  /** Any colour other than "none" paints the tinted body solid (filled star, saved heart). */
  fill?: string;
  /** Opacity of the tinted body. Default 0.16. */
  tint?: number;
}

export type SgIcon = ForwardRefExoticComponent<SgIconProps & RefAttributes<SVGSVGElement>>;
