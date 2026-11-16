export interface TimelinePass {
  status: string;
  expiresAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  respondedAt?: string;
}

export const passTimeline = (
  pass: TimelinePass,
  formatDateTime: (iso: string) => string,
  formatTime: (iso: string) => string
): string | null => {
  switch (pass.status) {
    case 'checked_out':
      if (pass.checkedInAt && pass.checkedOutAt) {
        return `In ${formatDateTime(pass.checkedInAt)} · out ${formatTime(pass.checkedOutAt)}`;
      }
      return pass.checkedOutAt ? `Left ${formatDateTime(pass.checkedOutAt)}` : null;
    case 'checked_in':
      return pass.checkedInAt ? `In since ${formatDateTime(pass.checkedInAt)}` : null;
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
