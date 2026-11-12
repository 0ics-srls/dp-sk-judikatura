/** Wire rows (snake case, like the Tool SQL returns them) for the specs. */
export type WireRow = Record<string, unknown>;

export const DEC_ID = '3f2b8c1e-6d3a-4a52-9f0e-1c2d3e4f5a6b';
export const DEC_ID_2 = '9c1d7e2a-4b5f-4c6d-8e7f-0a1b2c3d4e5f';

/** One row of `lookup`; `total` is the size of the filtered set, repeated on every row. */
export function lookupWire(over: WireRow = {}): WireRow {
  return {
    id: DEC_ID,
    court: 'NSSR',
    cislo: '8Cdo/21/2014',
    senat: '8Cdo',
    ecli: 'ECLI:SK:NSSR:2014:1234567890.1',
    datum_rozhodnutia: '2025-09-03',
    kolegium: '1',
    kolegium_nazov: 'Občianskoprávne kolégium',
    merito: 'Dovolanie zamietnuté',
    sudca: 'JUDr. Ján Novák',
    source_url: 'https://www.nsud.sk/rozhodnutia/8cdo212014/',
    text_source: 'api',
    total: 3,
    ...over,
  };
}

/** One row of `search`. */
export function searchWire(over: WireRow = {}): WireRow {
  return {
    id: DEC_ID,
    court: 'NSSR',
    cislo: '8Cdo/21/2014',
    ecli: 'ECLI:SK:NSSR:2014:1234567890.1',
    datum_rozhodnutia: '2025-09-03',
    kolegium_nazov: 'Občianskoprávne kolégium',
    merito: 'Dovolanie zamietnuté',
    headline: 'Nárok na «náhradu škody» vznikol porušením povinnosti',
    snippet: 'Súd uzavrel, že nárok na náhradu škody je dôvodný.',
    text_source: 'api',
    position: 1,
    ...over,
  };
}

export const WARNING_ENVELOPE = (data: readonly WireRow[]): { data: readonly WireRow[]; warnings: readonly { code: string; message: string }[] } => ({
  data,
  warnings: [{ code: 'embed_unavailable', message: 'The embedding provider is unavailable; the result is lexical only.' }],
});

/** One row of `rozhodnutie` (a slice of the text). */
export function decisionWire(over: WireRow = {}): WireRow {
  return {
    id: DEC_ID,
    fonte: 'nsud-decisions',
    source_id: '247296',
    court: 'NSSR',
    cislo: '8Cdo/21/2014',
    senat: '8Cdo',
    ecli: 'ECLI:SK:NSSR:2014:1234567890.1',
    datum_rozhodnutia: '2025-09-03',
    kolegium: '1',
    kolegium_nazov: 'Občianskoprávne kolégium',
    merito: 'Dovolanie zamietnuté',
    sudca: 'JUDr. Ján Novák',
    text: 'Prvý úsek textu.\nDruhý riadok.',
    text_length: 30,
    truncated: false,
    next_offset: null,
    text_source: 'api',
    pdf_url: 'https://www.nsud.sk/data/att/247296_subor.pdf',
    source_url: 'https://www.nsud.sk/rozhodnutia/8cdo212014/',
    pii_flags: 0,
    ...over,
  };
}

/** One row of `status.coverage` (the jsonb array arrives as JSON values, D114). */
export function coverageWire(over: WireRow = {}): WireRow {
  return { window_from: '2026-09-01', window_to: '2026-09-30', ids_listed: 27, ids_taken: 25, pdf_only: 2, ...over };
}

/** One court row of `status`; the jsonb members arrive as JSON values (D114). */
export function statusWire(over: WireRow = {}): WireRow {
  return {
    court: 'NSSR',
    decisions: 1200,
    year_min: 2008,
    year_max: 2026,
    text_sources: { api: 900, pdf: 280, ocr: 20 },
    by_kolegium: { '1': 500, '2': 300, '3': 250, '4': 150 },
    by_year: { '2008': 70, '2026': 40 },
    pii_flags_total: 0,
    passages_total: 5000,
    passages_pending: 0,
    skipped: { ocr_empty: 2, pdf_unreachable: 1 },
    coverage: [coverageWire(), coverageWire({ window_from: '2026-10-01', window_to: '2026-10-31', ids_listed: 9, ids_taken: 9, pdf_only: 0 })],
    last_ingested_at: '2026-11-10T08:30:00Z',
    honest_limits: 'Iba Najvyssi sud SR od roku 2005. Fulltext simple: bez stemmingu.',
    ...over,
  };
}

/** The single row the Tool answers on an empty corpus. */
export function emptyStatusWire(): WireRow {
  return statusWire({
    court: null,
    decisions: 0,
    year_min: null,
    year_max: null,
    text_sources: {},
    by_kolegium: {},
    by_year: {},
    passages_total: 0,
    skipped: {},
    coverage: [],
    last_ingested_at: null,
  });
}
