import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, ChevronRight, Megaphone, Plus } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Card,
  Chip,
  FormAlert,
  Price,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DUE_STATUS,
  dueCategoryLabel,
  dueTotal,
  dueWhen,
  estateManagerApi,
  type Announcement,
  type Due,
  type Household,
  type ManagedEstate,
} from '@/lib/api/estateManager';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { Sheet } from '@/components/Sheet';
import { StatusPill, isUpgradeError } from '@/components/host/HostUI';

export const errorText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? e.message : fallback;

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

/**
 * Asks before recording a payment. A due the resident is paying online gets a
 * sterner question: marking it paid as well would collect twice.
 */
export function confirmPaid(d: Due, onConfirm: () => void) {
  const what = `${naira(dueTotal(d))} ${dueCategoryLabel(d.category).toLowerCase()} for ${d.unitLabel}`;
  if (d.status === 'processing') {
    Alert.alert(
      'They started paying online',
      `${d.residentName} opened an online payment for this due. Only mark it paid if you’ve confirmed they paid you another way, or they could be charged twice.`,
      [
        { text: 'Leave it', style: 'cancel' },
        { text: 'Mark paid anyway', style: 'destructive', onPress: onConfirm },
      ]
    );
    return;
  }
  Alert.alert('Record this payment?', `${what}. Use this for cash or a bank transfer.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Mark paid', onPress: onConfirm },
  ]);
}

/* ---------------------------------- rows ---------------------------------- */

export function HouseholdRow({ h }: { h: Household }) {
  const { colors, spacing } = useTheme();
  const inactive = h.status === 'inactive';
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/estate-household/[id]', params: { id: h.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${h.unitLabel}, ${h.residentName}${inactive ? ', inactive' : ''}${h.residentLinked ? ', has a GetRentos account' : ''}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : inactive ? 0.7 : 1,
          }}
        >
          <Avatar name={h.residentName} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                {h.unitLabel}
              </Text>
              {h.residentLinked ? <BadgeCheck size={14} color={colors.success} /> : null}
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {h.residentName}
              {h.contactPhone ? ` · ${h.contactPhone}` : ''}
            </Text>
          </View>
          {inactive ? <StatusPill label="Inactive" tone="neutral" /> : null}
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}

/**
 * A due as a line: who owes, what for, how much and how late. `onPaid` shows a
 * "Mark paid" action for dues still open.
 */
export function DueRow({
  d,
  onPaid,
  paying,
  showHousehold = true,
}: {
  d: Due;
  onPaid?: () => void;
  paying?: boolean;
  showHousehold?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const s = DUE_STATUS[d.status] ?? DUE_STATUS.pending;
  const total = dueTotal(d);
  const open = d.status !== 'paid' && d.status !== 'waived';
  return (
    <Card
      elevated
      accessible={!onPaid || !open}
      accessibilityLabel={`${showHousehold ? `${d.unitLabel}, ${d.residentName}, ` : ''}${dueCategoryLabel(d.category)}, ${Math.round(total).toLocaleString('en-NG')} naira, ${dueWhen(d)}`}
      style={{ gap: spacing.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {showHousehold ? d.unitLabel : dueCategoryLabel(d.category)}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={2}>
            {showHousehold ? `${d.residentName} · ${dueCategoryLabel(d.category)}` : null}
            {!showHousehold && d.description ? d.description : null}
            {showHousehold && d.description ? ` · ${d.description}` : null}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Price amount={total} variant="bodyStrong" />
          <StatusPill label={s.label} tone={s.tone} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          {dueWhen(d)}
          {d.lateFeeApplied ? ` · incl. ₦${d.lateFeeApplied.toLocaleString('en-NG')} late fee` : ''}
          {d.isRecurring ? ' · repeats' : ''}
        </Text>
        {onPaid && open ? (
          <Button
            label="Mark paid"
            size="sm"
            variant="secondary"
            fullWidth={false}
            loading={paying}
            icon={<Check size={14} color={colors.foreground} />}
            accessibilityLabel={`Mark ${d.unitLabel} ${dueCategoryLabel(d.category)} as paid`}
            onPress={onPaid}
          />
        ) : null}
      </View>
    </Card>
  );
}

export function AnnouncementCard({ a, onPress }: { a: Announcement; onPress?: () => void }) {
  const { colors, spacing } = useTheme();
  const urgent = a.priority === 'urgent';
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${urgent ? 'Urgent. ' : ''}${a.title}. ${a.body}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            gap: spacing.xs,
            opacity: pressed ? 0.92 : 1,
            borderLeftWidth: urgent ? 3 : 0,
            borderLeftColor: colors.destructive,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Megaphone size={15} color={urgent ? colors.destructive : colors.primary} />
            <Text variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
              {a.title}
            </Text>
            {urgent ? <StatusPill label="Urgent" tone="danger" /> : null}
          </View>
          <Text variant="callout" color="mutedForeground" numberOfLines={3}>
            {a.body}
          </Text>
        </Card>
      )}
    </Pressable>
  );
}

/* --------------------------------- sheets --------------------------------- */

export function EstateSwitcherSheet({
  open,
  onClose,
  estates,
  currentId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  estates: ManagedEstate[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your estates"
      footer={
        <Button
          label="Add another estate"
          variant="outline"
          icon={<Plus size={16} color={colors.foreground} />}
          onPress={() => {
            onClose();
            router.push('/(app)/estate-setup');
          }}
        />
      }
    >
      <View style={{ gap: spacing.xs }}>
        {estates.map((e) => {
          const current = e.id === currentId;
          return (
            <Pressable
              key={e.id}
              onPress={() => {
                void haptics.tap();
                onSelect(e.id);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              accessibilityLabel={`${e.name}, ${e.city}, ${e.householdCount} households`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{e.name}</Text>
                <Text variant="caption" color="mutedForeground">
                  {[e.city, e.state].filter(Boolean).join(', ')} · {e.householdCount} households
                </Text>
              </View>
              {current ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

/** Add a household, or edit one when `household` is given. */
export function HouseholdSheet({
  open,
  onClose,
  estateId,
  household,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  household?: Household;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={household ? 'Edit household' : 'Add a household'}>
      {open ? <HouseholdForm estateId={estateId} household={household} onDone={onClose} /> : null}
    </Sheet>
  );
}

function HouseholdForm({
  estateId,
  household,
  onDone,
}: {
  estateId: string;
  household?: Household;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [unitLabel, setUnitLabel] = useState(household?.unitLabel ?? '');
  const [residentName, setResidentName] = useState(household?.residentName ?? '');
  const [phone, setPhone] = useState(household?.contactPhone ?? '');
  const [email, setEmail] = useState(household?.contactEmail ?? '');
  const emailOk = !email.trim() || /^\S+@\S+\.\S+$/.test(email.trim());

  const save = useMutation({
    mutationFn: () => {
      const body = {
        unitLabel: unitLabel.trim(),
        residentName: residentName.trim(),
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
        ...(email.trim() ? { contactEmail: email.trim().toLowerCase() } : {}),
      };
      return household
        ? estateManagerApi.updateHousehold(estateId, household.id, body)
        : estateManagerApi.addHousehold(estateId, body);
    },
    onSuccess: (saved) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      qc.invalidateQueries({ queryKey: qk.estateManager.estates });
      toast.show(household ? 'Household updated.' : `${saved.unitLabel} added.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Unit"
        value={unitLabel}
        onChangeText={setUnitLabel}
        placeholder="Block A, Plot 12"
        autoFocus={!household}
        hint="How the gate and neighbours know the home"
      />
      <TextField label="Resident’s name" value={residentName} onChangeText={setResidentName} />
      <TextField
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextField
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailOk ? undefined : 'That email doesn’t look right.'}
      />
      {save.error ? (
        isUpgradeError(save.error) ? (
          <FormAlert
            tone="warning"
            title="Household limit reached"
            message={errorText(save.error, 'Upgrade to add more households.')}
          />
        ) : (
          <FormAlert message={errorText(save.error, 'Could not save this household.')} />
        )
      ) : null}
      <Button
        label={household ? 'Save changes' : 'Add household'}
        disabled={!unitLabel.trim() || !residentName.trim() || !emailOk}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      {save.error && isUpgradeError(save.error) ? (
        <Button
          label="See plans"
          variant="secondary"
          onPress={() => router.push('/(app)/billing')}
        />
      ) : null}
    </View>
  );
}

