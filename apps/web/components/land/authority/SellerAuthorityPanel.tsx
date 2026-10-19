'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSignature,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageErrorState,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import {
  describeCapacityRule,
  LAND_AUTHORITY_INSTRUMENT_LABELS,
  LAND_AUTHORITY_STATUS_LABELS,
  LAND_CONSENT_LABELS,
  LAND_SELLER_CAPACITIES,
  LAND_SELLER_CAPACITY_LABELS,
  LAND_SIGNATORY_ROLE_LABELS,
  landAuthorityTone,
  signatoryRolesFor,
  type LandAuthorityInstrument,
  type LandAuthoritySignatory,
  type LandAuthorityView,
  type LandCapacityRule,
  type LandSellerCapacity,
  type LandSignatoryRole,
} from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { landAuthorityService } from '@/services/landAuthorityService';
import type { LandDocumentType } from '@/types/landDocument';
import { LandDocumentPicker } from '../documents/LandDocumentPicker';
import { errorMessage } from '../developer/feedback';

interface SellerAuthorityPanelProps {
  propertyId: string;
}

const isClaim = (view: unknown): view is LandAuthorityView =>
  Boolean(view && typeof view === 'object' && (view as LandAuthorityView).authority);

/**
 * The seller's authority to sell this land: the capacity they sell in, the
 * instrument it rests on, and everyone whose consent it needs. Land review
 * cannot be approved until GetRentos has verified it.
 */
export const SellerAuthorityPanel = ({ propertyId }: SellerAuthorityPanelProps) => {
  const queryClient = useQueryClient();
  const key = landKeys.authority(propertyId);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const query = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landAuthorityService.get(propertyId)),
  });

  const saved = (view: LandAuthorityView, message: string) => {
    queryClient.setQueryData(key, view);
    void queryClient.invalidateQueries({ queryKey: landKeys.ownerDetail(propertyId) });
    setToast({ message, variant: 'success' });
  };
  const failed = (error: unknown, fallback: string) =>
    setToast({ message: errorMessage(error, fallback), variant: 'error' });

  if (query.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }
  if (query.isError || !query.data) {
    return (
      <PageErrorState
        title="We could not load your authority to sell"
        description={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => query.refetch()}
        isRetrying={query.isRefetching}
      />
    );
  }

  const view = query.data;
  const claim = isClaim(view) ? view.authority : null;
  const rules = view.rules;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <StatusCard view={isClaim(view) ? view : null} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DeclarationCard
          // A new or replaced claim starts the form from what the server holds.
          key={claim ? `${claim.id}:${claim.status}` : 'new'}
          propertyId={propertyId}
          view={isClaim(view) ? view : null}
          rules={rules}
          onSaved={saved}
          onFailed={failed}
        />
        {claim && isClaim(view) && (
          <SignatoriesCard propertyId={propertyId} view={view} onSaved={saved} onFailed={failed} />
        )}
      </div>
      {claim && isClaim(view) && (
        <ActionsCard
          propertyId={propertyId}
          view={view}
          onSaved={saved}
          onFailed={failed}
          onWithdrawn={() => {
            void queryClient.invalidateQueries({ queryKey: key });
            setToast({ message: 'Claim withdrawn.', variant: 'success' });
          }}
        />
      )}
    </div>
  );
};

// ─── Where the claim stands ──────────────────────────────────────────────────

