'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Loader2 } from 'lucide-react';
import { Button, Card } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { getStoredUser, updateStoredUser } from '@/lib/authStorage';
import { agencyTeamService } from '@/services/agencyTeamService';

/** Where a staff invitation link lands: see what it is, then join. */
export function AgencyJoinView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useSearchParams().get('token') ?? '';

  const preview = useQuery({
    queryKey: ['agency', 'join', token],
    enabled: token.length > 0,
    queryFn: async () => {
      const res = await agencyTeamService.preview(token);
      if (!res.success) throw new Error(res.error || 'This invitation link is not valid.');
      return res.data!;
    },
  });

  const accept = useMutation({
    mutationFn: async () => {
      const res = await agencyTeamService.accept(token);
      if (!res.success) throw new Error(res.error || 'Could not join.');
      return res.data!;
    },
    onSuccess: async () => {
      const roles = getStoredUser<{ roles?: string[] }>()?.roles ?? [];
      if (!roles.includes('PROPERTY_MANAGER'))
        updateStoredUser({ roles: [...roles, 'PROPERTY_MANAGER'] });
      // Anything fetched before joining (the clients list, refused) was answered
      // for someone outside the firm; drop it rather than show it.
      await queryClient.resetQueries();
      router.push('/agency');
    },
  });

  const p = preview.data;
  return (
    <div className="mx-auto max-w-lg p-6">
      <Card className="p-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Briefcase className="h-5 w-5 text-primary" /> Join a firm
        </h1>
        {!token ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Open the link from your invitation email.
          </p>
        ) : preview.isLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your invitation…
          </p>
        ) : preview.isError ? (
          <p className="mt-3 text-sm text-destructive">{(preview.error as Error).message}</p>
        ) : p ? (
          <>
            <p className="mt-3 text-sm text-foreground">
              <strong>{p.firmName}</strong> has invited you to join as{' '}
              <strong>{p.roleLabel}</strong>
              {p.membershipExpiresAt ? ` until ${formatDate(p.membershipExpiresAt)}` : ''}.
            </p>
            {p.status !== 'PENDING' ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {p.status === 'EXPIRED'
                  ? 'This invitation has expired. Ask the firm for a new one.'
                  : 'This invitation is no longer open.'}
              </p>
            ) : !p.emailMatches ? (
              <p className="mt-3 text-sm text-muted-foreground">
                It was sent to <strong>{p.email}</strong>. Sign in with that email to accept it.
              </p>
            ) : (
              <>
                <Button
                  className="mt-4"
                  onClick={() => accept.mutate()}
                  disabled={accept.isPending}
                >
                  {accept.isPending ? 'Joining…' : `Join ${p.firmName}`}
                </Button>
                {accept.isError && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {(accept.error as Error).message}
                  </p>
                )}
              </>
            )}
          </>
        ) : null}
      </Card>
    </div>
  );
}
