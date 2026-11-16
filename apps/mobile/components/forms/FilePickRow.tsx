import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AlertTriangle, Check, FileText, type SgIcon } from '@sureground/icons/native';
import { Text, useTheme } from '@sureground/ui-native';
import type { PickedFile } from '@/lib/api/documents';
import { checkPickedPhoto } from '@/lib/photoQuality';

export function FilePickRow({
  label,
  file,
  onPick,
  onClear,
  icon: Icon = FileText,
  emptyText = 'Tap to add',
  checkPhotoQuality = false,
  showLabel = true,
}: {
  label: string;
  file: PickedFile | null;
  onPick: () => void;
  onClear?: () => void;
  icon?: SgIcon;
  emptyText?: string;
  checkPhotoQuality?: boolean;
  /** False inside a FilePickList, which shows the label once above its rows. */
  showLabel?: boolean;
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
      {showLabel ? (
        <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
          {label}
        </Text>
      ) : null}
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

/**
 * Several files for one field, picked one at a time (the pickers return a single file): a row per
 * file with Remove, then an "add another" row until `max` is reached.
 */
export function FilePickList({
  label,
  files,
  max,
  onChange,
  pick,
  emptyText = 'Tap to add',
  addText = 'Add another file',
}: {
  label: string;
  files: PickedFile[];
  max: number;
  onChange: (next: PickedFile[]) => void;
  pick: () => Promise<PickedFile | null>;
  emptyText?: string;
  addText?: string;
}) {
  const { spacing } = useTheme();
  const add = async () => {
    const picked = await pick();
    if (picked) onChange([...files, picked].slice(0, max));
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {files.map((file, index) => (
        <FilePickRow
          key={`${file.uri}-${index}`}
          label={`${label}, file ${index + 1}`}
          showLabel={false}
          file={file}
          onPick={add}
          onClear={() => onChange(files.filter((_, i) => i !== index))}
        />
      ))}
      {files.length < max ? (
        <FilePickRow
          label={label}
          showLabel={false}
          file={null}
          emptyText={files.length === 0 ? emptyText : addText}
          onPick={add}
        />
      ) : null}
      <Text variant="caption" color="mutedForeground">
        Up to {max} files{files.length > 0 ? `, ${files.length} added` : ''}.
      </Text>
    </View>
  );
}
