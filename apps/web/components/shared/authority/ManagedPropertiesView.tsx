'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Check,
  Clock,
  KeyRound,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Select,
  Textarea,
  type BadgeVariant,
} from '@getrentos/ui';
import { ReferenceCodeChip } from '@/components/shared/property/ReferenceCodeChip';
import { AppealControl } from '@/components/shared/trust/AppealControl';
import {
  AUTHORITY_RELATIONSHIPS,
  AUTHORITY_RELATIONSHIP_LABELS,
  propertyAuthorityService,
  type AuthorityRelationship,
  type ManagedPropertyDto,
  type PropertyAuthorityDto,
  type ResolvedPropertyRefDto,
} from '@/services/propertyAuthorityService';
import { authorityKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

/**
 * "Properties I manage": the properties the signed-in user may act for because
 * someone granted them authority, plus the claims they have filed and not yet
 * had decided.
 *
 * Mounted per persona (owner / agent / realtor) because each portal has its own
 * navigation, but the content is identical: a mandate is a fact about a
 * property, not about which dashboard you happen to be looking at.
 */

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  REVOKED: 'danger',
  EXPIRED: 'neutral',
};

const statusBadge = (status: string) => (
  <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>{status.toLowerCase()}</Badge>
);

/**
 * The three capabilities a mandate carries, shown as chips so the limits are
 * visible. They are deliberately separate: being allowed to advertise a
 * property, to run its tenancy, and to move its money are different grants.
 */