/** Tie a resident's GetRentos account to the household so they can pay and get passes. */
export function LinkResidentSheet({
  open,
  onClose,
  estateId,
  household,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  household: Household;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Link the resident’s account">
      {open ? (
        <LinkResidentForm estateId={estateId} household={household} onDone={onClose} />
      ) : null}
    </Sheet>
  );
}

function LinkResidentForm({
  estateId,
  household,
  onDone,
}: {
  estateId: string;
  household: Household;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState(household.contactEmail ?? '');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());
  const link = useMutation({
    mutationFn: () =>
      estateManagerApi.linkResident(estateId, household.id, email.trim().toLowerCase()),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.estate(estateId) });
      toast.show('Account linked. They can now pay dues and invite visitors.', 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Enter the email {household.residentName} uses on GetRentos. Once linked, they see this
        home’s dues, announcements and visitor passes in their own app.
      </Text>
      <TextField
        label="Resident’s GetRentos email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
      />
      {link.error ? (
        <FormAlert message={errorText(link.error, 'Could not link that account.')} />
      ) : null}
      <Button
        label="Link account"
        disabled={!valid}
        loading={link.isPending}
        onPress={() => link.mutate()}
      />
    </View>
  );
}

/** Post an announcement, or edit one when `announcement` is given. */
export function AnnouncementSheet({
  open,
  onClose,
  estateId,
  announcement,
  households,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  announcement?: Announcement;
  /** How many households will be told, for the confirmation line. */
  households?: number;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={announcement ? 'Edit announcement' : 'New announcement'}
    >
      {open ? (
        <AnnouncementForm
          estateId={estateId}
          announcement={announcement}
          households={households}
          onDone={onClose}
        />
      ) : null}
    </Sheet>
  );
}

