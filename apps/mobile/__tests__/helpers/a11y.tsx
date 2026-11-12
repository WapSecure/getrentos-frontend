import type { ReactElement, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import {
  isHiddenFromAccessibility,
  render,
  type RenderResult,
} from '@testing-library/react-native';
import { ThemeProvider, ToastProvider } from '@sureground/ui-native';

/** A host element in the rendered tree (RNTL v14 exposes host elements only). */
export type HostElement = NonNullable<RenderResult['root']>;

type Fiber = { type: unknown; memoizedProps: Record<string, unknown> | null; return: Fiber | null };
type HitSlop = number | { top?: number; bottom?: number; left?: number; right?: number } | null;

/** iOS and Android both recommend at least 44 points for anything tappable. */
export const MIN_TOUCH_TARGET = 44;

export interface PressableIssue {
  element: HostElement;
  /** The accessible name, when there is one, to find the control in the message. */
  name?: string;
  problem: string;
}

export interface AuditOptions {
  /** Smallest tappable height/width in points, counting hitSlop. `false` skips the size check. */
  minTarget?: number | false;
}

/** Renders inside the app's theme and toast providers, the same as the root layout. */
export function renderWithTheme(ui: ReactElement, wrapper?: (children: ReactNode) => ReactElement) {
  return render(
    <ThemeProvider initialPreference="light">
      <ToastProvider>{wrapper ? wrapper(ui) : ui}</ToastProvider>
    </ThemeProvider>
  );
}

// Props of the host element plus every composite that rendered it (Pressable, Button, Chip…),
// stopping at the next host element up. That is where onPress and disabled are declared.
function declaredProps(element: HostElement): Record<string, unknown>[] {
  const all: Record<string, unknown>[] = [element.props];
  let fiber = (element as unknown as { unstable_fiber: Fiber | null }).unstable_fiber?.return;
  while (fiber && typeof fiber.type !== 'string') {
    if (fiber.memoizedProps) all.push(fiber.memoizedProps);
    fiber = fiber.return;
  }
  return all;
}

const declared = (element: HostElement, key: string) =>
  declaredProps(element)
    .map((p) => p[key])
    .find((v) => v !== undefined);

function isPressable(element: HostElement): boolean {
  if (element.type === 'TextInput') return false;
  const { props } = element;
  const touchable =
    typeof props.onStartShouldSetResponder === 'function' || typeof props.onClick === 'function';
  if (!touchable) return false;
  return declaredProps(element).some(
    (p) => typeof p.onPress === 'function' || typeof p.onLongPress === 'function'
  );
}

function hostElements(root: HostElement): HostElement[] {
  const out: HostElement[] = [];
  const walk = (node: HostElement) => {
    out.push(node);
    for (const child of node.children) if (typeof child !== 'string') walk(child);
  };
  walk(root);
  return out;
}

function textContent(element: HostElement): string {
  return element.children
    .map((child) => {
      if (typeof child === 'string') return child;
      if (isHiddenFromAccessibility(child)) return '';
      return textContent(child);
    })
    .join('');
}

/** What a screen reader announces: the label, else the text inside. */
export function accessibleName(element: HostElement): string | undefined {
  const { props } = element;
  const label = props.accessibilityLabel ?? props['aria-label'];
  if (typeof label === 'string' && label.trim()) return label.trim();
  if (props.accessibilityLabelledBy || props['aria-labelledby']) return '(labelled by)';
  const text = textContent(element).replace(/\s+/g, ' ').trim();
  return text || undefined;
}

function roleOf(element: HostElement): string | undefined {
  const role = element.props.role ?? element.props.accessibilityRole;
  return typeof role === 'string' && role !== 'none' ? role : undefined;
}

function isDisabledForA11y(element: HostElement): boolean {
  const { props } = element;
  return props.accessibilityState?.disabled === true || props['aria-disabled'] === true;
}

function slop(hitSlop: HitSlop, a: 'top' | 'left', b: 'bottom' | 'right'): number {
  if (hitSlop == null) return 0;
  if (typeof hitSlop === 'number') return hitSlop * 2;
  return (hitSlop[a] ?? 0) + (hitSlop[b] ?? 0);
}

/**
 * The tappable height and width, counting hitSlop, where the style fixes them.
 * A side sized by its content or by flex is `undefined`: it cannot be measured without layout.
 */
export function touchTarget(element: HostElement): { height?: number; width?: number } {
  const style = StyleSheet.flatten(element.props.style) ?? {};
  const hitSlop = declared(element, 'hitSlop') as HitSlop;
  const side = (fixed: unknown, min: unknown, extra: number) => {
    const sizes = [fixed, min].filter((v): v is number => typeof v === 'number');
    return sizes.length ? Math.max(...sizes) + extra : undefined;
  };
  return {
    height: side(style.height, style.minHeight, slop(hitSlop, 'top', 'bottom')),
    width: side(style.width, style.minWidth, slop(hitSlop, 'left', 'right')),
  };
}

/** Every element a user can press that a screen reader can reach. */
export function findPressables(root: HostElement): HostElement[] {
  return hostElements(root).filter((el) => isPressable(el) && !isHiddenFromAccessibility(el));
}

/** Lists what is wrong with each pressable under `root`; empty when they all pass. */
export function auditPressables(root: HostElement, options: AuditOptions = {}): PressableIssue[] {
  const minTarget = options.minTarget ?? MIN_TOUCH_TARGET;
  const issues: PressableIssue[] = [];
  for (const element of findPressables(root)) {
    const name = accessibleName(element);
    const report = (problem: string) => issues.push({ element, name, problem });

    if (!roleOf(element)) report('has no accessibilityRole');
    if (!name) report('has no accessible name: add accessibilityLabel (icon-only) or text');

    if (declared(element, 'disabled') === true && !isDisabledForA11y(element)) {
      report('is disabled but accessibilityState.disabled is not set');
    }

    // VoiceOver and TalkBack focus an `accessible` container as one element, so a control
    // inside one (including a button inside a button) can never be reached on its own.
    for (let parent = element.parent; parent; parent = parent.parent) {
      if (parent.type !== 'Text' && parent.props.accessible === true) {
        report(`sits inside an accessible container (${accessibleName(parent) ?? 'unnamed'})`);
        break;
      }
    }

    if (minTarget) {
      const { height, width } = touchTarget(element);
      if (height !== undefined && height < minTarget)
        report(`is ${height}pt tall including hitSlop (needs ${minTarget})`);
      if (width !== undefined && width < minTarget)
        report(`is ${width}pt wide including hitSlop (needs ${minTarget})`);
    }
  }
  return issues;
}

function describe(issues: { name?: string; problem: string; element: HostElement }[]): string {
  return issues
    .map(({ name, problem, element }) => `  - ${element.type} "${name ?? '(no name)'}" ${problem}`)
    .join('\n');
}

/**
 * Fails when any pressable under `root` lacks a role or an accessible name, hides its disabled
 * state, is unreachable inside an accessible container, or has a fixed size under 44pt.
 * Returns the pressables it checked so a test can assert on how many there are.
 */
export function expectAccessiblePressables(
  root: HostElement,
  options: AuditOptions = {}
): HostElement[] {
  const issues = auditPressables(root, options);
  if (issues.length) {
    throw new Error(`Inaccessible pressables:\n${describe(issues)}`);
  }
  return findPressables(root);
}

/** Fails when a text input a screen reader can reach has no label. */
export function expectLabelledTextInputs(root: HostElement): HostElement[] {
  const inputs = hostElements(root).filter(
    (el) => el.type === 'TextInput' && !isHiddenFromAccessibility(el)
  );
  const issues = inputs
    .filter((el) => !accessibleName(el))
    .map((element) => ({ element, problem: 'has no accessibilityLabel' }));
  if (issues.length) throw new Error(`Unlabelled text inputs:\n${describe(issues)}`);
  return inputs;
}
