/** Where the text of a decision came from: the API (`api`), the text layer of the PDF (`pdf`) or local OCR (`ocr`). */
export type TextSource = 'api' | 'pdf' | 'ocr';

/** One decision of `lookup`; `total` is the size of the filtered set, repeated on every row. Never the text. */
export interface LookupRow {
  readonly id: string;
  readonly court: string;
  readonly cislo: string;
  readonly senat: string | null;
  readonly ecli: string | null;
  readonly datumRozhodnutia: Date | null;
  readonly kolegium: string | null;
  readonly kolegiumNazov: string | null;
  readonly merito: string | null;
  readonly sudca: string | null;
  readonly sourceUrl: string | null;
  readonly textSource: string;
  readonly total: number;
}

/** One hit of `search`: the extremes, the headline (words between guillemets) or a snippet, never the whole text. */
export interface SearchHit {
  readonly id: string;
  readonly court: string;
  readonly cislo: string;
  readonly ecli: string | null;
  readonly datumRozhodnutia: Date | null;
  readonly kolegiumNazov: string | null;
  readonly merito: string | null;
  readonly headline: string | null;
  readonly snippet: string | null;
  readonly textSource: string;
  readonly position: number;
}

/** One decision of `rozhodnutie` with a slice of its text; a case number can match more than one row. */
export interface DecisionRecord {
  readonly id: string;
  readonly fonte: string;
  readonly sourceId: string;
  readonly court: string;
  readonly cislo: string;
  readonly senat: string | null;
  readonly ecli: string | null;
  readonly datumRozhodnutia: Date | null;
  readonly kolegium: string | null;
  readonly kolegiumNazov: string | null;
  readonly merito: string | null;
  readonly sudca: string | null;
  readonly text: string;
  readonly textLength: number;
  readonly truncated: boolean;
  readonly nextOffset: number | null;
  readonly textSource: string;
  readonly pdfUrl: string | null;
  readonly sourceUrl: string | null;
  /** Strings shaped like personal data counted in the text (the Court anonymises before publication). */
  readonly piiFlags: number;
}

/** Ids listed versus taken for one window of decision dates. */
export interface CoverageWindow {
  readonly windowFrom: Date | null;
  readonly windowTo: Date | null;
  readonly idsListed: number;
  readonly idsTaken: number;
  readonly pdfOnly: number;
}

/** One court of `status`; the empty corpus answers one row with `court` null. */
export interface StatusRow {
  readonly court: string | null;
  readonly decisions: number;
  readonly yearMin: number | null;
  readonly yearMax: number | null;
  /** Decisions by text source: keys `api`, `pdf`, `ocr` (a missing key means 0). */
  readonly textSources: Readonly<Record<string, number>>;
  /** Decisions by chamber code (`1`..`4`). */
  readonly byKolegium: Readonly<Record<string, number>>;
  readonly piiFlagsTotal: number;
  readonly passagesTotal: number;
  readonly passagesPending: number;
  /** Skipped items by reason (corpus-wide, repeated on every court row). */
  readonly skipped: Readonly<Record<string, number>>;
  /** The last coverage windows (corpus-wide, repeated on every court row). */
  readonly coverage: readonly CoverageWindow[];
  readonly lastIngestedAt: Date | null;
  readonly honestLimits: string | null;
}

/** A Tool answer: the rows of the envelope and the codes of its `warnings` (empty when the envelope has none). */
export interface ToolRows<T> {
  readonly rows: readonly T[];
  readonly warnings: readonly string[];
}

/** Wire names (camelCase) of the date members. */
export const DATE_KEYS: readonly string[] = ['datumRozhodnutia', 'lastIngestedAt', 'windowFrom', 'windowTo'];
/** Number members; some hosts send bigint columns as text, so they are coerced. */
export const NUMBER_KEYS: readonly string[] = [
  'total', 'position', 'textLength', 'nextOffset', 'piiFlags', 'decisions', 'yearMin', 'yearMax', 'piiFlagsTotal', 'passagesTotal', 'passagesPending',
  'idsListed', 'idsTaken', 'pdfOnly',
];
/** jsonb members that are arrays of objects: their keys are camelised (a host that serialises jsonb as text is parsed). */
export const JSON_LIST_KEYS: readonly string[] = ['coverage'];
/** jsonb members that are maps (counts by key): parsed, the keys left as they are, the values coerced to numbers. */
export const JSON_MAP_KEYS: readonly string[] = ['textSources', 'byKolegium', 'skipped'];