function AnnouncementForm({
  estateId,
  announcement,
  households,
  onDone,
}: {
  estateId: string;
  announcement?: Announcement;
  households?: number;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>(
    announcement?.priority === 'urgent' ? 'URGENT' : 'NORMAL'
  );
  const [channels, setChannels] = useState<('SMS' | 'WHATSAPP')[]>([]);
  const toggle = (c: 'SMS' | 'WHATSAPP') =>
    setChannels((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));

  const save = useMutation({
    mutationFn: () => {
      const base = { title: title.trim(), body: body.trim(), priority };
      return announcement
        ? estateManagerApi.updateAnnouncement(estateId, announcement.id, base)
        : estateManagerApi.announce(estateId, {
            ...base,
            ...(channels.length ? { deliveryChannels: channels } : {}),
          });
    },
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.announcements(estateId) });
      toast.show(announcement ? 'Announcement updated.' : 'Sent to your residents.', 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        maxLength={150}
        autoFocus={!announcement}
      />
      <TextField
        label="Message"
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        hint={`${body.length.toLocaleString('en-NG')} / 5,000`}
      />
      <SegmentedControl
        accessibilityLabel="Priority"
        value={priority}
        onChange={setPriority}
        options={[
          { value: 'NORMAL', label: 'Normal' },
          { value: 'URGENT', label: 'Urgent' },
        ]}
      />
      {!announcement ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Also send by</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip label="SMS" selected={channels.includes('SMS')} onPress={() => toggle('SMS')} />
            <Chip
              label="WhatsApp"
              selected={channels.includes('WHATSAPP')}
              onPress={() => toggle('WHATSAPP')}
            />
          </View>
          <Text variant="caption" color="mutedForeground">
            Residents with the app always get a notification. SMS and WhatsApp also go to every
            active household with a phone number on file
            {households ? ` (${households.toLocaleString('en-NG')} households in all)` : ''}; a long
            notice is shortened for SMS.
          </Text>
        </View>
      ) : (
        <Text variant="caption" color="mutedForeground">
          Editing changes what residents see; it doesn’t notify them again.
        </Text>
      )}
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not send this announcement.')} />
      ) : null}
      <Button
        label={
          announcement ? 'Save changes' : priority === 'URGENT' ? 'Send urgent notice' : 'Send'
        }
        disabled={title.trim().length < 3 || body.trim().length < 3}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
