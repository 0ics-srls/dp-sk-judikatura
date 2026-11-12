import { computed, inject, Injectable, signal } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import { decKey } from '../../shared/dec-key';
import { ListStore } from '../../shared/list-store';
import { httpsUrl } from '../../shared/safe-url';
import { textParts, type TextPart } from '../../shared/text-parts';
import { JudikaturaTools } from '../../tools/judikatura-tools';

/** The Tool `lookup` pages by its default limit; the Screen does not send a limit so that the first open is the empty argument object (P79-56). */
export const PAGE_SIZE = 20;
/** Hits asked from `search` (the Tool maximum). */
export const SEARCH_K = 50;

export type SearchMode = 'hybrid' | 'lexical' | 'semantic';
export type SortKey = 'datum_desc' | 'datum_asc' | 'cislo';
export type CourtChoice = '' | 'NSSR' | 'NSSSR';
export type KolegiumChoice = '' | 'civil' | 'commercial' | 'administrative' | 'criminal';

/** The chambers of the Tool (`kolegium` 1..4). */
export const KOLEGIUM_CODES: Readonly<Record<Exclude<KolegiumChoice, ''>, number>> = { civil: 1, commercial: 2, administrative: 3, criminal: 4 };

export interface NumberLookup {
  readonly cislo: string;
  readonly ecli: string;
}

export interface CorpusQuery {
  readonly text: string;
  readonly court: CourtChoice;
  readonly kolegium: KolegiumChoice;
  /** `YYYY-MM-DD` or the empty string (an incomplete date is not sent). */
  readonly datumFrom: string;
  readonly datumTo: string;
  readonly mode: SearchMode;
  readonly sort: SortKey;
  readonly offset: number;
  /** Set by the "lookup by number" row: the list then shows only what these fields find. */
  readonly byNumber: NumberLookup | null;
}

/** One line of the list, whichever Tool produced it. */
export interface CorpusItem {
  readonly key: string;
  readonly id: string;
  readonly court: string;
  readonly cislo: string;
  readonly ecli: string | null;
  readonly datum: Date | null;
  readonly kolegiumNazov: string | null;
  readonly merito: string | null;
  readonly headline: readonly TextPart[];
  readonly snippet: string | null;
  /** True when the text comes from the PDF (text layer or OCR). */
  readonly pdf: boolean;
  /** Only an https link; the empty string otherwise (`search` hits have none). */
  readonly sourceUrl: string;
}

