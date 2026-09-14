'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Clock,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  AUTHORITY_RELATIONSHIPS,
  AUTHORITY_RELATIONSHIP_LABELS,
  propertyAuthorityService,
  type AuthorityRelationship,
  type ManagedPropertyDto,
  type PropertyAuthorityDto,
} from '@/services/propertyAuthorityService';
import { authorityKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

/**
 * "Properties I manage": the properties the signed-in user may act for because
 * someone granted them authority, plus the claims they have filed and not yet
 * had decided.
 *
 * Mounted per persona (owner / agent / realtor) because each portal has its own
 * navigation, but the content is identical — a mandate is a fact about a
 * property, not about which dashboard you happen to be looking at.
 */

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  REVOKED: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const statusBadge = (status: string) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
    }`}
  >
    {status.toLowerCase()}
  </span>
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
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
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
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
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
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      }`}
      title="May accept offers, release escrow and act on money for this property"
    >
      {canTransact ? <Wallet className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      Money
    </span>
  </div>
);

const ManagedPropertyCard = ({ property }: { property: ManagedPropertyDto }) => (
  <div className="bg-card rounded-2xl border border-border p-5">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-accent shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{property.title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {property.address}, {property.city}
          </p>
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

    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
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
  </div>
);

const ClaimRow = ({ claim }: { claim: PropertyAuthorityDto }) => (
  <div className="flex items-center justify-between gap-3 bg-card rounded-xl border border-border px-4 py-3">
    <div className="min-w-0">
      <p className="text-sm text-foreground truncate">
        {AUTHORITY_RELATIONSHIP_LABELS[claim.relationship as AuthorityRelationship] ??
          claim.relationship}
      </p>
      <p className="text-xs text-muted-foreground font-mono truncate">{claim.propertyId}</p>
      {claim.decisionNote && (
        <p className="text-xs text-muted-foreground mt-1">Officer: {claim.decisionNote}</p>
      )}
    </div>
    <div className="shrink-0">{statusBadge(claim.status)}</div>
  </div>
);

const ClaimForm = () => {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [relationship, setRelationship] = useState<AuthorityRelationship>('PROPERTY_MANAGER');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      unwrap(propertyAuthorityService.request({ propertyId: propertyId.trim(), relationship, note })),
    onSuccess: () => {
      setError(null);
      setSuccess('Claim filed. It grants nothing until an officer approves it.');
      setPropertyId('');
      setNote('');
      void queryClient.invalidateQueries({ queryKey: authorityKeys.mine });
    },
    onError: (err: Error) => {
      setSuccess(null);
      setError(err.message || 'Could not file the claim.');
    },
  });

  const canSubmit = propertyId.trim().length > 0 && !mutation.isPending;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h2 className="font-semibold text-foreground mb-1">Ask to act for a property</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Use the property’s id. An officer checks the mandate, then grants the two capabilities
        separately — listing a property and moving money on it are not the same permission.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-muted-foreground">Property id</span>
          <input
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted-foreground">Your relationship</span>
          <select
            value={relationship}
            onChange={(event) => setRelationship(event.target.value as AuthorityRelationship)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {AUTHORITY_RELATIONSHIPS.map((value) => (
              <option key={value} value={value}>
                {AUTHORITY_RELATIONSHIP_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block mt-3">
        <span className="text-sm text-muted-foreground">Note for the officer (optional)</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="e.g. managing this block for the owner since March"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{success}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => mutation.mutate()}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        File claim
      </button>
    </div>
  );
};

export const ManagedPropertiesView = () => {
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
          Properties you can act for because the owner gave you authority — with exactly what that
          authority lets you do.
        </p>
      </div>

      {managed.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : managed.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {(managed.error as Error).message || 'Could not load your managed properties.'}
        </p>
      ) : properties.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No mandates yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You are not acting for anyone else’s property at the moment. If an owner has asked you
            to manage one, file a claim below and it will be checked by an officer.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {properties.map((property) => (
            <ManagedPropertyCard key={property.mandateId} property={property} />
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
