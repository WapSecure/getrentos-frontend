import type { LandAreaUnit } from '@/types/land';
import type { LandPlotInput } from '@/types/landDeveloper';

/**
 * Client-side CSV handling for the bulk plot import: parse the file, map each
 * row to the API's plot shape, and catch the mistakes the server would reject
 * so the developer can fix the spreadsheet before uploading. The server still
 * validates everything (geometry, the parcel's total area, plots that already
 * exist) and its verdict is the one that counts.
 */

/** The API accepts at most this many rows per import. */
export const MAX_IMPORT_ROWS = 1000;
const MAX_NAIRA = 1_000_000_000_000;

export const PLOT_CSV_TEMPLATE_HEADERS = [
  'plotNumber',
  'block',
  'areaValue',
  'areaUnit',
  'price',
  'isCorner',
  'tags',
];

export const PLOT_CSV_TEMPLATE_ROWS: string[][] = [
  ['1', 'A', '600', 'SQUARE_METERS', '15000000', 'false', 'road-facing'],
  ['2', 'A', '600', 'SQUARE_METERS', '16500000', 'true', 'corner;road-facing'],
];

/**
 * RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside
 * quotes, CRLF or LF line endings and a leading byte-order mark. Blank lines
 * are dropped.
 */
export const parseCsv = (text: string): string[][] => {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      endRow();
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) endRow();
  return rows;
};

type PlotField = 'plotNumber' | 'block' | 'areaValue' | 'areaUnit' | 'price' | 'isCorner' | 'tags';

const normaliseHeader = (header: string) => header.toLowerCase().replace(/[^a-z]/g, '');

const HEADER_ALIASES: Record<string, PlotField> = {
  plotnumber: 'plotNumber',
  plot: 'plotNumber',
  plotno: 'plotNumber',
  number: 'plotNumber',
  block: 'block',
  areavalue: 'areaValue',
  area: 'areaValue',
  size: 'areaValue',
  areaunit: 'areaUnit',
  unit: 'areaUnit',
  price: 'price',
  pricengn: 'price',
  amount: 'price',
  iscorner: 'isCorner',
  corner: 'isCorner',
  tags: 'tags',
};

const UNIT_ALIASES: Record<string, LandAreaUnit> = {
  squaremeters: 'SQUARE_METERS',
  squaremetres: 'SQUARE_METERS',
  squaremeter: 'SQUARE_METERS',
  squaremetre: 'SQUARE_METERS',
  sqm: 'SQUARE_METERS',
  sqmeters: 'SQUARE_METERS',
  m: 'SQUARE_METERS',
  acre: 'ACRE',
  acres: 'ACRE',
  ac: 'ACRE',
  hectare: 'HECTARE',
  hectares: 'HECTARE',
  ha: 'HECTARE',
};

export const parseAreaUnit = (value: string): LandAreaUnit | null => {
  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return 'SQUARE_METERS';
  return UNIT_ALIASES[key] ?? null;
};

const TRUE_VALUES = new Set(['true', 'yes', 'y', '1', 'corner', 'x']);
const FALSE_VALUES = new Set(['false', 'no', 'n', '0', '']);

export interface ParsedPlotRow {
  /** 1-based line in the file, counting the header as line 1. */
  line: number;
  /** Position in the array sent to the API (matches the server's `index`). */
  index: number;
  plot: LandPlotInput;
  errors: string[];
}

export interface ParsedPlotFile {
  rows: ParsedPlotRow[];
  /** Problems with the file as a whole (missing columns, too many rows). */
  fileErrors: string[];
  /** Columns that were ignored because nothing maps to them. */
  ignoredColumns: string[];
}

const toNumber = (raw: string): number => {
  const cleaned = raw.replace(/[₦,\s]/g, '');
  return cleaned === '' ? Number.NaN : Number(cleaned);
};

const decimals = (value: number) => {
  const text = String(value);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
};