const StatusCard = ({ view }: { view: LandAuthorityView | null }) => {
  if (!view) {
    return (
      <Card static className="p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-foreground">Show you can sell this land</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Buyers need to know the person selling has the right to. Tell us how you hold or
              represent this land and what that rests on. GetRentos checks it before the land can be
              approved for sale.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const { authority, gaps } = view;
  return (
    <Card static className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">Authority to sell</h2>
          <p className="mt-1 text-sm text-muted-foreground">{authority.capacityLabel}</p>
        </div>
        <Badge variant={landAuthorityTone(authority.status)}>
          {LAND_AUTHORITY_STATUS_LABELS[authority.status]}
        </Badge>
      </div>
      {authority.status === 'DISPUTED' && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          Someone has objected to this sale. It is paused, and you cannot change the claim, until
          GetRentos resolves the objection.
        </p>
      )}
      {authority.decision?.note && (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">
            {authority.status === 'REJECTED' ? 'Why it was not accepted' : 'Reviewer note'}:
          </span>{' '}
          {authority.decision.note}
        </p>
      )}
      {gaps.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Still needed</p>
          <ul className="mt-2 space-y-1.5">
            {gaps.map((gap) => (
              <li key={gap} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        authority.status !== 'VERIFIED' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            Everything the claim needs is in.
            {authority.status === 'DRAFT' && ' Send it for review below.'}
          </p>
        )
      )}
    </Card>
  );
};

// ─── Capacity and instrument ─────────────────────────────────────────────────

interface CardProps {
  propertyId: string;
  view: LandAuthorityView;
  onSaved: (view: LandAuthorityView, message: string) => void;
  onFailed: (error: unknown, fallback: string) => void;
}

const DeclarationCard = ({
  propertyId,
  view,
  rules,
  onSaved,
  onFailed,
}: Omit<CardProps, 'view'> & {
  view: LandAuthorityView | null;
  rules: Record<LandSellerCapacity, LandCapacityRule>;
}) => {
  const claim = view?.authority ?? null;
  // A rejected claim stays on record; saving starts a new one.
  const startsFresh = !claim || claim.status === 'REJECTED';
  const locked = claim?.status === 'DISPUTED';
  const [capacity, setCapacity] = useState<LandSellerCapacity | ''>(claim?.capacity ?? '');
  const [principalName, setPrincipalName] = useState(claim?.principalName ?? '');
  const [instrumentType, setInstrumentType] = useState<LandAuthorityInstrument | ''>(
    claim?.instrumentType ?? ''
  );
  const [instrumentDocumentId, setInstrumentDocumentId] = useState(
    claim?.instrumentDocumentId ?? ''
  );
  const [expiresAt, setExpiresAt] = useState(claim?.expiresAt?.slice(0, 10) ?? '');

  const rule = capacity ? rules[capacity] : null;
  const instrumentOptions = (rule?.instruments ?? []).map((value) => ({
    value,
    label: LAND_AUTHORITY_INSTRUMENT_LABELS[value],
  }));

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        landAuthorityService.declare(propertyId, {
          capacity: capacity as LandSellerCapacity,
          principalName: principalName.trim() || undefined,
          instrumentType: instrumentType || undefined,
          instrumentDocumentId: instrumentDocumentId || undefined,
          expiresAt: expiresAt || undefined,
        })
      ),
    onSuccess: (updated) =>
      onSaved(
        updated,
        claim?.status === 'VERIFIED'
          ? 'Saved. A change to a verified claim goes back to review.'
          : 'Saved.'
      ),
    onError: (error) => onFailed(error, 'Could not save your authority.'),
  });

  const missingPrincipal = Boolean(rule?.principalRequired && !principalName.trim());
  return (
    <Card static className="p-5">
      <div className="flex items-center gap-2">
        <FileSignature className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-foreground">How you can sell it</h2>
      </div>
      <div className="mt-4 space-y-4">
        <Field label="Your capacity" required>
          <Select
            value={capacity}
            onValueChange={(value) => {
              setCapacity(value as LandSellerCapacity);
              setInstrumentType('');
            }}
            ariaLabel="Your capacity"
            placeholder="Choose how you hold or represent this land"
            disabled={locked}
            options={LAND_SELLER_CAPACITIES.map((value) => ({
              value,
              label: LAND_SELLER_CAPACITY_LABELS[value],
            }))}
          />
        </Field>
        {rule && <p className="text-sm text-muted-foreground">{describeCapacityRule(rule)}</p>}
        {rule?.principalRequired && (
          <Field
            label="Whose authority you exercise"
            hint="The principal, the deceased, the company or the family, as named on the instrument."
            required
          >
            <Input
              value={principalName}
              onChange={(event) => setPrincipalName(event.target.value)}
              maxLength={200}
              disabled={locked}
            />
          </Field>
        )}
        {instrumentOptions.length > 0 && (
          <>
            <Field label="The instrument" required>
              <Select
                value={instrumentType}
                onValueChange={(value) => setInstrumentType(value as LandAuthorityInstrument)}
                ariaLabel="The instrument"
                placeholder="What your authority rests on"
                disabled={locked}
                options={instrumentOptions}
              />
            </Field>
            <LandDocumentPicker
              // The picker reads its suggested type once; a new instrument type re-presets it.
              key={instrumentType || 'none'}
              propertyId={propertyId}
              label="The instrument document"
              value={instrumentDocumentId}
              onChange={setInstrumentDocumentId}
              suggestedType={(instrumentType || undefined) as LandDocumentType | undefined}
              hint="Choose it from this land's documents, or upload it here."
              disabled={locked}
            />
            <Field label="Valid until" hint="Leave empty if the instrument has no end date.">
              <Input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={locked}
              />
            </Field>
          </>
        )}
        <Button
          onClick={() => save.mutate()}
          isLoading={save.isPending}
          disabled={!capacity || missingPrincipal || locked || save.isPending}
        >
          {startsFresh ? (claim ? 'Start a new claim' : 'Save') : 'Save changes'}
        </Button>
      </div>
    </Card>
  );
};

// ─── Who must consent ────────────────────────────────────────────────────────

