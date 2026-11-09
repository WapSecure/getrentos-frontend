import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, FileText, Plus, Send } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DateField,
  FormAlert,
  IconButton,
  ListSkeleton,
  QueryState,
  SegmentedControl,
  SwitchRow,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  AUDIENCE_LABEL,
  AUDIENCES,
  automationsApi,
  broadcastBlocker,
  CADENCE_LABEL,
  CADENCES,
  EMPTY_RULE,
  MERGE_FIELDS,
  recipients,
  ruleBlocker,
  rulePayload,
  ruleToForm,
  TRIGGER_LABEL,
  TRIGGERS,
  type AnnouncementTemplate,
  type AutomationRule,
  type BroadcastAudience,
  type RuleForm,
} from '@/lib/api/automations';
import { errorMessage } from '@/lib/api/client';
import { planRefusal, retryUnlessPlanGate } from '@/lib/api/estateGate';
import { formatDate } from '@/lib/format';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { useMyHomes } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Tab = 'send' | 'rules' | 'templates';
const TABS: { value: Tab; label: string }[] = [
  { value: 'send', label: 'Send' },
  { value: 'rules', label: 'Rules' },
  { value: 'templates', label: 'Templates' },
];

const mergeHint = `Merge fields: ${MERGE_FIELDS.join(', ')}`;