/** Which Tool a query uses: the lookup by number and the filters without text go to `lookup`, text goes to `search`. */
export function toolOf(query: CorpusQuery): 'search' | 'lookup' {
  return query.byNumber === null && query.text !== '' ? 'search' : 'lookup';
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (value: string): string | undefined => (DATE.test(value) ? value : undefined);
const orUndefined = (value: string): string | undefined => (value === '' ? undefined : value);
const kolegiumCode = (choice: KolegiumChoice): number | undefined => (choice === '' ? undefined : KOLEGIUM_CODES[choice]);
const isPdf = (textSource: string): boolean => textSource === 'pdf' || textSource === 'ocr';

@Injectable()
export class CorpusStore extends ListStore<CorpusQuery, CorpusItem> {
  private readonly tools = inject(JudikaturaTools);
  private readonly context = injectPackageContext();
  private readonly total = signal(0);

  /** Warning codes of the last answer (an embedding problem makes `search` lexical only). */
  readonly warnings = signal<readonly string[]>([]);
  readonly tool = computed(() => toolOf(this.query()));
  readonly paged = computed(() => this.tool() === 'lookup');
  readonly offset = computed(() => this.query().offset);
  readonly count = computed(() => this.total());
  readonly from = computed(() => (this.count() === 0 ? 0 : this.offset() + 1));
  readonly to = computed(() => Math.min(this.offset() + PAGE_SIZE, this.count()));
  readonly hasPrevious = computed(() => this.paged() && this.offset() > 0);
  readonly hasNext = computed(() => this.paged() && this.offset() + PAGE_SIZE < this.count());
  readonly byNumberActive = computed(() => this.query().byNumber !== null);

  constructor() {
    super({ text: '', court: '', kolegium: '', datumFrom: '', datumTo: '', mode: 'hybrid', sort: 'datum_desc', offset: 0, byNumber: null }, true);
  }

  search(text: string): void {
    this.edit({ text: text.trim(), offset: 0 });
  }

  datumFrom(value: string): void {
    this.edit({ datumFrom: value.trim(), offset: 0 });
  }

  datumTo(value: string): void {
    this.edit({ datumTo: value.trim(), offset: 0 });
  }

  court(court: string): void {
    this.choose({ court: court === 'NSSR' || court === 'NSSSR' ? court : '', offset: 0 });
  }

  kolegium(kolegium: string): void {
    this.choose({ kolegium: Object.hasOwn(KOLEGIUM_CODES, kolegium) ? (kolegium as KolegiumChoice) : '', offset: 0 });
  }

  mode(mode: string): void {
    this.choose({ mode: mode === 'lexical' || mode === 'semantic' ? mode : 'hybrid', offset: 0 });
  }

  sort(sort: string): void {
    this.choose({ sort: sort === 'datum_asc' || sort === 'cislo' ? sort : 'datum_desc', offset: 0 });
  }

  /** The "lookup by number" row: cislo and ecli only; both empty is the same as clearing it. */
  findByNumber(cislo: string, ecli: string): void {
    const lookup: NumberLookup = { cislo: cislo.trim(), ecli: ecli.trim() };
    if (lookup.cislo === '' && lookup.ecli === '') {
      return;
    }
    this.choose({ byNumber: lookup, offset: 0 });
  }

  clearByNumber(): void {
    this.choose({ byNumber: null, offset: 0 });
  }

  next(): void {
    if (this.hasNext()) {
      this.choose({ offset: this.offset() + PAGE_SIZE });
    }
  }

  previous(): void {
    if (this.hasPrevious()) {
      this.choose({ offset: Math.max(0, this.offset() - PAGE_SIZE) });
    }
  }

  open(item: CorpusItem): void {
    this.context().navigateScreen('decision', decKey(item.id));
  }

  protected override async readRows(query: CorpusQuery): Promise<readonly CorpusItem[]> {
    const court = orUndefined(query.court);
    const kolegium = kolegiumCode(query.kolegium);
    const datumFrom = date(query.datumFrom);
    const datumTo = date(query.datumTo);

    if (toolOf(query) === 'search') {
      const { rows, warnings } = await this.tools.search({
        query: query.text,
        k: SEARCH_K,
        mode: query.mode === 'hybrid' ? undefined : query.mode,
        court,
        kolegium,
        datumFrom,
        datumTo,
      });
      this.total.set(rows.length);
      this.warnings.set(warnings);
      return rows.map((hit) => ({
        key: `${hit.id}|${String(hit.position)}`,
        id: hit.id,
        court: hit.court,
        cislo: hit.cislo,
        ecli: hit.ecli,
        datum: hit.datumRozhodnutia,
        kolegiumNazov: hit.kolegiumNazov,
        merito: hit.merito,
        headline: textParts(hit.headline),
        snippet: hit.snippet,
        pdf: isPdf(hit.textSource),
        sourceUrl: '',
      }));
    }

    const offset = query.offset > 0 ? query.offset : undefined;
    const { byNumber } = query;
    const { rows, warnings } = await (byNumber === null
      ? this.tools.lookup({ court, kolegium, datumFrom, datumTo, sort: query.sort === 'datum_desc' ? undefined : query.sort, offset })
      : this.tools.lookup({ cislo: orUndefined(byNumber.cislo), ecli: orUndefined(byNumber.ecli), offset }));
    this.total.set(rows[0]?.total ?? 0);
    this.warnings.set(warnings);
    return rows.map((row) => ({
      key: row.id,
      id: row.id,
      court: row.court,
      cislo: row.cislo,
      ecli: row.ecli,
      datum: row.datumRozhodnutia,
      kolegiumNazov: row.kolegiumNazov,
      merito: row.merito,
      headline: [],
      snippet: null,
      pdf: isPdf(row.textSource),
      sourceUrl: httpsUrl(row.sourceUrl),
    }));
  }
}
