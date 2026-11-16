export interface TimelinePass {
  status: string;
  expiresAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  respondedAt?: string;
  gateName?: string;
  exitGateName?: string;
}

// Gates are named only when the guard chose one; older passes and single-entrance estates have none.
const at = (gate?: string) => (gate ? ` at ${gate}` : '');

export const passTimeline = (
  pass: TimelinePass,
  formatDateTime: (iso: string) => string,
  formatTime: (iso: string) => string
): string | null => {
  switch (pass.status) {
    case 'checked_out':
      if (pass.checkedInAt && pass.checkedOutAt) {
        return `In ${formatDateTime(pass.checkedInAt)}${at(pass.gateName)} · out ${formatTime(pass.checkedOutAt)}${at(pass.exitGateName)}`;
      }
      return pass.checkedOutAt
        ? `Left ${formatDateTime(pass.checkedOutAt)}${at(pass.exitGateName)}`
        : null;
    case 'checked_in':
      return pass.checkedInAt
        ? `In since ${formatDateTime(pass.checkedInAt)}${at(pass.gateName)}`
        : null;
    case 'expired':
      return `Expired ${formatDateTime(pass.expiresAt)}`;
    case 'denied':
      return pass.respondedAt ? `Refused ${formatDateTime(pass.respondedAt)}` : null;
    case 'revoked':
      return null;
    default:
      return `Expires ${formatDateTime(pass.expiresAt)}`;
  }
};
