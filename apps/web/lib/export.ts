/**
 * Client-side export helpers.
 *
 * CSV is generated here from real data. For PDF we render a printable HTML
 * document in a new window and invoke the browser's print dialog (a real PDF
 * path that needs no extra client dependency).
 */

const escapeCsvValue = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/** Builds and downloads a real CSV file from headers + rows. */
export const downloadCsv = (filename: string, headers: string[], rows: unknown[][]): void => {
  const content = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/** Escapes text for safe embedding in generated HTML. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Opens a printable window with the supplied document body and triggers print. */
export const printHtml = (title: string, bodyHtml: string): void => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeCsvValue(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; text-align: left; }
  th { background: #f5f5f5; }
  ul { margin: 0; padding-left: 20px; font-size: 12px; }
  li { margin-bottom: 2px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`);
  win.document.close();
  // Wait for the document to finish rendering before printing.
  setTimeout(() => win.print(), 300);
};
