import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AlertTriangle, Check, FileText, type LucideIcon } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';
import type { PickedFile } from '@/lib/api/documents';
import { checkPickedPhoto } from '@/lib/photoQuality';

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
  checkPhotoQuality = false,
}: {
  label: string;
  file: PickedFile | null;
  onPick: () => void;
  onClear?: () => void;
  icon?: LucideIcon;
  emptyText?: string;
  /**
   * A photo of a document: once chosen, say how to retake it if it is blurry,
   * dark, glared or too small. Advice only; it can still be sent.
   */
  checkPhotoQuality?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const [advice, setAdvice] = useState<{ uri: string; problems: string[] } | null>(null);
  useEffect(() => {
    if (!checkPhotoQuality || !file) return;
    let current = true;
    void checkPickedPhoto(file).then((problems) => {
      if (current) setAdvice({ uri: file.uri, problems });
    });
    return () => {
      current = false;
    };
  }, [checkPhotoQuality, file]);
  const photoAdvice = file && advice?.uri === file.uri ? advice.problems : [];
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Pressable
        onPress={file && onClear ? undefined : onPick}
        accessibilityRole={file && onClear ? undefined : 'button'}
        accessibilityLabel={
          file ? `${label}: ${file.name}` : `${label}: ${emptyText.toLowerCase()}`
        }
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
      {photoAdvice.map((text) => (
        <View
          key={text}
          style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}
        >
          <AlertTriangle size={14} color={colors.warning} style={{ marginTop: 2 }} />
          <Text variant="caption" style={{ flex: 1, color: colors.warning }}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}