const SignatoriesCard = ({ propertyId, view, onSaved, onFailed }: CardProps) => {
  const { authority, requirements } = view;
  const editable = ['DRAFT', 'PENDING_REVIEW', 'VERIFIED'].includes(authority.status);
  const roles = signatoryRolesFor(requirements);
  const [role, setRole] = useState<LandSignatoryRole | ''>(roles[0] ?? '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const add = useMutation({
    mutationFn: () =>
      unwrap(
        landAuthorityService.addSignatory(propertyId, {
          role: role as LandSignatoryRole,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        })
      ),
    onSuccess: (updated) => {
      setFullName('');
      setPhone('');
      setEmail('');
      onSaved(
        updated,
        email.trim()
          ? 'Added. If they have a GetRentos account with that email, we have asked them to answer.'
          : 'Added.'
      );
    },
    onError: (error) => onFailed(error, 'Could not add that person.'),
  });

  if (requirements.consentRoles.length === 0 && authority.signatories.length === 0) {
    return (
      <Card static className="p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">Consents</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          No one else needs to consent for this capacity.
        </p>
      </Card>
    );
  }

  return (
    <Card static className="p-5">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-foreground">Who must consent</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        People with a GetRentos account answer from it. For anyone else, upload their signed consent
        {requirements.witnessRequired ? ' and name a witness' : ''}; GetRentos checks it.
      </p>
      {authority.signatories.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {authority.signatories.map((signatory) => (
            <SignatoryRow
              key={signatory.id}
              propertyId={propertyId}
              signatory={signatory}
              witnessRequired={requirements.witnessRequired}
              editable={editable}
              onSaved={onSaved}
              onFailed={onFailed}
            />
          ))}
        </ul>
      )}
      {editable && (
        <div className="mt-4 space-y-3 rounded-xl bg-secondary/40 p-4">
          <p className="text-sm font-medium text-foreground">Add someone</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Select
                value={role}
                onValueChange={(value) => setRole(value as LandSignatoryRole)}
                ariaLabel="Role"
                options={roles.map((value) => ({
                  value,
                  label: LAND_SIGNATORY_ROLE_LABELS[value],
                }))}
              />
            </Field>
            <Field label="Full name" required>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={200}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={40}
              />
            </Field>
            <Field label="GetRentos email" hint="So they can answer from their own account.">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<UserPlus className="h-4 w-4" />}
            onClick={() => add.mutate()}
            isLoading={add.isPending}
            disabled={!role || fullName.trim().length < 2 || add.isPending}
          >
            Add
          </Button>
        </div>
      )}
    </Card>
  );
};

const consentTone = (s: LandAuthoritySignatory) =>
  s.consent === 'OBJECTED'
    ? 'danger'
    : s.counts
      ? 'success'
      : s.consent === 'CONSENTED'
        ? 'info'
        : 'neutral';