const plotKey = (plotNumber: string, block?: string) =>
  `${(block ?? '').trim().toUpperCase()}|${plotNumber.trim().toUpperCase()}`;

const plotLabel = (plotNumber: string, block?: string) =>
  block ? `${block}/${plotNumber}` : plotNumber;

/** Turns CSV text into plot rows with the problems found in each. */
export const parsePlotCsv = (text: string): ParsedPlotFile => {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { rows: [], fileErrors: ['The file is empty.'], ignoredColumns: [] };
  }

  const [header, ...body] = table;
  const columns = header.map((cell) => HEADER_ALIASES[normaliseHeader(cell)] ?? null);
  const ignoredColumns = header.filter((cell, i) => columns[i] === null && cell.trim() !== '');
  const fileErrors: string[] = [];
  for (const required of ['plotNumber', 'areaValue', 'price'] as const) {
    if (!columns.includes(required)) fileErrors.push(`Add a "${required}" column.`);
  }
  if (body.length === 0) fileErrors.push('The file has a header but no plots.');
  if (body.length > MAX_IMPORT_ROWS) {
    fileErrors.push(
      `The file has ${body.length} plots; import at most ${MAX_IMPORT_ROWS} at a time.`
    );
  }
  if (fileErrors.length > 0 && columns.every((column) => column === null)) {
    return { rows: [], fileErrors, ignoredColumns };
  }

  const seen = new Map<string, number>();
  const rows = body.map((cells, index): ParsedPlotRow => {
    const value = (field: PlotField) => {
      const at = columns.indexOf(field);
      return at === -1 ? '' : (cells[at] ?? '').trim();
    };
    const errors: string[] = [];

    const plotNumber = value('plotNumber');
    if (!plotNumber) errors.push('Plot number is missing.');
    else if (plotNumber.length > 40) errors.push('Plot number is longer than 40 characters.');

    const block = value('block') || undefined;
    if (block && block.length > 40) errors.push('Block is longer than 40 characters.');

    const areaValue = toNumber(value('areaValue'));
    if (!Number.isFinite(areaValue) || areaValue < 0.01) {
      errors.push('Area must be a number of at least 0.01.');
    } else if (decimals(areaValue) > 4) {
      errors.push('Area can have at most 4 decimal places.');
    }

    const unitRaw = value('areaUnit');
    const areaUnit = parseAreaUnit(unitRaw);
    if (!areaUnit) errors.push(`Unknown area unit "${unitRaw}". Use sqm, acres or hectares.`);

    const price = toNumber(value('price'));
    if (!Number.isInteger(price) || price < 1) {
      errors.push('Price must be a whole naira amount above zero.');
    } else if (price > MAX_NAIRA) {
      errors.push('Price is above the ₦1 trillion limit.');
    }

    const cornerRaw = value('isCorner').toLowerCase();
    let isCorner = false;
    if (TRUE_VALUES.has(cornerRaw)) isCorner = true;
    else if (!FALSE_VALUES.has(cornerRaw))
      errors.push(`Corner should be yes or no, not "${cornerRaw}".`);

    const tags = value('tags')
      .split(/[;|]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tags.length > 20) errors.push('At most 20 tags per plot.');
    if (tags.some((tag) => tag.length > 40))
      errors.push('Each tag must be 40 characters or fewer.');

    if (plotNumber) {
      const key = plotKey(plotNumber, block);
      const earlier = seen.get(key);
      if (earlier !== undefined) {
        errors.push(`Plot ${plotLabel(plotNumber, block)} duplicates line ${earlier}.`);
      } else {
        seen.set(key, index + 2);
      }
    }

    const plot: LandPlotInput = {
      plotNumber,
      ...(block ? { block } : {}),
      areaValue,
      areaUnit: areaUnit ?? 'SQUARE_METERS',
      price,
      isCorner,
      ...(tags.length ? { tags } : {}),
    };
    return { line: index + 2, index, plot, errors };
  });

  return { rows, fileErrors, ignoredColumns };
};
