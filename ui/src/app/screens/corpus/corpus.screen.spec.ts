import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { judikaturaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { DEC_ID, DEC_ID_2, lookupWire, searchWire, WARNING_ENVELOPE } from '../../testing/judikatura-fixtures';
import { callsOf, schemaViolations, stubJudikaturaEnvironment } from '../../testing/stub-judikatura-tools';
import { CorpusScreen } from './corpus.screen';

type Handler = (input: object) => unknown;

interface Handlers {
  readonly lookup?: Handler;
  readonly search?: Handler;
}

function setup(handlers: Handlers, overrides: Parameters<typeof stubJudikaturaEnvironment>[1] = {}) {
  const env = stubJudikaturaEnvironment(
    { lookup: handlers.lookup ?? (() => []), search: handlers.search ?? (() => []), rozhodnutie: () => [], status: () => [] },
    { locale: 'en', ...overrides },
  );
  TestBed.configureTestingModule({ providers: [...judikaturaProviders] });
  const fixture = TestBed.createComponent(CorpusScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<CorpusScreen>;

async function settle(fixture: Fixture, ms = 0): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  fixture.detectChanges();
  for (let i = 0; i < 3; i++) {
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const all = (fixture: Fixture, id: string): HTMLElement[] => [...root(fixture).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

function type(fixture: Fixture, id: string, value: string): void {
  const input = el(fixture, id) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function choose(fixture: Fixture, id: string, value: string): void {
  const select = el(fixture, id) as HTMLSelectElement;
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

const pagedList = (total: number): Handler => (input) => {
  const { offset, limit } = input as { offset?: number; limit?: number };
  const from = offset ?? 0;
  return Array.from({ length: Math.max(0, Math.min(limit ?? 20, total - from)) }, (_, i) =>
    lookupWire({ id: `00000000-0000-0000-0000-${String(from + i + 1).padStart(12, '0')}`, cislo: `8Cdo/${String(from + i + 1)}/2025`, total }),
  );
};

describe('CorpusScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('first open', () => {
    it('should call lookup once with an empty argument object and nothing else when the Screen opens', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire(), lookupWire({ id: DEC_ID_2, cislo: '1Obdo/5/2024', total: 3 })] });
      expect(env.calls).toEqual([]); // nothing in the constructor (P78-30)
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'lookup')).toEqual([{}]);
      expect(callsOf(env, 'search')).toEqual([]);
      expect(env.calls).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
      const rows = all(fixture, 'corpus-row');
      expect(rows).toHaveLength(2);
      const text = rows[0]?.textContent ?? '';
      expect(text).toContain('NS SR');
      expect(text).toContain('8Cdo/21/2014');
      expect(text).toContain('ECLI:SK:NSSR:2014:1234567890.1');
      expect(text).toContain('2025-09-03');
      expect(text).toContain('Občianskoprávne kolégium');
      expect(text).toContain('Dovolanie zamietnuté');
    });

    it('should show the attribution, the not-a-source-of-law line and the no-stemming hint when the Screen opens', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-attribution').textContent).toContain('Najvyssi sud SR - OpenData (nsud.sk); decisions are anonymised by the Court; licence not named; not a source of law');
      expect(el(fixture, 'corpus-not-law').textContent).toContain('NOT a source of law');
      expect(el(fixture, 'corpus-no-stemming').textContent).toContain('no stemming');
    });

    it('should render Slovak texts when the locale is sk', async () => {
      const { fixture } = setup({ lookup: () => [] }, { locale: 'sk' });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Judikatúra SR');
    });

    it('should render Italian texts when the locale is it', async () => {
      const { fixture } = setup({ lookup: () => [] }, { locale: 'it' });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'screen-title').textContent.trim()).toBe('Giurisprudenza slovacca');
    });

    it('should omit the ECLI and show nothing in its place when the decision has none', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire({ ecli: null })] });
      fixture.detectChanges();
      await settle(fixture);
      expect(has(fixture, 'corpus-ecli')).toBe(false);
    });

    it('should show the PDF badge only when text_source is pdf or ocr', async () => {
      const { fixture } = setup({
        lookup: () => [
          lookupWire({ text_source: 'api' }),
          lookupWire({ id: DEC_ID_2, text_source: 'pdf' }),
          lookupWire({ id: '00000000-0000-0000-0000-000000000003', text_source: 'ocr' }),
        ],
      });
      fixture.detectChanges();
      await settle(fixture);
      const rows = all(fixture, 'corpus-row');
      expect(rows.map((row) => row.querySelector('[data-testid="corpus-pdf"]') !== null)).toEqual([false, true, true]);
      expect(rows[1]?.querySelector('[data-testid="corpus-pdf"]')?.textContent.trim()).toBe('PDF');
    });
  });

  describe('paging of the list', () => {
    it('should ask offset 20 (the Tool default page) when the next page is chosen and show the range from total', async () => {
      const { env, fixture } = setup({ lookup: pagedList(45) });
      fixture.detectChanges();
      await settle(fixture);
      expect(all(fixture, 'corpus-row')).toHaveLength(20);
      expect(el(fixture, 'corpus-range').textContent).toContain('1-20');
      expect(el(fixture, 'corpus-range').textContent).toContain('45');
      expect((el(fixture, 'corpus-prev') as HTMLButtonElement).disabled).toBe(true);
      el(fixture, 'corpus-next').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ offset: 20 });
      expect(all(fixture, 'corpus-row')[0]?.textContent).toContain('8Cdo/21/2025');
      expect((el(fixture, 'corpus-prev') as HTMLButtonElement).disabled).toBe(false);
      el(fixture, 'corpus-next').click();
      await settle(fixture);
      expect(el(fixture, 'corpus-range').textContent).toContain('41-45');
      expect((el(fixture, 'corpus-next') as HTMLButtonElement).disabled).toBe(true);
      el(fixture, 'corpus-prev').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ offset: 20 });
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should send the sort choice only when it differs from the Tool default', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-sort', 'datum_asc');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ sort: 'datum_asc' });
      choose(fixture, 'corpus-sort', 'cislo');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ sort: 'cislo' });
      choose(fixture, 'corpus-sort', 'datum_desc');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
      expect(schemaViolations(env)).toEqual([]);
    });
  });

  describe('search', () => {
    it('should call search once with the query and k 50 after the 300 ms debounce when the user types', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'nahr');
      await settle(fixture, 100);
      type(fixture, 'corpus-search', 'nahrada skody');
      await settle(fixture, 100);
      expect(callsOf(env, 'search')).toEqual([]); // still inside the debounce
      await settle(fixture, 300);
      expect(callsOf(env, 'search')).toEqual([{ query: 'nahrada skody', k: 50 }]);
      expect(callsOf(env, 'lookup')).toEqual([{}]);
      expect(all(fixture, 'corpus-row')).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should send court, kolegium code, the date range and a non-default mode with the query when filters are set', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-court', 'NSSR');
      choose(fixture, 'corpus-kolegium', 'administrative');
      type(fixture, 'corpus-datum-from', '2020-01-01');
      type(fixture, 'corpus-datum-to', '2024-12-31');
      choose(fixture, 'corpus-mode', 'lexical');
      type(fixture, 'corpus-search', 'nahrada skody');
      await settle(fixture, 400);
      expect(callsOf(env, 'search').at(-1)).toEqual({
        query: 'nahrada skody',
        k: 50,
        mode: 'lexical',
        court: 'NSSR',
        kolegium: 3,
        datum_from: '2020-01-01',
        datum_to: '2024-12-31',
      });
      expect(el(fixture, 'corpus-mode-shown').textContent).toContain('lexical');
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should map the four kolegium choices to the codes 1 to 4 when each is chosen', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      const sent: unknown[] = [];
      for (const name of ['civil', 'commercial', 'administrative', 'criminal']) {
        choose(fixture, 'corpus-kolegium', name);
        await settle(fixture);
        sent.push((callsOf(env, 'lookup').at(-1) as { kolegium?: number }).kolegium);
      }
      expect(sent).toEqual([1, 2, 3, 4]);
      choose(fixture, 'corpus-kolegium', '');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
    });

    it('should render the marked words as mark text nodes and never as html when the headline carries markers and a script', async () => {
      const headline = 'Nárok na «náhradu škody» <script>alert(1)</script> <img src=x onerror=alert(2)>';
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire({ headline })] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'nahrada');
      await settle(fixture, 400);
      const line = el(fixture, 'corpus-headline');
      const marks = [...line.querySelectorAll('mark')];
      expect(marks.map((mark) => mark.textContent)).toEqual(['náhradu škody']);
      expect(line.querySelector('script')).toBeNull();
      expect(line.querySelector('img')).toBeNull();
      expect(line.textContent).toContain('<script>alert(1)</script>');
      expect(root(fixture).querySelector('script')).toBeNull();
    });

    it('should show the snippet when the hit has no headline', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire({ headline: null, snippet: 'Len úryvok.' })] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'uryvok');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-headline')).toBe(false);
      expect(el(fixture, 'corpus-snippet').textContent).toContain('Len úryvok.');
    });

    it('should show the PDF badge on a search hit when text_source is pdf', async () => {
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire({ text_source: 'pdf' })] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'pdf');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-pdf')).toBe(true);
    });

    it('should show the warnings note only when the envelope carries a warning', async () => {
      const { fixture } = setup({
        lookup: () => [lookupWire()],
        search: (input) => ((input as { query: string }).query === 'degraded' ? WARNING_ENVELOPE([searchWire()]) : [searchWire()]),
      });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'plain');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-warnings')).toBe(false);
      type(fixture, 'corpus-search', 'degraded');
      await settle(fixture, 400);
      expect(el(fixture, 'corpus-warnings').textContent).toContain('embed_unavailable');
      type(fixture, 'corpus-search', 'plain again');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-warnings')).toBe(false);
    });

    it('should return to the list when the search box is cleared', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'nahrada');
      await settle(fixture, 400);
      type(fixture, 'corpus-search', '');
      await settle(fixture, 400);
      expect(callsOf(env, 'search')).toHaveLength(1);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
    });
  });

  describe('filters without text', () => {
    it('should go to lookup with the filters when no text is typed', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-court', 'NSSSR');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ court: 'NSSSR' });
      choose(fixture, 'corpus-kolegium', 'criminal');
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ court: 'NSSSR', kolegium: 4 });
      type(fixture, 'corpus-datum-from', '2024-01-01');
      type(fixture, 'corpus-datum-to', '2025-12-31');
      await settle(fixture, 400);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ court: 'NSSSR', kolegium: 4, datum_from: '2024-01-01', datum_to: '2025-12-31' });
      expect(callsOf(env, 'search')).toEqual([]);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should not send a half typed date when the date input is incomplete', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-datum-from', '2024-01');
      await settle(fixture, 400);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
    });
  });

  describe('lookup by number', () => {
    it('should send only cislo when the lookup row is submitted with a case number', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      choose(fixture, 'corpus-court', 'NSSR');
      await settle(fixture);
      type(fixture, 'lookup-cislo', '8Cdo/21/2014');
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ court: 'NSSR' }); // typing alone does not call
      el(fixture, 'lookup-go').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ cislo: '8Cdo/21/2014' });
      expect(callsOf(env, 'search')).toEqual([]);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should send cislo and ecli only when both are given, and ecli only when it is alone', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'lookup-cislo', ' 8Cdo/21/2014 ');
      type(fixture, 'lookup-ecli', 'ECLI:SK:NSSR:2014:1');
      el(fixture, 'lookup-go').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ cislo: '8Cdo/21/2014', ecli: 'ECLI:SK:NSSR:2014:1' });
      type(fixture, 'lookup-cislo', '');
      el(fixture, 'lookup-go').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({ ecli: 'ECLI:SK:NSSR:2014:1' });
    });

    it('should leave the lookup by number and list again when the clear button is pressed', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'lookup-cislo', '8Cdo/21/2014');
      el(fixture, 'lookup-go').click();
      await settle(fixture);
      el(fixture, 'lookup-clear').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup').at(-1)).toEqual({});
    });

    it('should not call anything when the lookup row is submitted empty', async () => {
      const { env, fixture } = setup({ lookup: () => [lookupWire()] });
      fixture.detectChanges();
      await settle(fixture);
      el(fixture, 'lookup-go').click();
      await settle(fixture);
      expect(callsOf(env, 'lookup')).toEqual([{}]);
    });
  });

  describe('states', () => {
    it('should show the empty state when the Tool returns no rows', async () => {
      const { fixture } = setup({ lookup: () => [] });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-empty').textContent).toContain('No decisions');
      expect(all(fixture, 'corpus-row')).toHaveLength(0);
    });

    it('should show the error message and not throw when a Tool fails', async () => {
      const { fixture } = setup({
        lookup: () => {
          throw new Error('boom');
        },
      });
      fixture.detectChanges();
      await settle(fixture);
      expect(el(fixture, 'corpus-error').textContent).toContain('could not be loaded');
      expect(el(fixture, 'corpus-error').textContent).toContain('boom');
      expect(all(fixture, 'corpus-row')).toHaveLength(0);
    });

    it('should show the error of a failing search and recover when the text changes', async () => {
      const { fixture } = setup({
        lookup: () => [lookupWire()],
        search: (input) => {
          if ((input as { query: string }).query === 'fail') {
            throw new Error('search down');
          }
          return [searchWire()];
        },
      });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'fail');
      await settle(fixture, 400);
      expect(el(fixture, 'corpus-error').textContent).toContain('search down');
      type(fixture, 'corpus-search', 'ok');
      await settle(fixture, 400);
      expect(has(fixture, 'corpus-error')).toBe(false);
      expect(all(fixture, 'corpus-row')).toHaveLength(1);
    });
  });

  describe('rows', () => {
    it('should navigate with the raw dec key when a row is clicked', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = setup({ lookup: () => [lookupWire()] }, { navigateScreen });
      fixture.detectChanges();
      await settle(fixture);
      must(all(fixture, 'corpus-row')[0] ?? root(fixture), '[data-testid="corpus-open"]').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('decision', `dec~${DEC_ID}`);
    });

    it('should navigate from a search hit with the same key', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = setup({ lookup: () => [lookupWire()], search: () => [searchWire()] }, { navigateScreen });
      fixture.detectChanges();
      await settle(fixture);
      type(fixture, 'corpus-search', 'nahrada');
      await settle(fixture, 400);
      must(all(fixture, 'corpus-row')[0] ?? root(fixture), '[data-testid="corpus-open"]').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('decision', `dec~${DEC_ID}`);
    });

    it('should link the source only for https and open it safely when the row has a source url', async () => {
      const { fixture } = setup({
        lookup: () => [
          lookupWire(),
          lookupWire({ id: DEC_ID_2, source_url: 'javascript:alert(1)' }),
          lookupWire({ id: '00000000-0000-0000-0000-000000000003', source_url: null }),
        ],
      });
      fixture.detectChanges();
      await settle(fixture);
      const links = all(fixture, 'corpus-source');
      expect(links).toHaveLength(1);
      const link = links[0] as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('https://www.nsud.sk/rozhodnutia/8cdo212014/');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
