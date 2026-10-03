import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  UserPlus,
} from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  FormAlert,
  Price,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  OFFER_STATUS,
  VIEWING_STATUS,
  currentAmount,
  leadStage,
  listingTitle,
  localInstant,
  realtorApi,
  vsAsking,
  whatsappLink,
  type RealtorLead,
  type RealtorOffer,
  type RealtorViewing,
} from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatTime, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { Sheet } from '@/components/Sheet';
import { StatusPill } from '@/components/host/HostUI';

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/* ---------------------------------- cards --------------------------------- */

export function LeadCard({ lead }: { lead: RealtorLead }) {
  const { colors, spacing } = useTheme();
  const stage = leadStage(lead.status);
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/realtor-lead/[id]', params: { id: lead.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${lead.fullName}, ${stage.label}, ${lead.listing?.listingTitle ?? 'no listing yet'}, ${relativeTime(lead.createdAt)}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {lead.fullName}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {lead.listing?.listingTitle ?? 'Not linked to a listing'} ·{' '}
              {relativeTime(lead.createdAt)}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <StatusPill label={stage.label} tone={stage.tone} />
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}

/** A viewing as a line in a day plan: when, where, with whom, and its state. */
export function ViewingRow({
  v,
  onPress,
  showDate = true,
}: {
  v: RealtorViewing;
  onPress?: () => void;
  showDate?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const s = VIEWING_STATUS[v.status];
  const where = v.listing.listingTitle || v.listing.property.title;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${formatDate(v.scheduledAt, 'medium')} at ${formatTime(v.scheduledAt)}, ${where}${v.lead ? ` with ${v.lead.fullName}` : ''}, ${s.label}`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View
            style={{
              width: 56,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.accent,
              alignItems: 'center',
            }}
          >
            <Text variant="bodyStrong" style={{ color: colors.accentForeground }}>
              {formatTime(v.scheduledAt)}
            </Text>
            {showDate ? (
              <Text variant="caption" style={{ color: colors.accentForeground }}>
                {formatDate(v.scheduledAt, 'short')}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {where}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {v.lead ? `With ${v.lead.fullName}` : 'No lead attached'}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <StatusPill label={s.label} tone={s.tone} />
            </View>
          </View>
          {onPress ? <ChevronRight size={18} color={colors.mutedForeground} /> : null}
        </Card>
      )}
    </Pressable>
  );
}

export function OfferCard({ o }: { o: RealtorOffer }) {
  const { colors, spacing } = useTheme();
  const s = OFFER_STATUS[o.status];
  const amount = currentAmount(o);
  const gap = vsAsking(amount, o.listing.price);
  const title = o.listing.listingTitle || o.listing.property.title;
  const buyer = o.buyer.legalName || o.buyer.email;
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/realtor-offer/[id]', params: { id: o.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${buyer} on ${title}, ${Math.round(amount).toLocaleString('en-NG')} naira${gap ? `, ${gap}` : ''}, ${s.label}`}
    >
      {({ pressed }) => (
        <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {title}
            </Text>
            <StatusPill label={s.label} tone={s.tone} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
            <Price amount={amount} variant="heading" />
            {gap ? (
              <Text variant="caption" color="mutedForeground">
                {gap}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }} numberOfLines={1}>
              {buyer} · {relativeTime(o.createdAt)}
            </Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

/** Call, WhatsApp and email, each shown only when the lead gave that contact. */
export function ContactActions({
  phone,
  email,
  name,
}: {
  phone?: string | null;
  email?: string | null;
  name: string;
}) {
  const { colors, spacing } = useTheme();
  const wa = whatsappLink(phone);
  const actions = [
    phone
      ? { key: 'call', label: 'Call', Icon: Phone, url: `tel:${phone.replace(/\s/g, '')}` }
      : null,
    wa ? { key: 'wa', label: 'WhatsApp', Icon: MessageCircle, url: wa } : null,
    email ? { key: 'email', label: 'Email', Icon: Mail, url: `mailto:${email}` } : null,
  ].filter(Boolean) as { key: string; label: string; Icon: typeof Phone; url: string }[];
  if (!actions.length)
    return (
      <Text variant="caption" color="mutedForeground">
        No phone or email on file for {name}.
      </Text>
    );
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {actions.map(({ key, label, Icon, url }) => (
        <Button
          key={key}
          label={label}
          variant="secondary"
          size="sm"
          icon={<Icon size={16} color={colors.foreground} />}
          accessibilityLabel={`${label} ${name}`}
          onPress={() => {
            void haptics.tap();
            void Linking.openURL(url);
          }}
          style={{ flex: 1 }}
        />
      ))}
    </View>
  );
}

/* --------------------------------- sheets --------------------------------- */

export function AddLeadSheet({
  open,
  onClose,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  /** Start with this listing picked, e.g. when adding from a listing. */
  listingId?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="New lead">
      {open ? <AddLeadForm onDone={onClose} initialListingId={listingId} /> : null}
    </Sheet>
  );
}

function AddLeadForm({
  onDone,
  initialListingId,
}: {
  onDone: () => void;
  initialListingId?: string;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const listings = useQuery({
    queryKey: qk.realtor.listings,
    queryFn: () => realtorApi.listings(),
  });
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [listingId, setListingId] = useState(initialListingId ?? '');
  const [notes, setNotes] = useState('');
  const emailOk = !email.trim() || /^\S+@\S+\.\S+$/.test(email.trim());
  const save = useMutation({
    mutationFn: () =>
      realtorApi.createLead({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        listingId: listingId || undefined,
        notes: notes.trim() || undefined,
        source: 'mobile',
      }),
    onSuccess: (lead) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show(`${lead.fullName} added to your pipeline.`, 'success');
      onDone();
    },
  });
  const live = listings.data?.items.filter((l) => l.status !== 'CLOSED') ?? [];
  return (
    <View style={{ gap: spacing.md }}>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} autoFocus />
      <TextField
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        hint="So you can call or WhatsApp them from here"
      />
      <TextField
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailOk ? undefined : 'That email doesn’t look right.'}
      />
      {live.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Interested in</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Chip
              label="Not sure yet"
              size="sm"
              selected={!listingId}
              onPress={() => setListingId('')}
            />
            {live.map((l) => (
              <Chip
                key={l.id}
                label={listingTitle(l)}
                size="sm"
                selected={listingId === l.id}
                onPress={() => setListingId(l.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        hint="Budget, timing, what they’re looking for"
      />
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not add this lead.')} />
      ) : null}
      <Button
        label="Add lead"
        icon={<UserPlus size={16} color={colors.primaryForeground} />}
        disabled={fullName.trim().length < 2 || !emailOk}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

/**
 * Book a viewing. A lead tied to a listing books that listing; otherwise the
 * realtor picks one of their listings.
 */
export function ScheduleViewingSheet({
  open,
  onClose,
  lead,
  listingId,
}: {
  open: boolean;
  onClose: () => void;
  lead?: RealtorLead;
  /** Start with this listing picked, e.g. when booking from a listing. */
  listingId?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Schedule a viewing">
      {open ? (
        <ScheduleViewingForm lead={lead} initialListingId={listingId} onDone={onClose} />
      ) : null}
    </Sheet>
  );
}

function ScheduleViewingForm({
  lead,
  initialListingId,
  onDone,
}: {
  lead?: RealtorLead;
  initialListingId?: string;
  onDone: () => void;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const listings = useQuery({
    queryKey: qk.realtor.listings,
    queryFn: () => realtorApi.listings(),
  });
  const [listingId, setListingId] = useState(lead?.listingId ?? initialListingId ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  // When the sheet opened; close enough to "now" for judging a past time.
  const [openedAt] = useState(() => Date.now());
  const when = localInstant(date, time);
  const inPast = !!when && new Date(when).getTime() < openedAt;
  const save = useMutation({
    mutationFn: () =>
      realtorApi.createViewing({
        listingId,
        leadId: lead?.id,
        scheduledAt: when!,
        notes: notes.trim() || undefined,
      }),
    onSuccess: async () => {
      void haptics.success();
      // Booking a viewing is what qualifies a lead that was only contacted.
      if (lead && (lead.status === 'NEW' || lead.status === 'CONTACTED')) {
        await realtorApi.updateLead(lead.id, 'QUALIFIED').catch(() => undefined);
      }
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show(`Viewing booked for ${formatDate(when!, 'medium')} at ${time}.`, 'success');
      onDone();
    },
  });
  const choices = listings.data?.items.filter((l) => l.status !== 'CLOSED') ?? [];
  const lockedToLead = !!lead?.listingId;
  return (
    <View style={{ gap: spacing.md }}>
      {lead ? (
        <Text variant="callout" color="mutedForeground">
          With {lead.fullName}
          {lead.listing?.listingTitle ? ` at ${lead.listing.listingTitle}` : ''}
        </Text>
      ) : null}
      {!lockedToLead ? (
        choices.length ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">Which listing</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {choices.map((l) => (
                <Chip
                  key={l.id}
                  label={listingTitle(l)}
                  size="sm"
                  selected={listingId === l.id}
                  onPress={() => setListingId(l.id)}
                />
              ))}
            </View>
          </View>
        ) : (
          <FormAlert
            tone="info"
            message="You need a listing first. Create one from a client’s property."
          />
        )
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="Time" value={time} onChange={setTime} />
        </View>
      </View>
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        hint="Gate code, who to ask for, what to bring"
      />
      {inPast ? <FormAlert tone="warning" message="That time has already passed." /> : null}
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not book this viewing.')} />
      ) : null}
      <Button
        label="Book viewing"
        icon={<CalendarClock size={16} color={colors.primaryForeground} />}
        disabled={!listingId || !when || inPast}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

/** Invite an owner or landlord by email, confirming who they are before sending. */
export function InviteClientSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Invite a client">
      {open ? <InviteClientForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function InviteClientForm({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());
  const check = useMutation({
    mutationFn: () => realtorApi.checkClient(email.trim().toLowerCase()),
  });
  const invite = useMutation({
    mutationFn: () => realtorApi.inviteClient(email.trim().toLowerCase()),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.realtor.clients });
      toast.show('Invite sent. They approve it from their account.', 'success');
      onDone();
    },
  });
  const c = check.data;
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Owners and landlords on GetRentos can let you represent their properties. They approve your
        invite, then choose which properties you handle.
      </Text>
      <TextField
        label="Client’s email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          check.reset();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
      />
      {c ? (
        !c.exists ? (
          <FormAlert
            tone="info"
            message="No GetRentos account uses that email. Ask them to sign up as an owner or landlord first."
          />
        ) : !c.isEligible ? (
          <FormAlert
            tone="warning"
            message="That account isn’t an owner or landlord, so it can’t be your client."
          />
        ) : (
          <FormAlert tone="success" message={`Found ${c.name ?? 'their account'}.`} />
        )
      ) : null}
      {check.error || invite.error ? (
        <FormAlert message={errorText(invite.error ?? check.error, 'Could not send the invite.')} />
      ) : null}
      {c?.isEligible ? (
        <Button
          label={`Invite ${c.name ?? 'client'}`}
          loading={invite.isPending}
          onPress={() => invite.mutate()}
        />
      ) : (
        <Button
          label="Look them up"
          variant="secondary"
          disabled={!valid}
          loading={check.isPending}
          onPress={() => check.mutate()}
        />
      )}
    </View>
  );
}
