import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { judikaturaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { coverageWire, emptyStatusWire, statusWire } from '../../testing/judikatura-fixtures';
import { callsOf, schemaViolations, stubJudikaturaEnvironment } from '../../testing/stub-judikatura-tools';
import { StatusScreen } from './status.screen';

type Handler = (input: object) => unknown;

function setup(status: Handler, overrides: Parameters<typeof stubJudikaturaEnvironment>[1] = {}) {
  const env = stubJudikaturaEnvironment({ status, search: () => [], lookup: () => [], rozhodnutie: () => [] }, { locale: 'en', ...overrides });
  TestBed.configureTestingModule({ providers: [...judikaturaProviders] });
  const fixture = TestBed.createComponent(StatusScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<StatusScreen>;

async function settle(fixture: Fixture): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await vi.waitFor(() => undefined);
    await Promise.resolve();
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const all = (fixture: Fixture, id: string): HTMLElement[] => [...root(fixture).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

async function loaded(status: Handler, overrides: Parameters<typeof stubJudikaturaEnvironment>[1] = {}) {
  const made = setup(status, overrides);
  made.fixture.detectChanges();
  await settle(made.fixture);
  return made;
}

const TWO_COURTS = (): unknown[] => [
  statusWire(),
  statusWire({
    court: 'NSSSR',
    decisions: 300,
    year_min: 2012,
    year_max: 2026,
    text_sources: { api: 290, pdf: 10 },
    by_kolegium: { '3': 300 },
    passages_total: 800,
    passages_pending: 12,
    pii_flags_total: 4,
  }),
];

describe('StatusScreen', () => {
  describe('loading', () => {
    it('should call status once with an empty argument object and nothing else when the Screen opens', async () => {
      const { env, fixture } = setup(() => [statusWire()]);
      expect(env.calls).toEqual([]); // nothing in the constructor (P78-30)
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'status')).toEqual([{}]);
      expect(env.calls).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should call status again only when refresh is pressed', async () => {
      const { env, fixture } = await loaded(() => [statusWire()]);
      el(fixture, 'status-refresh').click();
      await settle(fixture);
      expect(callsOf(env, 'status')).toHaveLength(2);
    });
  });

  describe('court table', () => {
    it('should render decisions, years, API, PDF and OCR counts and passages per court when the stub answers', async () => {
      const { fixture } = await loaded(TWO_COURTS);
      const rows = all(fixture, 'status-row');
      expect(rows).toHaveLength(2);
      const first = rows[0];
      expect(first?.textContent).toContain('NS SR');
      expect(first?.textContent).toContain('1200');
      expect(first?.textContent).toContain('2008-2026');
      expect(first?.querySelector('[data-testid="status-api"]')?.textContent.trim()).toBe('900');
      expect(first?.querySelector('[data-testid="status-pdf"]')?.textContent.trim()).toBe('280');
      expect(first?.querySelector('[data-testid="status-ocr"]')?.textContent.trim()).toBe('20');
      expect(first?.querySelector('[data-testid="status-passages"]')?.textContent.trim()).toBe('5000');
      const second = rows[1];
      expect(second?.textContent).toContain('NSS SR');
      expect(second?.querySelector('[data-testid="status-ocr"]')?.textContent.trim()).toBe('0'); // a missing key is 0
    });

    it('should render the decisions by chamber with the chamber names when by_kolegium is present', async () => {
      const { fixture } = await loaded(TWO_COURTS);
      const text = all(fixture, 'status-row')[0]?.querySelector('[data-testid="status-kolegium"]')?.textContent ?? '';
      expect(text).toContain('Civil');
      expect(text).toContain('500');
      expect(text).toContain('Criminal');
    });

    it('should show the pending warning badge only for a court whose passages_pending is above 0 and use the translated string', async () => {
      const { fixture } = await loaded(TWO_COURTS);
      const rows = all(fixture, 'status-row');
      expect(rows[0]?.querySelector('[data-testid="status-warning"]')).toBeNull();
      const badge = must(rows[1] ?? root(fixture), '[data-testid="status-warning"]');
      expect(badge.textContent.trim()).toBe('12');
      expect(badge.getAttribute('title')).toBe('Passages without an embedding are not reachable by the semantic search.');
      expect(el(fixture, 'status-pending-note').textContent.trim()).toBe('Passages without an embedding are not reachable by the semantic search.');
    });

    it('should show no pending warning at all when every court has passages_pending 0', async () => {
      const { fixture } = await loaded(() => [statusWire()]);
      expect(has(fixture, 'status-warning')).toBe(false);
      expect(has(fixture, 'status-pending-note')).toBe(false);
    });

    it('should translate the pending warning into Slovak and Italian when the locale is sk or it', async () => {
      const sk = await loaded(() => [statusWire({ passages_pending: 3 })], { locale: 'sk' });
      expect(el(sk.fixture, 'status-warning').getAttribute('title')).toBe('Pasáže bez embeddingu sa nedajú nájsť sémantickým vyhľadávaním.');
      TestBed.resetTestingModule();
      const it = await loaded(() => [statusWire({ passages_pending: 3 })], { locale: 'it' });
      expect(el(it.fixture, 'status-warning').getAttribute('title')).toBe('I passaggi senza embedding non sono raggiungibili dalla ricerca semantica.');
    });

    it('should show the shape-guard total over the courts when the rows carry pii_flags_total', async () => {
      const { fixture } = await loaded(TWO_COURTS);
      expect(el(fixture, 'status-pii').textContent).toContain('4');
    });

    it('should show the shape-guard total 0 when no court has a hit', async () => {
      const { fixture } = await loaded(() => [statusWire()]);
      expect(el(fixture, 'status-pii').textContent).toContain(': 0');
    });

    it('should show the last ingest date when a court has one', async () => {
      const { fixture } = await loaded(() => [statusWire()]);
      expect(el(fixture, 'status-last').textContent).toContain('2026-11-10');
    });
  });

  describe('corpus-wide parts', () => {
    it('should list the skipped items by reason once when the jsonb map arrives as a JSON value', async () => {
      const { fixture } = await loaded(TWO_COURTS);
      const skipped = all(fixture, 'status-skipped');
      expect(skipped).toHaveLength(1);
      expect(skipped[0]?.textContent).toContain('ocr_empty');
      expect(skipped[0]?.textContent).toContain('pdf_unreachable');
    });

    it('should hide the skipped block when nothing was skipped', async () => {
      const { fixture } = await loaded(() => [statusWire({ skipped: {} })]);
      expect(has(fixture, 'status-skipped')).toBe(false);
    });

    it('should render the coverage rows with month, ids listed, taken and PDF only, newest first, when the jsonb array arrives as a JSON value', async () => {
      const { fixture } = await loaded(() => [statusWire()]);
      const rows = all(fixture, 'coverage-row');
      expect(rows).toHaveLength(2);
      expect(rows[0]?.textContent).toContain('2026-10');
      expect(rows[1]?.textContent).toContain('2026-09');
      const cells = [...(rows[1]?.querySelectorAll('td') ?? [])].map((cell) => cell.textContent.trim());
      expect(cells).toEqual(['2026-09', '27', '25', '2']);
    });

    it('should also render the jsonb members when the host serialises them as text', async () => {
      const { fixture } = await loaded(() => [
        statusWire({
          text_sources: JSON.stringify({ api: 5, pdf: 3, ocr: 1 }),
          skipped: JSON.stringify({ ocr_empty: 2 }),
          coverage: JSON.stringify([coverageWire()]),
        }),
      ]);
      expect(el(fixture, 'status-api').textContent.trim()).toBe('5');
      expect(el(fixture, 'status-skipped').textContent).toContain('ocr_empty');
      expect(all(fixture, 'coverage-row')).toHaveLength(1);
    });

    it('should show the honest limits text from the Tool and the licence footer when the corpus has rows', async () => {
      const { fixture } = await loaded(() => [statusWire()]);
      expect(el(fixture, 'status-limits').textContent).toContain('Iba Najvyssi sud SR od roku 2005. Fulltext simple: bez stemmingu.');
      expect(el(fixture, 'status-footer').textContent).toContain('Najvyssi sud SR - OpenData (nsud.sk); decisions are anonymised by the Court; licence not named; not a source of law');
    });
  });

  describe('states', () => {
    it('should show the empty state, the limits and no table when the corpus is empty', async () => {
      const { fixture } = await loaded(() => [emptyStatusWire()]);
      expect(el(fixture, 'status-empty').textContent).toContain('No decisions yet');
      expect(all(fixture, 'status-row')).toHaveLength(0);
      expect(has(fixture, 'coverage-row')).toBe(false);
      expect(el(fixture, 'status-limits').textContent).toContain('Fulltext simple');
    });

    it('should show the empty state and not throw when the Tool answers no rows', async () => {
      const { fixture } = await loaded(() => []);
      expect(has(fixture, 'status-empty')).toBe(true);
    });

    it('should show the error message and not throw when the Tool fails, and recover on refresh', async () => {
      let fail = true;
      const { fixture } = await loaded(() => {
        if (fail) {
          throw new Error('boom');
        }
        return [statusWire()];
      });
      expect(el(fixture, 'status-error').textContent).toContain('could not be loaded');
      expect(el(fixture, 'status-error').textContent).toContain('boom');
      fail = false;
      el(fixture, 'status-refresh').click();
      await settle(fixture);
      expect(has(fixture, 'status-error')).toBe(false);
      expect(all(fixture, 'status-row')).toHaveLength(1);
    });
  });

  describe('labels', () => {
    it('should render the title and a column header in sk, en and it when the locale changes', async () => {
      const expected: Record<string, [string, string]> = {
        en: ['Corpus status', 'Decisions'],
        sk: ['Stav korpusu', 'Rozhodnutia'],
        it: ['Stato del corpus', 'Decisioni'],
      };
      for (const [locale, [title, column]] of Object.entries(expected)) {
        TestBed.resetTestingModule();
        const { fixture } = await loaded(() => [statusWire()], { locale: locale as 'en' | 'sk' | 'it' });
        expect(el(fixture, 'screen-title').textContent.trim(), locale).toBe(title);
        expect(root(fixture).querySelector('thead')?.textContent, locale).toContain(column);
      }
    });
  });
});
