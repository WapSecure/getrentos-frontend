import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, ChevronRight, Clock, Siren, Wrench } from 'lucide-react-native';
import { Card, Text, useTheme } from '@getrentos/ui-native';
import {
  STATUS_LABEL,
  categoryLabel,
  slaState,
  type Priority,
  type WorkOrder,
  type WorkOrderStatus,
} from '@/lib/api/homeCare';
import { haptics } from '@/lib/haptics';
import { StatusPill, type Tone } from '@/components/host/HostUI';

export const STATUS_TONE: Record<WorkOrderStatus, Tone> = {
  SUBMITTED: 'warning',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CANCELLED: 'neutral',
};

export function PriorityTag({ p }: { p: Priority }) {
  const { colors, radius } = useTheme();
  const c =
    p === 'URGENT'
      ? { fg: colors.destructive, bg: colors.destructiveSubtle }
      : p === 'HIGH'
        ? { fg: colors.warning, bg: colors.warningSubtle }
        : { fg: colors.mutedForeground, bg: colors.secondary };
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.sm,
        backgroundColor: c.bg,
      }}
    >
      <Text variant="caption" style={{ color: c.fg, fontWeight: '800', letterSpacing: 0.4 }}>
        {p}
      </Text>
    </View>
  );
}

/** A work order at a glance: what, where, how urgent, and whether its clock is running out. */
export function WorkOrderCard({ w }: { w: WorkOrder }) {
  const { colors, spacing } = useTheme();
  const sla = slaState(w);
  const where = [w.unit.property?.title, w.unit.unitName].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => {
        void haptics.tap();
        router.push({ pathname: '/(app)/home-care/work-order/[id]', params: { id: w.id } });
      }}
      accessibilityRole="button"
      accessibilityLabel={`${w.isEmergency ? 'Emergency. ' : ''}${w.issueTitle}, ${w.priority} priority, ${STATUS_LABEL[w.status]}, ${where}${sla ? `. ${sla.label}` : ''}`}
    >
      {({ pressed }) => (
        <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
            {w.isEmergency ? (
              <Siren size={18} color={colors.destructive} style={{ marginTop: 2 }} />
            ) : (
              <Wrench size={18} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" numberOfLines={2}>
                {w.issueTitle}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {categoryLabel(w.category)}
                {where ? ` · ${where}` : ''}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: spacing.sm,
            }}
          >
            <StatusPill label={STATUS_LABEL[w.status]} tone={STATUS_TONE[w.status]} />
            <PriorityTag p={w.priority} />
            {w.approvalRequired && !w.approvedAt ? (
              <StatusPill label="Needs approval" tone="warning" />
            ) : null}
          </View>
          {sla ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {sla.overdue ? (
                <AlertTriangle size={14} color={colors.destructive} />
              ) : (
                <Clock size={14} color={colors.mutedForeground} />
              )}
              <Text
                variant="caption"
                style={{
                  color: sla.overdue ? colors.destructive : colors.mutedForeground,
                  fontWeight: sla.overdue ? '700' : '400',
                }}
              >
                {sla.label}
              </Text>
            </View>
          ) : null}
          {w.assignedVendor?.name ? (
            <Text variant="caption" color="mutedForeground">
              Vendor: {w.assignedVendor.name}
            </Text>
          ) : null}
        </Card>
      )}
    </Pressable>
  );
}