export default function LandlordAutomations() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('send');
  const [editingRule, setEditingRule] = useState<AutomationRule | 'new' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<AnnouncementTemplate | 'new' | null>(null);

  const rules = useQuery({
    queryKey: qk.automations.rules,
    queryFn: automationsApi.rules,
    retry: retryUnlessPlanGate,
  });
  const templates = useQuery({
    queryKey: qk.automations.templates,
    queryFn: automationsApi.templates,
    retry: retryUnlessPlanGate,
  });
  // Automations are Pro: a Free landlord gets the upgrade, not a retry that can't work.
  const locked = !!planRefusal(rules.error) || !!planRefusal(templates.error);
  const active = tab === 'rules' ? rules : templates;

  const add =
    tab === 'rules'
      ? () => setEditingRule('new')
      : tab === 'templates'
        ? () => setEditingTemplate('new')
        : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Tenants"
        title="Automations"
        subtitle="Broadcasts, rules and templates"
        onBack={() => goBack()}
        accessory={
          add && !locked ? (
            <IconButton
              onPress={add}
              accessibilityLabel={tab === 'rules' ? 'New rule' : 'New template'}
              icon={<Plus size={20} color={colors.primary} />}
            />
          ) : null
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          tab === 'send' || locked ? undefined : (
            <RefreshControl
              refreshing={active.isRefetching}
              onRefresh={() => void active.refetch()}
              tintColor={colors.mutedForeground}
            />
          )
        }
      >
        {locked ? (
          <ProUpsell
            title="Automations are part of Pro"
            description="Reach every tenant at once, and let reminders send themselves."
            perks={[
              'Announcements to all tenants, one property, or those in arrears',
              'Rules that message a tenant when rent is due, overdue or a lease is ending',
              'Saved templates with the tenant’s name and property filled in',
            ]}
            note={null}
          />
        ) : (
          <>
            <SegmentedControl
              options={TABS}
              value={tab}
              onChange={setTab}
              accessibilityLabel="Automations section"
            />
            {tab === 'send' ? (
              <Broadcast templates={templates.data ?? []} />
            ) : tab === 'rules' ? (
              <Rules
                query={rules}
                onEdit={(r) => setEditingRule(r)}
                onNew={() => setEditingRule('new')}
              />
            ) : (
              <Templates
                query={templates}
                onEdit={(t) => setEditingTemplate(t)}
                onNew={() => setEditingTemplate('new')}
              />
            )}
          </>
        )}
      </ScrollView>

      <Sheet
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        title={editingRule === 'new' ? 'New automation rule' : 'Edit rule'}
      >
        {editingRule ? (
          <RuleEditor
            key={editingRule === 'new' ? 'new' : editingRule.id}
            rule={editingRule === 'new' ? null : editingRule}
            onDone={() => setEditingRule(null)}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title={editingTemplate === 'new' ? 'New template' : 'Edit template'}
      >
        {editingTemplate ? (
          <TemplateEditor
            key={editingTemplate === 'new' ? 'new' : editingTemplate.id}
            template={editingTemplate === 'new' ? null : editingTemplate}
            onDone={() => setEditingTemplate(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Broadcast({ templates }: { templates: AnnouncementTemplate[] }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const homes = useMyHomes();
  const [audience, setAudience] = useState<BroadcastAudience>('ALL_TENANTS');
  const [propertyId, setPropertyId] = useState('');
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const input = {
    audience,
    ...(audience === 'PROPERTY' ? { propertyId } : {}),
    title: title.trim(),
    body: body.trim(),
  };
  const blocker = broadcastBlocker({ ...input, propertyId });

  const send = useMutation({
    mutationFn: () => automationsApi.broadcast(input),
    onSuccess: ({ recipientCount }) => {
      if (recipientCount === 0) {
        toast.show('No tenants matched that audience.', 'error');
        return;
      }
      toast.show(`Sent to ${recipients(recipientCount)}.`, 'success');
      setTitle('');
      setBody('');
      setTemplateId(undefined);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send.'), 'error'),
  });

  const confirm = () => {
    const who =
      audience === 'PROPERTY'
        ? `the tenants of ${homes.data?.find((h) => h.id === propertyId)?.name ?? 'that property'}`
        : audience === 'IN_ARREARS'
          ? 'every tenant in arrears'
          : 'all your tenants';
    Alert.alert('Send this announcement?', `It goes to ${who}, in the app and by email.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => send.mutate() },
    ]);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        Message a group of tenants at once. Each tenant gets it in the app and by email.
      </Text>
      <ChipSelect
        label="Who it goes to"
        options={AUDIENCES}
        value={audience}
        onChange={setAudience}
      />
      {audience === 'PROPERTY' ? (
        <ChipSelect
          label="Property"
          options={(homes.data ?? []).map((h) => ({ value: h.id, label: h.name }))}
          value={propertyId || undefined}
          onChange={setPropertyId}
          emptyText={homes.isLoading ? 'Loading properties…' : 'No properties.'}
        />
      ) : null}
      {templates.length > 0 ? (
        <ChipSelect
          label="Start from a template (optional)"
          options={templates.map((t) => ({ value: t.id, label: t.title }))}
          value={templateId}
          onChange={(id) => {
            const t = templates.find((x) => x.id === id);
            if (!t) return;
            setTemplateId(id);
            setTitle(t.title);
            setBody(t.content);
          }}
        />
      ) : null}
      <TextField
        label="Title"
        placeholder="Water supply notice"
        value={title}
        onChangeText={setTitle}
        required
      />
      <TextField
        label="Message"
        placeholder="Hi {{tenant_name}}, a quick notice about {{property}}…"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={5}
        hint={mergeHint}
        required
      />
      <Button
        label="Send announcement"
        icon={<Send size={16} color={colors.primaryForeground} />}
        loading={send.isPending}
        disabled={!!blocker || send.isPending}
        onPress={confirm}
      />
    </View>
  );
}

type ListQuery<T> = {
  data: T[] | undefined;
  isError: boolean;
  refetch: () => unknown;
};

function Rules({
  query,
  onEdit,
  onNew,
}: {
  query: ListQuery<AutomationRule>;
  onEdit: (r: AutomationRule) => void;
  onNew: () => void;
}) {
  const { colors, spacing } = useTheme();
  const rules = query.data ?? [];
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Send automatically, on a schedule or when rent is due, overdue or a lease is ending.
      </Text>
      <QueryState
        query={query}
        skeleton={<ListSkeleton rows={2} variant="card" height={120} />}
        isEmpty={rules.length === 0}
        empty={{
          icon: <CalendarClock size={32} color={colors.mutedForeground} />,
          title: 'No automation rules yet',
          description:
            'Message all tenants monthly, or chase a tenant automatically when their rent goes overdue.',
          action: <Button label="New rule" onPress={onNew} />,
        }}
      >
        {rules.map((r) => (
          <RuleCard key={r.id} rule={r} onEdit={() => onEdit(r)} />
        ))}
      </QueryState>
    </View>
  );
}

function RuleCard({ rule: r, onEdit }: { rule: AutomationRule; onEdit: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.automations.rules });

  const toggle = useOptimisticMutation({
    mutationFn: (enabled: boolean) => automationsApi.updateRule(r.id, { enabled }),
    patches: () => [
      {
        queryKey: qk.automations.rules,
        update: (old, enabled) =>
          (old as AutomationRule[]).map((x) => (x.id === r.id ? { ...x, enabled } : x)),
      },
    ],
    errorMessage: 'Could not update the rule.',
  });
  const run = useMutation({
    mutationFn: () => automationsApi.runRule(r.id),
    onSuccess: ({ recipientCount }) => {
      invalidate();
      toast.show(`Sent to ${recipients(recipientCount)}.`, 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not run the rule.'), 'error'),
  });
  const remove = useMutation({
    mutationFn: () => automationsApi.deleteRule(r.id),
    onSuccess: () => {
      invalidate();
      toast.show('Rule removed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not remove the rule.'), 'error'),
  });

  const scheduled = r.trigger === 'SCHEDULE';
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">{r.name}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Badge label={TRIGGER_LABEL[r.trigger]} tone="info" />
        {scheduled && r.audience ? (
          <Badge label={AUDIENCE_LABEL[r.audience]} tone="neutral" />
        ) : null}
        {scheduled && r.cadence ? <Badge label={CADENCE_LABEL[r.cadence]} tone="neutral" /> : null}
        {!r.enabled ? <Badge label="Paused" tone="warning" /> : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        {scheduled
          ? `Next run ${r.nextRunAt ? formatDate(r.nextRunAt) : '—'}`
          : 'Sends to the tenant when it happens'}
        {r.lastRunAt
          ? ` · last sent to ${recipients(r.lastRecipientCount ?? 0)} on ${formatDate(r.lastRunAt, 'short')}`
          : ' · not run yet'}
      </Text>
      <SwitchRow
        label={r.enabled ? 'On' : 'Paused'}
        accessibilityLabel={`Enable ${r.name}`}
        value={r.enabled}
        onValueChange={(v) => toggle.mutate(v)}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {scheduled ? (
          <Button
            label="Run now"
            size="sm"
            variant="secondary"
            loading={run.isPending}
            disabled={run.isPending}
            onPress={() =>
              Alert.alert(`Run “${r.name}” now?`, 'It sends to its audience straight away.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send now', onPress: () => run.mutate() },
              ])
            }
          />
        ) : null}
        <Button label="Edit" size="sm" variant="secondary" onPress={onEdit} />
        <Button
          label="Delete"
          size="sm"
          variant="ghost"
          loading={remove.isPending}
          onPress={() =>
            Alert.alert(`Delete “${r.name}”?`, 'It stops sending.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
            ])
          }
        />
      </View>
    </Card>
  );
}

function RuleEditor({ rule, onDone }: { rule: AutomationRule | null; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [form, setForm] = useState<RuleForm>(rule ? ruleToForm(rule) : EMPTY_RULE);
  const set =
    <K extends keyof RuleForm>(key: K) =>
    (value: RuleForm[K]) =>
      setForm((f) => ({ ...f, [key]: value }));
  const properties = (homes.data ?? []).map((h) => ({ value: h.id, label: h.name }));
  const blocker = ruleBlocker(form);

  const save = useMutation({
    mutationFn: () =>
      rule
        ? automationsApi.updateRule(rule.id, rulePayload(form, true))
        : automationsApi.createRule(rulePayload(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.automations.rules });
      toast.show(rule ? 'Rule updated.' : 'Rule created.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the rule.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        On a schedule it broadcasts to an audience; on an event it messages the tenant the event is
        about.
      </Text>
      <TextField
        label="Rule name"
        placeholder="Monthly rent reminder"
        value={form.name}
        onChangeText={set('name')}
        required
      />
      <ChipSelect
        label={rule ? 'When (fixed once the rule exists)' : 'When'}
        options={TRIGGERS}
        value={form.trigger}
        onChange={set('trigger')}
        disabled={!!rule}
      />
      {form.trigger === 'SCHEDULE' ? (
        <>
          <ChipSelect
            label="Who it goes to"
            options={AUDIENCES}
            value={form.audience}
            onChange={set('audience')}
          />
          {form.audience === 'PROPERTY' ? (
            <ChipSelect
              label="Property"
              options={properties}
              value={form.propertyId || undefined}
              onChange={set('propertyId')}
            />
          ) : null}
          <ChipSelect
            label="Repeat"
            options={CADENCES}
            value={form.cadence}
            onChange={set('cadence')}
          />
          <DateField
            label="First run"
            value={form.firstRunAt}
            onChange={set('firstRunAt')}
            min={toISODate(new Date())}
            required
          />
        </>
      ) : (
        <ChipSelect
          label="Which properties"
          options={[{ value: '', label: 'All properties' }, ...properties]}
          value={form.propertyId}
          onChange={set('propertyId')}
        />
      )}
      <TextField label="Title" value={form.title} onChangeText={set('title')} required />
      <TextField
        label="Message"
        value={form.body}
        onChangeText={set('body')}
        multiline
        numberOfLines={4}
        hint={mergeHint}
        required
      />
      <SwitchRow
        label="On"
        description="A paused rule keeps its settings and sends nothing."
        value={form.enabled}
        onValueChange={set('enabled')}
      />
      {blocker && form.name ? (
        <Text variant="caption" color="mutedForeground">
          {blocker}
        </Text>
      ) : null}
      <Button
        label="Save rule"
        loading={save.isPending}
        disabled={!!blocker || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function Templates({
  query,
  onEdit,
  onNew,
}: {
  query: ListQuery<AnnouncementTemplate>;
  onEdit: (t: AnnouncementTemplate) => void;
  onNew: () => void;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const remove = useMutation({
    mutationFn: (id: string) => automationsApi.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.automations.templates });
      toast.show('Template deleted.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not delete the template.'), 'error'),
  });

  const templates = query.data ?? [];
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Reusable messages to start a broadcast from.
      </Text>
      <QueryState
        query={query}
        skeleton={<ListSkeleton rows={2} variant="card" height={100} />}
        isEmpty={templates.length === 0}
        empty={{
          icon: <FileText size={32} color={colors.mutedForeground} />,
          title: 'No templates yet',
          description: 'Save a message once and reuse it for reminders, notices and announcements.',
          action: <Button label="New template" onPress={onNew} />,
        }}
      >
        {templates.map((t) => (
          <Card key={t.id} padding={spacing.lg} style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong">{t.title}</Text>
            <Text variant="callout" color="mutedForeground" numberOfLines={6}>
              {t.content}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Edit" size="sm" variant="secondary" onPress={() => onEdit(t)} />
              <Button
                label="Delete"
                size="sm"
                variant="ghost"
                loading={remove.isPending && remove.variables === t.id}
                onPress={() =>
                  Alert.alert(`Delete “${t.title}”?`, undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(t.id) },
                  ])
                }
              />
            </View>
          </Card>
        ))}
      </QueryState>
    </View>
  );
}

function TemplateEditor({
  template,
  onDone,
}: {
  template: AnnouncementTemplate | null;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState(template?.title ?? '');
  const [content, setContent] = useState(template?.content ?? '');
  const input = { title: title.trim(), content: content.trim() };

  const save = useMutation({
    mutationFn: () =>
      template
        ? automationsApi.updateTemplate(template.id, input)
        : automationsApi.createTemplate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.automations.templates });
      toast.show(template ? 'Template updated.' : 'Template saved.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the template.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField label="Title" value={title} onChangeText={setTitle} required />
      <TextField
        label="Message"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={5}
        hint={mergeHint}
        required
      />
      {template ? null : (
        <FormAlert tone="info" message="Templates are offered when you send an announcement." />
      )}
      <Button
        label={template ? 'Save changes' : 'Save template'}
        loading={save.isPending}
        disabled={!input.title || !input.content || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
