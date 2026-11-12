import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Camera, FileText, ImagePlus, Plus, Trash2, X } from '@sureground/icons/native';
import { Button, FormAlert, NumberField, Text, TextField, useTheme } from '@sureground/ui-native';
import {
  CLAIM_MAX_FILES,
  CLAIM_MAX_ITEMS,
  claimBlocker,
  claimTotal,
  depositEndApi,
  type ClaimDraftItem,
  type DepositEndView,
} from '@/lib/api/depositEnd';
import type { PickedFile } from '@/lib/api/documents';
import { errorMessage } from '@/lib/api/client';
import { capturePhoto, pickDocument, pickPhoto } from '@/lib/filePicker';
import { formatNaira } from '@/lib/format';

let seq = 0;
const newItem = (): ClaimDraftItem => ({
  key: `item-${Date.now()}-${(seq += 1)}`,
  reason: '',
  amount: '',
  files: [],
});

/** Itemised deductions, each with a reason and evidence; uploads the evidence, then files the claim. */
export function ClaimDeductionsForm({
  view,
  onDone,
}: {
  view: DepositEndView;
  onDone: (next: DepositEndView) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const [items, setItems] = useState<ClaimDraftItem[]>(() => [newItem()]);
  const total = claimTotal(items);
  const blocker = claimBlocker(items, view.funded);
  const update = (key: string, patch: Partial<ClaimDraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const submit = useMutation({
    mutationFn: async () => {
      const prepared = [];
      for (const item of items) {
        const evidenceKeys: string[] = [];
        for (const file of item.files) {
          const { key } = await depositEndApi.uploadEvidence(view.holdId, file);
          evidenceKeys.push(key);
        }
        prepared.push({ reason: item.reason.trim(), amount: Number(item.amount), evidenceKeys });
      }
      return depositEndApi.fileClaim(view.holdId, prepared);
    },
    onSuccess: onDone,
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        Give a reason and evidence for each deduction. The tenant then has 7 days to accept or
        dispute. If they do not respond, the claim counts as accepted.
      </Text>
      {items.map((item, index) => (
        <View
          key={item.key}
          style={{
            gap: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              Deduction {index + 1}
            </Text>
            {items.length > 1 ? (
              <Button
                label="Remove"
                size="sm"
                variant="ghost"
                icon={<Trash2 size={14} color={colors.foreground} />}
                disabled={submit.isPending}
                onPress={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
              />
            ) : null}
          </View>
          <TextField
            label="What it is for"
            placeholder="For example, broken kitchen door hinge, replaced"
            value={item.reason}
            onChangeText={(reason) => update(item.key, { reason })}
            multiline
            maxLength={1000}
            editable={!submit.isPending}
          />
          <NumberField
            currency
            label="Amount"
            value={item.amount}
            onValueChange={(amount) => update(item.key, { amount })}
            editable={!submit.isPending}
          />
          <EvidencePicker
            files={item.files}
            disabled={submit.isPending}
            onChange={(files) => update(item.key, { files })}
          />
        </View>
      ))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {items.length < CLAIM_MAX_ITEMS ? (
          <Button
            label="Add another deduction"
            size="sm"
            variant="secondary"
            icon={<Plus size={14} color={colors.secondaryForeground} />}
            disabled={submit.isPending}
            onPress={() => setItems((prev) => [...prev, newItem()])}
          />
        ) : null}
        <Text variant="caption" color="mutedForeground" style={{ flex: 1, textAlign: 'right' }}>
          Total {formatNaira(total)} of {formatNaira(view.funded)}
        </Text>
      </View>

      {submit.error ? (
        <FormAlert message={errorMessage(submit.error, 'Could not send the claim.')} />
      ) : null}
      <Button
        label="Claim deductions"
        loading={submit.isPending}
        loadingLabel="Sending claim…"
        disabled={!!blocker || submit.isPending}
        onPress={() => submit.mutate()}
      />
      {blocker ? (
        <Text variant="caption" color="mutedForeground" center>
          {blocker}
        </Text>
      ) : null}
    </View>
  );
}

function EvidencePicker({
  files,
  disabled,
  onChange,
}: {
  files: PickedFile[];
  disabled: boolean;
  onChange: (files: PickedFile[]) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const add = async (pick: () => Promise<PickedFile | null>) => {
    const file = await pick().catch(() => null);
    if (file) onChange([...files, file]);
  };
  const full = files.length >= CLAIM_MAX_FILES;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" style={{ fontWeight: '600' }}>
        Evidence
      </Text>
      <Text variant="caption" color="mutedForeground">
        Photos, receipts or quotes, up to 10MB each. At least one.
      </Text>
      {files.map((file, i) => (
        <View
          key={`${file.uri}-${i}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.secondary,
            borderRadius: radius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <FileText size={14} color={colors.mutedForeground} />
          <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
            {file.name}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${file.name}`}
            disabled={disabled}
            hitSlop={8}
            onPress={() => onChange(files.filter((_, j) => j !== i))}
          >
            <X size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
      {!full ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button
            label="Take a photo"
            size="sm"
            variant="outline"
            icon={<Camera size={14} color={colors.foreground} />}
            disabled={disabled}
            onPress={() => void add(capturePhoto)}
          />
          <Button
            label="Choose a photo"
            size="sm"
            variant="outline"
            icon={<ImagePlus size={14} color={colors.foreground} />}
            disabled={disabled}
            onPress={() => void add(pickPhoto)}
          />
          <Button
            label="Choose a file"
            size="sm"
            variant="outline"
            icon={<FileText size={14} color={colors.foreground} />}
            disabled={disabled}
            onPress={() => void add(pickDocument)}
          />
        </View>
      ) : null}
    </View>
  );
}
