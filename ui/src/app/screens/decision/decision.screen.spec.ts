import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { judikaturaProviders } from '../../providers';
import { must } from '../../testing/dom';
import { DEC_ID, DEC_ID_2, decisionWire } from '../../testing/judikatura-fixtures';
import { callsOf, schemaViolations, stubJudikaturaEnvironment } from '../../testing/stub-judikatura-tools';
import { DecisionScreen } from './decision.screen';

type Handler = (input: object) => unknown;

function setup(subPath: string, rozhodnutie: Handler = () => [decisionWire()], overrides: Parameters<typeof stubJudikaturaEnvironment>[1] = {}) {
  const env = stubJudikaturaEnvironment({ rozhodnutie, search: () => [], lookup: () => [], status: () => [] }, { locale: 'en', subPath, ...overrides });
  TestBed.configureTestingModule({ providers: [...judikaturaProviders] });
  const fixture = TestBed.createComponent(DecisionScreen);
  fixture.componentRef.setInput('context', env.context());
  return { env, fixture };
}

type Fixture = ComponentFixture<DecisionScreen>;

async function settle(fixture: Fixture): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await vi.waitFor(() => undefined);
    await Promise.resolve();
    fixture.detectChanges();
  }
}

const root = (fixture: Fixture): HTMLElement => fixture.nativeElement as HTMLElement;
const el = (fixture: Fixture, id: string): HTMLElement => must(root(fixture), `[data-testid="${id}"]`);
const has = (fixture: Fixture, id: string): boolean => root(fixture).querySelector(`[data-testid="${id}"]`) !== null;

async function loaded(subPath: string, rozhodnutie?: Handler, overrides: Parameters<typeof stubJudikaturaEnvironment>[1] = {}) {
  const made = setup(subPath, rozhodnutie, overrides);
  made.fixture.detectChanges();
  await settle(made.fixture);
  return made;
}

const KEY = `dec~${DEC_ID}`;

