'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, SlidersHorizontal } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  ListSkeleton,
  PageErrorState,
  Textarea,
  ToggleChip,
  type ToastVariant,
} from '@sureground/ui';
import { ApiError, formatDateTime, formatRelativeTime, unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { adminKeys } from '@/lib/queryKeys';
import {
  ALL_PERMISSIONS,
  NIGERIAN_STATES,
  PERMISSION_LABELS,
  ROLE_ONLY_PERMISSIONS,
} from '@/lib/adminAccess';
import type { AdminPermission, AdminStaffMember, StaffAccess } from '@/types/admin';

const MIN_REASON_LENGTH = 10;

const AREA_LABELS: Record<string, string> = {
  dashboard: 'Dashboard and reports',
  reports: 'Dashboard and reports',
  data: 'Dashboard and reports',
  cases: 'Dashboard and reports',
  audit: 'Dashboard and reports',
  users: 'Users',
  kyc: 'Identity and business checks',
  properties: 'Property checks',
  land: 'Land',
  disputes: 'Disputes',
  fraud: 'Fraud',
  escrow: 'Sale deposits',
  sales: 'Sales and professionals',
  professionals: 'Sales and professionals',
  rentals: 'Rentals and rent money',
  rentfinance: 'Rentals and rent money',
  shortlet: 'Shortlets',
  maintenance: 'Maintenance and estates',
  estate: 'Maintenance and estates',
  managed: 'Managed properties',
  collections: 'Managed properties',
  subscriptions: 'Subscriptions',
  support: 'Messages and documents',
  conversations: 'Messages and documents',
  documents: 'Messages and documents',
  diaspora: 'Messages and documents',
  ai: 'Platform',
  platform: 'Platform',
  staff: 'Staff administration',
};

const PERMISSION_GROUPS = ALL_PERMISSIONS.reduce<
  { label: string; permissions: AdminPermission[] }[]
>((groups, permission) => {
  const label = AREA_LABELS[permission.split('.')[0]] ?? 'Other';
  const group = groups.find((entry) => entry.label === label);
  if (group) group.permissions.push(permission);
  else groups.push({ label, permissions: [permission] });
  return groups;
}, []);

interface StaffAccessModalProps {
  member: AdminStaffMember | null;
  onOpenChange: (open: boolean) => void;
  notify: (message: string, variant: ToastVariant) => void;
}

export const StaffAccessModal = ({ member, onOpenChange, notify }: StaffAccessModalProps) => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.staffAccess(member?.id ?? ''),
    queryFn: () => unwrap(adminService.getStaffAccess(member!.id)),
    enabled: Boolean(member),
  });

  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent size="xl" padded={false}>
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="font-semibold text-foreground">
            Access for {member?.legalName}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Their role sets what they can do. Here you can add or remove single permissions, and
            limit them to the states whose cases they handle. Removing access applies at once;
            adding access waits for another super admin.
          </DialogDescription>

          <div className="mt-5">
            {isLoading ? (
              <ListSkeleton rows={4} label="Loading access" />
            ) : isError || !data ? (
              <PageErrorState
                title="Access unavailable"
                description="Their current access could not be loaded, so nothing can be changed yet."
                onRetry={() => refetch()}
                isRetrying={isFetching}
                className="min-h-64 border-0"
              />
            ) : (
              <StaffAccessForm
                key={JSON.stringify(data)}
                access={data}
                onClose={() => onOpenChange(false)}
                notify={notify}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StaffAccessForm = ({
  access,
  onClose,
  notify,
}: {
  access: StaffAccess;
  onClose: () => void;
  notify: (message: string, variant: ToastVariant) => void;
}) => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<AdminPermission>>(
    () => new Set(access.effectivePermissions)
  );
  const [regions, setRegions] = useState<string[]>(access.regions);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState(access.grantsExpireAt ? lagosDay(access.grantsExpireAt) : '');
  const [untilBounds] = useState(() => ({
    min: lagosDay(new Date(Date.now() + 86_400_000).toISOString()),
    max: lagosDay(new Date(Date.now() + 90 * 86_400_000).toISOString()),
  }));
  const [error, setError] = useState<string | null>(null);

  const roleDefaults = useMemo(() => new Set(access.roleDefaults), [access.roleDefaults]);
  const current = useMemo(
    () => new Set(access.effectivePermissions),
    [access.effectivePermissions]
  );

  const granted = ALL_PERMISSIONS.filter((p) => selected.has(p) && !roleDefaults.has(p));
  const revoked = ALL_PERMISSIONS.filter((p) => !selected.has(p) && roleDefaults.has(p));
  const widensPermissions = ALL_PERMISSIONS.some((p) => selected.has(p) && !current.has(p));
  const widensRegions =
    access.regions.length > 0 &&
    (regions.length === 0 || regions.some((state) => !access.regions.includes(state)));
  const savedUntil = access.grantsExpireAt ? lagosDay(access.grantsExpireAt) : '';
  // Keeping extra permissions for longer is more access, as the server judges it too.
  const extendsGrants =
    granted.length > 0 && savedUntil !== '' && (until === '' || until > savedUntil);
  const widens = widensPermissions || widensRegions || extendsGrants;
  const changed =
    (granted.length > 0 && until !== savedUntil) ||
    ALL_PERMISSIONS.some((p) => selected.has(p) !== current.has(p)) ||
    regions.length !== access.regions.length ||
    regions.some((state) => !access.regions.includes(state));
  const pending = access.pendingRequest;

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        adminService.updateStaffAccess(access.staffId, {
          grantedPermissions: granted,
          revokedPermissions: revoked,
          regions,
          grantsExpireAt: granted.length && until ? `${until}T23:59:59+01:00` : null,
          reason: reason.trim(),
        })
      ),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staffAccess(access.staffId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.changeRequests });
      notify(
        result.status === 'PENDING_APPROVAL'
          ? `Sent for approval. ${access.legalName}'s wider access applies once another super admin approves it.`
          : `${access.legalName}'s access is narrowed. It applies from their next action.`,
        result.status === 'PENDING_APPROVAL' ? 'info' : 'success'
      );
      onClose();
    },
    onError: (err) =>
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Their access could not be changed.'
      ),
  });

  const toggle = (permission: AdminPermission, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(permission);
      else next.delete(permission);
      return next;
    });

  const toggleRegion = (state: string, on: boolean) =>
    setRegions((prev) =>
      on
        ? NIGERIAN_STATES.filter((s) => s === state || prev.includes(s))
        : prev.filter((s) => s !== state)
    );

  if (!access.adjustable) {
    return (
      <Alert variant="neutral">
        Super admins always have every permission, nationwide. Change their role to limit them.
      </Alert>
    );
  }

  return (
    <form
      method="post"
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        save.mutate();
      }}
    >
      {access.deactivatedAt && (
        <Alert variant="danger">
          Deactivated {formatRelativeTime(access.deactivatedAt)}
          {access.deactivationReason ? `: ${access.deactivationReason}` : ''}. They cannot sign in
          until a second super admin approves their reactivation.
        </Alert>
      )}
      {access.emergency && (
        <Alert variant="warning">
          Emergency access active until {formatDateTime(access.emergency.expiresAt)}:{' '}
          {access.emergency.permissions.map((p) => PERMISSION_LABELS[p] ?? p).join(', ')}.
        </Alert>
      )}
      {pending && (
        <Alert variant="warning">
          {pending.requestedBy.legalName} asked {formatRelativeTime(pending.createdAt)} to change
          this access. Decide that request under Approvals before making another change.
        </Alert>
      )}

      <section>
        <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff administration only ever comes with a role, so it can be removed here but not added.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {PERMISSION_GROUPS.map((group) => (
            <fieldset key={group.label} className="rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-medium text-foreground">{group.label}</legend>
              <div className="space-y-2.5">
                {group.permissions.map((permission) => {
                  const fromRole = roleDefaults.has(permission);
                  const on = selected.has(permission);
                  const cannotAdd = !fromRole && ROLE_ONLY_PERMISSIONS.includes(permission);
                  return (
                    <Checkbox
                      key={permission}
                      checked={on}
                      disabled={cannotAdd || Boolean(pending)}
                      onCheckedChange={(checked) => toggle(permission, checked)}
                      label={
                        <span className="flex flex-wrap items-center gap-1.5">
                          {PERMISSION_LABELS[permission]}
                          {fromRole && !on && <Badge variant="danger">Removed</Badge>}
                          {!fromRole && on && <Badge variant="warning">Added</Badge>}
                        </span>
                      }
                      description={fromRole ? 'From their role' : undefined}
                    />
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Regions
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {regions.length === 0
            ? 'Nationwide: they see property, dispute and sale-deposit cases in every state.'
            : `They see property, dispute and sale-deposit cases in ${regions.join(', ')} only. Identity and licence checks stay nationwide.`}
        </p>
        <div role="group" aria-label="States" className="mt-3 flex flex-wrap gap-2">
          <ToggleChip
            size="sm"
            pressed={regions.length === 0}
            disabled={Boolean(pending)}
            onPressedChange={() => setRegions([])}
          >
            Nationwide
          </ToggleChip>
          {NIGERIAN_STATES.map((state) => (
            <ToggleChip
              key={state}
              size="sm"
              pressed={regions.includes(state)}
              disabled={Boolean(pending)}
              onPressedChange={(on) => toggleRegion(state, on)}
            >
              {state}
            </ToggleChip>
          ))}
        </div>
      </section>

      {granted.length > 0 && (
        <Field
          label="Extra permissions end on"
          htmlFor="staff-access-until"
          hint="Leave empty to keep them until removed. At most 90 days ahead."
        >
          <DatePicker
            id="staff-access-until"
            value={until}
            onChange={setUntil}
            min={untilBounds.min}
            max={untilBounds.max}
            clearable
            disabled={Boolean(pending)}
            ariaLabel="Extra permissions end on"
          />
        </Field>
      )}

      <Field
        label="Reason"
        htmlFor="staff-access-reason"
        required
        hint="Kept in the audit log and shown to whoever approves it."
      >
        <Textarea
          id="staff-access-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Moved to the Abuja team; no longer approves payouts"
          rows={2}
          disabled={Boolean(pending)}
        />
      </Field>

      {widens && changed && (
        <Alert variant="neutral">
          This gives them access they do not have now, so another super admin must approve it.
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!changed || reason.trim().length < MIN_REASON_LENGTH || Boolean(pending)}
          isLoading={save.isPending}
          loadingText="Saving…"
        >
          {widens ? 'Send for approval' : 'Apply now'}
        </Button>
      </div>
    </form>
  );
};

function lagosDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date(iso));
}