const CapabilityChips = ({
  canList,
  canManage,
  canTransact,
}: {
  canList: boolean;
  canManage: boolean;
  canTransact: boolean;
}) => (
  <div className="flex flex-wrap gap-2">
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        canList
          ? 'bg-success-subtle text-success'
          : 'bg-muted text-muted-foreground'
      }`}
      title="May create, publish and pause listings for this property"
    >
      {canList ? <KeyRound className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      Listings
    </span>
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        canManage
          ? 'bg-success-subtle text-success'
          : 'bg-muted text-muted-foreground'
      }`}
      title="May run the tenancy: units, tenants, applications, leases and maintenance"
    >
      {canManage ? <Wrench className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      Tenancy
    </span>
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        canTransact
          ? 'bg-success-subtle text-success'
          : 'bg-muted text-muted-foreground'
      }`}
      title="May accept offers, release held payments and act on money for this property"
    >
      {canTransact ? <Wallet className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      Money
    </span>
  </div>
);

const ManagedPropertyCard = ({
  property,
  managePath,
}: {
  property: ManagedPropertyDto;
  managePath?: string;
}) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="p-2.5 rounded-xl bg-accent shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{property.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {property.address}, {property.city}
          </p>
          {property.referenceCode && (
            <div className="mt-2">
              <ReferenceCodeChip code={property.referenceCode} />
            </div>
          )}
        </div>
      </div>
      {statusBadge(property.status)}
    </div>

    <p className="text-sm text-muted-foreground mb-3">
      Owner: <span className="text-foreground">{property.ownerName}</span> · you act as{' '}
      <span className="text-foreground">
        {AUTHORITY_RELATIONSHIP_LABELS[property.relationship as AuthorityRelationship] ??
          property.relationship.toLowerCase().replace(/_/g, ' ')}
      </span>
    </p>

    <CapabilityChips
      canList={property.canList}
      canManage={property.canManage}
      canTransact={property.canTransact}
    />

    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
      <span>
        {property.listingCount} listing{property.listingCount === 1 ? '' : 's'}
        {property.archived ? ' · archived' : ''}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        {property.expiresAt
          ? `expires ${new Date(property.expiresAt).toLocaleDateString()}`
          : 'no expiry'}
      </span>
    </div>

    {managePath && property.canManage && property.status === 'ACTIVE' && (
      <Button
        href={`${managePath}?propertyId=${property.propertyId}`}
        icon={<Wrench className="h-4 w-4" />}
        fullWidth
        className="mt-4"
      >
        Manage this property
      </Button>
    )}
  </Card>
);

const ClaimRow = ({ claim }: { claim: PropertyAuthorityDto }) => (
  <Card className="flex items-start justify-between gap-3 px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm text-foreground truncate">
        {AUTHORITY_RELATIONSHIP_LABELS[claim.relationship as AuthorityRelationship] ??
          claim.relationship}
      </p>
      <p className="text-xs text-muted-foreground font-mono truncate">
        {claim.propertyReferenceCode ?? claim.propertyId}
      </p>
      {claim.decisionNote && (
        <p className="text-xs text-muted-foreground mt-1">Officer: {claim.decisionNote}</p>
      )}
      {claim.status === 'REJECTED' && (
        <AppealControl targetType="PROPERTY_AUTHORITY" targetId={claim.id} subject="this claim" />
      )}
    </div>
    <div className="shrink-0">{statusBadge(claim.status)}</div>
  </Card>
);

/**
 * What actually happened when a claim was submitted.
 *
 * The backend answers a claim that already exists by returning it untouched
 * rather than creating a duplicate, and `justCreated` says which happened — a
 * fresh claim is PENDING just like a pre-existing one, so the status alone can't
 * tell them apart. Announce "filed" only when something was actually filed.
 */
const claimOutcomeMessage = (authority: PropertyAuthorityDto) => {
  if (authority.justCreated) return 'Claim filed. It grants nothing until an officer approves it.';
  if (authority.status === 'ACTIVE')
    return 'You already act for this property: nothing new was filed.';
  if (authority.status === 'PENDING')
    return 'You already have a claim on this property awaiting an officer.';
  return 'Claim filed. It grants nothing until an officer approves it.';
};

const ClaimForm = () => {
  const queryClient = useQueryClient();
  const [propertyRef, setPropertyRef] = useState('');
  const [relationship, setRelationship] = useState<AuthorityRelationship>('PROPERTY_MANAGER');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedPropertyRefDto | null>(null);
  const [lookup, setLookup] = useState<'idle' | 'resolving' | 'notfound'>('idle');
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveSeq = useRef(0);

  // Live-confirm the property behind the code as it is typed, so a mistyped code
  // is caught before a claim is filed rather than after an officer looks at it.
  // Debounced, and guarded by a sequence number so a slow lookup can't overwrite
  // the result of a later keystroke.
  const onRefChange = (value: string) => {
    setPropertyRef(value);
    setResolved(null);
    setError(null);
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    const trimmed = value.trim();
    if (trimmed.length < 6) {
      setLookup('idle');
      return;
    }
    setLookup('resolving');
    const seq = (resolveSeq.current += 1);
    resolveTimer.current = setTimeout(() => {
      void propertyAuthorityService.resolve(trimmed).then((res) => {
        if (seq !== resolveSeq.current) return; // a newer keystroke won
        if (res.success && res.data) {
          setResolved(res.data);
          setLookup('idle');
        } else {
          setResolved(null);
          setLookup('notfound');
        }
      });
    }, 400);
  };

  const mutation = useMutation({
    mutationFn: () =>
      unwrap(
        propertyAuthorityService.request({ propertyRef: propertyRef.trim(), relationship, note })
      ),
    onSuccess: (authority) => {
      setError(null);
      setSuccess(claimOutcomeMessage(authority));
      setPropertyRef('');
      setNote('');
      setResolved(null);
      setLookup('idle');
      void queryClient.invalidateQueries({ queryKey: authorityKeys.mine });
    },
    onError: (err: Error) => {
      setSuccess(null);
      setError(err.message || 'Could not file the claim.');
    },
  });

  const canSubmit = propertyRef.trim().length >= 6 && !mutation.isPending;

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground mb-1">Ask to act for a property</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Enter the property’s code — the owner can copy it from their property page (it looks like
        PR-AB7K-9Q). An officer checks the mandate, then grants the two capabilities separately:
        listing a property and moving money on it are not the same permission.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          label="Property code"
          hint={
            lookup === 'resolving' ? (
              'Looking up…'
            ) : resolved ? (
              <span className="inline-flex items-start gap-1 text-success">
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {resolved.title} · {resolved.city}
              </span>
            ) : lookup === 'notfound' ? (
              <span className="text-warning">
                No property found for that code. Check it with the owner.
              </span>
            ) : undefined
          }
        >
          <Input
            value={propertyRef}
            onChange={(event) => onRefChange(event.target.value)}
            placeholder="PR-AB7K-9Q"
            inputClassName="font-mono"
          />
        </Field>

        <Field label="Your relationship">
          <Select
            value={relationship}
            onValueChange={(value) => setRelationship(value as AuthorityRelationship)}
            searchable={false}
            options={AUTHORITY_RELATIONSHIPS.map((value) => ({
              value,
              label: AUTHORITY_RELATIONSHIP_LABELS[value],
            }))}
          />
        </Field>
      </div>

      <Field label="Note for the officer" optionalLabel="(optional)" className="mt-3">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="e.g. managing this block for the owner since March"
        />
      </Field>

      {error && (
        <Alert variant="danger" icon={ShieldAlert} className="mt-3">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mt-3">
          {success}
        </Alert>
      )}

      <Button
        disabled={!canSubmit}
        isLoading={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="mt-4"
      >
        File claim
      </Button>
    </Card>
  );
};

export const ManagedPropertiesView = ({ managePath }: { managePath?: string } = {}) => {
  const managed = useQuery({
    queryKey: authorityKeys.managed,
    queryFn: () => unwrap(propertyAuthorityService.managed()),
  });
  const claims = useQuery({
    queryKey: authorityKeys.mine,
    queryFn: () => unwrap(propertyAuthorityService.mine()),
  });

  const properties = managed.data ?? [];
  const openClaims = (claims.data ?? []).filter((claim) => claim.status !== 'ACTIVE');

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Managed properties</h1>
        <p className="text-muted-foreground mt-1">
          Properties you can act for because the owner gave you authority: with exactly what that
          authority lets you do.
        </p>
      </div>

      {managed.isLoading ? (
        <ListSkeleton variant="cards" rows={2} className="mb-6" />
      ) : managed.isError && !managed.data ? (
        <PageErrorState
          headingLevel="h2"
          title="Could not load your managed properties"
          description={(managed.error as Error).message || undefined}
          onRetry={() => void managed.refetch()}
          isRetrying={managed.isFetching}
          className="min-h-0 py-10 mb-6"
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No mandates yet"
          description="You are not acting for anyone else’s property at the moment. If an owner has asked you to manage one, file a claim below and it will be checked by an officer."
          className="mb-6"
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {properties.map((property) => (
            <ManagedPropertyCard
              key={property.mandateId}
              property={property}
              managePath={managePath}
            />
          ))}
        </div>
      )}

      {openClaims.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            Claims in progress
          </h2>
          <div className="space-y-2">
            {openClaims.map((claim) => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </div>
        </div>
      )}

      <ClaimForm />
    </>
  );
};