describe('DecisionScreen', () => {
  describe('loading', () => {
    it('should call rozhodnutie once with the id, offset 0 and length 20000 and nothing else when the key is a dec uuid', async () => {
      const { env, fixture } = setup(KEY);
      expect(env.calls).toEqual([]); // nothing in the constructor (P78-30)
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'rozhodnutie')).toEqual([{ id: DEC_ID, offset: 0, length: 20000 }]);
      expect(env.calls).toHaveLength(1);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should render the header with court badge, cislo, senat, kolegium name, ECLI, date and judge when the decision is loaded', async () => {
      const { fixture } = await loaded(KEY);
      const header = el(fixture, 'dec-header').textContent;
      expect(el(fixture, 'dec-court').textContent.trim()).toBe('NS SR');
      expect(header).toContain('8Cdo/21/2014');
      expect(header).toContain('Senate 8Cdo');
      expect(header).toContain('Občianskoprávne kolégium');
      expect(el(fixture, 'dec-ecli').textContent).toContain('ECLI:SK:NSSR:2014:1234567890.1');
      expect(header).toContain('2025-09-03');
      expect(el(fixture, 'dec-sudca').textContent).toContain('JUDr. Ján Novák');
      expect(el(fixture, 'dec-merito').textContent).toContain('Dovolanie zamietnuté');
      expect(el(fixture, 'dec-text').textContent).toContain('Prvý úsek textu.');
    });

    it('should show the no-ECLI wording and no judge line when the decision has neither', async () => {
      const { fixture } = await loaded(KEY, () => [decisionWire({ ecli: null, sudca: null, senat: null, merito: null })]);
      expect(el(fixture, 'dec-no-ecli').textContent).toContain('no ECLI (before 2011/2014)');
      expect(has(fixture, 'dec-ecli')).toBe(false);
      expect(has(fixture, 'dec-sudca')).toBe(false);
      expect(has(fixture, 'dec-merito')).toBe(false);
    });

    it('should reload with the new id when the key changes', async () => {
      const { env, fixture } = await loaded(KEY, (input) => [decisionWire({ id: (input as { id: string }).id, cislo: (input as { id: string }).id === DEC_ID ? '8Cdo/21/2014' : '1Obdo/5/2024' })]);
      env.update({ subPath: `dec~${DEC_ID_2}` });
      fixture.componentRef.setInput('context', env.context());
      fixture.detectChanges();
      await settle(fixture);
      expect(callsOf(env, 'rozhodnutie')).toEqual([
        { id: DEC_ID, offset: 0, length: 20000 },
        { id: DEC_ID_2, offset: 0, length: 20000 },
      ]);
      expect(el(fixture, 'dec-header').textContent).toContain('1Obdo/5/2024');
    });

    it('should render Slovak and Italian titles when the locale is sk or it', async () => {
      expect(el((await loaded(KEY, undefined, { locale: 'sk' })).fixture, 'screen-title').textContent.trim()).toBe('Rozhodnutie');
      TestBed.resetTestingModule();
      expect(el((await loaded(KEY, undefined, { locale: 'it' })).fixture, 'screen-title').textContent.trim()).toBe('Decisione');
    });
  });

  describe('text slices', () => {
    const SLICE_1 = 'a'.repeat(20000);
    const handler: Handler = (input) => {
      const { offset } = input as { offset: number };
      return offset === 0
        ? [decisionWire({ text: SLICE_1, text_length: 25000, truncated: true, next_offset: 20000 })]
        : [decisionWire({ text: 'b'.repeat(5000), text_length: 25000, truncated: false, next_offset: null })];
    };

    it('should append the next slice with offset = next_offset and hide the button at the end when "next slice" is pressed', async () => {
      const { env, fixture } = await loaded(KEY, handler);
      expect(el(fixture, 'dec-length').textContent).toContain('20000 of 25000 characters');
      el(fixture, 'dec-next').click();
      await settle(fixture);
      expect(callsOf(env, 'rozhodnutie').at(-1)).toEqual({ id: DEC_ID, offset: 20000, length: 20000 });
      expect(el(fixture, 'dec-text').textContent).toBe(SLICE_1 + 'b'.repeat(5000));
      expect(el(fixture, 'dec-length').textContent).toContain('25000 of 25000 characters');
      expect(has(fixture, 'dec-next')).toBe(false);
      expect(schemaViolations(env)).toEqual([]);
    });

    it('should not show the next slice button when the first slice is the whole text', async () => {
      const { fixture } = await loaded(KEY);
      expect(has(fixture, 'dec-next')).toBe(false);
      expect(el(fixture, 'dec-length').textContent).toContain('30 of 30 characters');
    });

    it('should keep the loaded text and show an error when the next slice fails', async () => {
      const { fixture } = await loaded(KEY, (input) => {
        if ((input as { offset: number }).offset > 0) {
          throw new Error('slice down');
        }
        return [decisionWire({ text: 'prvy', text_length: 9, truncated: true, next_offset: 4 })];
      });
      el(fixture, 'dec-next').click();
      await settle(fixture);
      expect(el(fixture, 'dec-slice-error').textContent).toContain('slice down');
      expect(el(fixture, 'dec-text').textContent).toBe('prvy');
    });
  });

  describe('badges', () => {
    it('should show the text source badge as API text, PDF text or OCR when text_source is api, pdf or ocr', async () => {
      const seen: string[] = [];
      for (const source of ['api', 'pdf', 'ocr']) {
        TestBed.resetTestingModule();
        const { fixture } = await loaded(KEY, () => [decisionWire({ text_source: source })]);
        seen.push(el(fixture, 'dec-text-source').textContent.trim());
      }
      expect(seen).toEqual(['API text', 'PDF text', 'OCR']);
    });

    it('should show the OCR hint only when the text comes from OCR', async () => {
      const { fixture } = await loaded(KEY, () => [decisionWire({ text_source: 'ocr' })]);
      expect(el(fixture, 'dec-text-source').getAttribute('title')).toContain('OCR');
      TestBed.resetTestingModule();
      const api = await loaded(KEY);
      expect(el(api.fixture, 'dec-text-source').getAttribute('title')).toBeNull();
    });

    it('should show the shape-guard badge with the count only when pii_flags is above 0', async () => {
      const none = await loaded(KEY);
      expect(has(none.fixture, 'dec-pii')).toBe(false);
      TestBed.resetTestingModule();
      const some = await loaded(KEY, () => [decisionWire({ pii_flags: 3 })]);
      expect(el(some.fixture, 'dec-pii').textContent.trim()).toBe('3 personal-data-shaped strings found; reported to the operator');
    });
  });

  describe('links', () => {
    it('should link the PDF and the source with target _blank and rel noopener noreferrer when both are https', async () => {
      const { fixture } = await loaded(KEY);
      for (const id of ['dec-pdf', 'dec-source']) {
        const link = el(fixture, id) as HTMLAnchorElement;
        expect(link.getAttribute('href')?.startsWith('https://www.nsud.sk/')).toBe(true);
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      }
      expect(el(fixture, 'dec-pdf').getAttribute('href')).toBe('https://www.nsud.sk/data/att/247296_subor.pdf');
    });

    it('should render no link when the url is not https or missing', async () => {
      const { fixture } = await loaded(KEY, () => [decisionWire({ pdf_url: 'http://www.nsud.sk/x.pdf', source_url: 'javascript:alert(1)' })]);
      expect(has(fixture, 'dec-pdf')).toBe(false);
      expect(has(fixture, 'dec-source')).toBe(false);
      TestBed.resetTestingModule();
      const missing = await loaded(KEY, () => [decisionWire({ pdf_url: null, source_url: null })]);
      expect(has(missing.fixture, 'dec-pdf')).toBe(false);
      expect(has(missing.fixture, 'dec-source')).toBe(false);
    });
  });

  describe('text rendering', () => {
    it('should keep markup in the text literal and the line breaks through a css class when the text has a tag and a newline', async () => {
      const { fixture } = await loaded(KEY, () => [decisionWire({ text: 'riadok <b>tucne</b> <script>alert(1)</script>\ndruhy', text_length: 49 })]);
      const text = el(fixture, 'dec-text');
      expect(text.textContent).toBe('riadok <b>tucne</b> <script>alert(1)</script>\ndruhy');
      expect(text.querySelector('b')).toBeNull();
      expect(root(fixture).querySelector('script')).toBeNull();
      expect(text.getAttribute('style')).toBeNull();
      expect(text.classList.contains('text')).toBe(true);
    });

    it('should define white-space pre-wrap on the text class in the stylesheet', () => {
      const css = readFileSync(join(process.cwd(), 'src', 'app', 'screens', 'decision', 'decision-view.component.css'), 'utf8');
      expect(css).toMatch(/\.text\s*\{[^}]*white-space:\s*pre-wrap/);
    });
  });

  describe('states', () => {
    it('should show not found when the id is unknown', async () => {
      const { fixture } = await loaded(KEY, () => []);
      expect(el(fixture, 'dec-notfound').textContent).toContain('not found');
      expect(has(fixture, 'dec-header')).toBe(false);
    });

    it('should show a hint and call no Tool when the key is missing or malformed', async () => {
      for (const subPath of ['', 'something', 'dec~', 'dec~not-a-uuid', `doc~${DEC_ID}`]) {
        TestBed.resetTestingModule();
        const { env, fixture } = await loaded(subPath);
        expect(has(fixture, 'dec-hint'), subPath).toBe(true);
        expect(env.calls, subPath).toEqual([]);
      }
    });

    it('should show the error and not throw when the Tool fails', async () => {
      const { fixture } = await loaded(KEY, () => {
        throw new Error('boom');
      });
      expect(el(fixture, 'dec-error').textContent).toContain('could not be loaded');
      expect(el(fixture, 'dec-error').textContent).toContain('boom');
    });

    it('should navigate to the corpus when back is pressed', async () => {
      const navigateScreen = vi.fn();
      const { fixture } = await loaded(KEY, undefined, { navigateScreen });
      el(fixture, 'dec-back').click();
      expect(navigateScreen).toHaveBeenCalledExactlyOnceWith('corpus');
    });
  });

  describe('attribution', () => {
    it('should show the attribution and the not-a-source-of-law line in en, sk and it', async () => {
      const expected: Record<string, string> = {
        en: 'Najvyssi sud SR - OpenData (nsud.sk); decisions are anonymised by the Court; licence not named; not a source of law',
        sk: 'Najvyšší súd SR - OpenData (nsud.sk); rozhodnutia anonymizuje súd; licencia nie je uvedená; nie je prameň práva',
        it: 'Najvyssi sud SR - OpenData (nsud.sk); le decisioni sono anonimizzate dalla Corte; licenza non indicata; non è una fonte del diritto',
      };
      for (const [locale, line] of Object.entries(expected)) {
        TestBed.resetTestingModule();
        const { fixture } = await loaded(KEY, undefined, { locale: locale as 'en' | 'sk' | 'it' });
        expect(el(fixture, 'dec-attribution').textContent.trim(), locale).toBe(line);
        expect(el(fixture, 'dec-not-law').textContent.trim(), locale).not.toBe('');
      }
    });
  });
});
