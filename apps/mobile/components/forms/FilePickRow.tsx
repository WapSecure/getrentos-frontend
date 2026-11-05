import { Pressable, View } from 'react-native';
import { Check, FileText, type LucideIcon } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import type { PickedFile } from '@/lib/api/documents';

/**
 * A labelled slot for one file: dashed and tappable while empty, green with the
 * file's name (and a Remove link, when `onClear` is given) once chosen. The
 * caller does the picking, so the same row serves documents, selfies and CSVs.
 */
export function FilePickRow({
  label,
  file,
  onPick,
  onClear,
  icon: Icon = FileText,
  emptyText = 'Tap to add',
}: {
  label: string;
  file: PickedFile | null;
  onPick: () => void;
  onClear?: () => void;
  icon?: LucideIcon;
  emptyText?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Pressable
        onPress={file && onClear ? undefined : onPick}
        accessibilityRole={file && onClear ? undefined : 'button'}
        accessibilityLabel={file ? `${label}: ${file.name}` : `${label}: ${emptyText.toLowerCase()}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: file ? 'solid' : 'dashed',
          borderColor: file ? colors.success : colors.border,
          backgroundColor: file ? colors.successSubtle : colors.card,
        }}
      >
        {file ? (
          <Check size={18} color={colors.success} />
        ) : (
          <Icon size={18} color={colors.mutedForeground} />
        )}
        <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
          {file ? file.name : emptyText}
        </Text>
        {file && onClear ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label.toLowerCase()}`}
          >
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Remove
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}