const SignatoryRow = ({
  propertyId,
  signatory,
  witnessRequired,
  editable,
  onSaved,
  onFailed,
}: {
  propertyId: string;
  signatory: LandAuthoritySignatory;
  witnessRequired: boolean;
  editable: boolean;
  onSaved: CardProps['onSaved'];
  onFailed: CardProps['onFailed'];
}) => {
  const [recording, setRecording] = useState(false);
  const [evidenceDocumentId, setEvidenceDocumentId] = useState('');
  const [witnessName, setWitnessName] = useState('');

  const record = useMutation({
    mutationFn: () =>
      unwrap(
        landAuthorityService.recordConsent(propertyId, signatory.id, {
          evidenceDocumentId,
          witnessName: witnessName.trim() || undefined,
        })
      ),
    onSuccess: (updated) => {
      setRecording(false);
      onSaved(updated, 'Consent recorded. It counts once GetRentos has checked it.');
    },
    onError: (error) => onFailed(error, 'Could not record that consent.'),
  });
  const remove = useMutation({
    mutationFn: () => unwrap(landAuthorityService.removeSignatory(propertyId, signatory.id)),
    onSuccess: (updated) => onSaved(updated, 'Removed.'),
    onError: (error) => onFailed(error, 'Could not remove that person.'),
  });

  const status =
    signatory.consent === 'CONSENTED' && !signatory.counts
      ? 'Consent awaiting check'
      : LAND_CONSENT_LABELS[signatory.consent];
  const canRecord =
    editable &&
    !signatory.answeredFromAccount &&
    signatory.consent !== 'OBJECTED' &&
    signatory.role !== 'THIRD_PARTY';
  const canRemove =
    editable && signatory.consent !== 'OBJECTED' && signatory.role !== 'THIRD_PARTY';

  return (
    <li className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{signatory.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {LAND_SIGNATORY_ROLE_LABELS[signatory.role]}
            {signatory.answeredFromAccount && ' · answered from their account'}
            {signatory.witnessName && ` · witness ${signatory.witnessName}`}
            {signatory.respondedAt && ` · ${formatDate(signatory.respondedAt)}`}
          </p>
          {signatory.objectionReason && (
            <p className="mt-1 text-sm text-foreground">“{signatory.objectionReason}”</p>
          )}
          {signatory.waivedReason && (
            <p className="mt-1 text-xs text-muted-foreground">{signatory.waivedReason}</p>
          )}
        </div>
        <Badge variant={consentTone(signatory)}>{status}</Badge>
      </div>
      {(canRecord || canRemove) && !recording && (
        <div className="mt-2 flex flex-wrap gap-2">
          {canRecord && (
            <Button size="sm" variant="outline" onClick={() => setRecording(true)}>
              {signatory.consent === 'CONSENTED'
                ? 'Replace signed consent'
                : 'Upload signed consent'}
            </Button>
          )}
          {canRemove && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => remove.mutate()}
              isLoading={remove.isPending}
            >
              Remove
            </Button>
          )}
        </div>
      )}
      {recording && (
        <div className="mt-3 space-y-3">
          <LandDocumentPicker
            propertyId={propertyId}
            label="Signed consent"
            value={evidenceDocumentId}
            onChange={setEvidenceDocumentId}
            suggestedType="CONSENT_LETTER"
          />
          <Field label="Witness" required={witnessRequired}>
            <Input
              value={witnessName}
              onChange={(event) => setWitnessName(event.target.value)}
              maxLength={200}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => record.mutate()}
              isLoading={record.isPending}
              disabled={
                !evidenceDocumentId || (witnessRequired && !witnessName.trim()) || record.isPending
              }
            >
              Record consent
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRecording(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

// ─── Submit, appeal, withdraw ────────────────────────────────────────────────

const ActionsCard = ({
  propertyId,
  view,
  onSaved,
  onFailed,
  onWithdrawn,
}: CardProps & { onWithdrawn: () => void }) => {
  const { authority } = view;
  const [appealNote, setAppealNote] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const submit = useMutation({
    mutationFn: () => unwrap(landAuthorityService.submit(propertyId)),
    onSuccess: (updated) =>
      onSaved(updated, 'Sent for review. We will tell you when it is decided.'),
    onError: (error) => onFailed(error, 'Could not send it for review.'),
  });
  const appeal = useMutation({
    mutationFn: () => unwrap(landAuthorityService.appeal(propertyId, appealNote.trim())),
    onSuccess: (updated) => {
      setAppealNote('');
      onSaved(updated, 'Appeal sent. A reviewer will look at the claim again.');
    },
    onError: (error) => onFailed(error, 'Could not send the appeal.'),
  });
  const withdraw = useMutation({
    mutationFn: () => unwrap(landAuthorityService.withdraw(propertyId)),
    onSuccess: onWithdrawn,
    onError: (error) => onFailed(error, 'Could not withdraw the claim.'),
  });
  const canWithdraw = ['DRAFT', 'PENDING_REVIEW', 'VERIFIED'].includes(authority.status);

  return (
    <Card static className="p-5">
      {authority.status === 'DRAFT' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            You can send the claim before every consent is in; the reviewer sees what is still
            missing.
          </p>
          <Button
            icon={<Send className="h-4 w-4" />}
            onClick={() => submit.mutate()}
            isLoading={submit.isPending}
          >
            Send for review
          </Button>
        </div>
      )}
      {authority.status === 'PENDING_REVIEW' && (
        <p className="text-sm text-muted-foreground">
          Under review{authority.submittedAt ? ` since ${formatDate(authority.submittedAt)}` : ''}.
          You can still add consents while you wait.
        </p>
      )}
      {authority.status === 'VERIFIED' && (
        <p className="text-sm text-muted-foreground">
          Verified{authority.decision ? ` on ${formatDate(authority.decision.at)}` : ''}. Changing
          the claim sends it back to review.
        </p>
      )}
      {authority.status === 'REJECTED' && (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Appeal if the reviewer got it wrong, or change the claim above to start a new one.
          </p>
          <Textarea
            value={appealNote}
            onChange={(event) => setAppealNote(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Why the claim should be accepted"
          />
          <Button
            size="sm"
            onClick={() => appeal.mutate()}
            isLoading={appeal.isPending}
            disabled={appealNote.trim().length < 5 || appeal.isPending}
          >
            Appeal
          </Button>
        </div>
      )}
      {canWithdraw && (
        <div className="mt-4 border-t border-border pt-4">
          {confirmWithdraw ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-foreground">
                Withdraw it? The land cannot be approved for sale without a verified claim.
              </p>
              <Button
                size="sm"
                variant="danger"
                onClick={() => withdraw.mutate()}
                isLoading={withdraw.isPending}
              >
                Withdraw
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmWithdraw(false)}>
                Keep it
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmWithdraw(true)}>
              Withdraw this claim
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
