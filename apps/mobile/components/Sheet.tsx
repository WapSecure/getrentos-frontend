import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme } from '@getrentos/ui-native';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Optional heading row with a grabber above it. */
  title?: string;
  /** Fixed snap points (e.g. `['60%']`). Omit to size to content. */
  snapPoints?: (string | number)[];
  /** Sticky footer inside the sheet (e.g. Apply / Reset). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Themed bottom sheet — a thin, controlled wrapper over `@gorhom/bottom-sheet`'s
 * modal. Driven by `open`; calls `onClose` on any dismissal (pan-down, backdrop,
 * back button) so the parent's state stays in sync. Requires
 * `<BottomSheetModalProvider>` in the tree (mounted in the root layout).
 */
export function Sheet({ open, onClose, title, snapPoints, footer, children }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const resolvedSnap = useMemo(() => snapPoints, [snapPoints]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={resolvedSnap}
      enableDynamicSizing={!resolvedSnap}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      backgroundStyle={{ backgroundColor: colors.card, borderRadius: radius['2xl'] }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.lg,
        }}
      >
        {title ? (
          <Text variant="heading" style={{ marginBottom: spacing.md }}>
            {title}
          </Text>
        ) : null}
        {children}
        {footer ? <View style={{ marginTop: spacing.lg }}>{footer}</View> : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
