import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { APP_ROOT, flattenEntries, flattenKeys, templateKeys } from '../testing/source-scan';
import enDict from './en.json';
import itDict from './it.json';
import skDict from './sk.json';

describe('dictionaries', () => {
  it('should have the same keys in sk, en and it when compared', () => {
    const keys = flattenKeys(enDict).sort();
    expect(keys.length).toBeGreaterThan(20);
    expect(flattenKeys(skDict).sort()).toEqual(keys);
    expect(flattenKeys(itDict).sort()).toEqual(keys);
  });

  it('should have a non-empty string for every key in sk, en and it when read', () => {
    for (const dict of [skDict, enDict, itDict]) {
      for (const [key, value] of Object.entries(flattenEntries(dict))) {
        expect(typeof value, key).toBe('string');
        expect((value as string).trim(), key).not.toBe('');
      }
    }
  });

  it('should define every literal key used in a template when the sources are scanned', () => {
    const defined = new Set(flattenKeys(enDict));
    const missing = templateKeys(APP_ROOT)
      .filter((used) => !defined.has(used.key))
      .map((used) => `${used.key} (${used.path})`);
    expect(missing).toEqual([]);
  });

  it('should find template keys when scanning (no vacuous pass)', () => {
    expect(templateKeys(APP_ROOT).length).toBeGreaterThan(2);
  });

  // P84-15: Slovak users read the sk strings; these are the ASCII-folded spellings of words that need diacritics.
  const FOLDED_SK_WORDS = [
    'judikatura', 'hladat', 'nacitavam', 'udaje', 'predchadzajuca', 'dalsia', 'vsetky', 'rezim', 'sud', 'kolegium',
    'obcianskopravne', 'spravne', 'zoradit', 'nenasli', 'najst', 'spat', 'vyrok', 'senat', 'nacitat', 'otvorit',
    'obnovit', 'pasaze', 'posledny', 'preskocene', 'rozhodnute', 'stranky', 'zatial', 'najvyssi', 'pramen', 'vypisane',
    'prevzate', 'prevadzkovatelovi', 'ucinne', 'sudy',
  ];

  it('should reject ASCII-folded Slovak words in every sk string and Screen label when the dictionary and Manifest are read', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), '..', 'dataplatform.json'), 'utf8')) as {
      ui: { menu: { label: { sk: string } }; screens: { label: { sk: string } }[] };
    };
    const strings = [
      ...Object.values(flattenEntries(skDict)).map(String),
      manifest.ui.menu.label.sk,
      ...manifest.ui.screens.map((screen) => screen.label.sk),
    ];
    expect(strings.length).toBeGreaterThan(30);
    const folded = strings.flatMap((value) =>
      value
        .replace(/{{[^}]*}}/g, ' ')
        .toLowerCase()
        .split(/[^\p{L}]+/u)
        .filter((word) => FOLDED_SK_WORDS.includes(word))
        .map((word) => `${word} in "${value}"`),
    );
    expect(folded).toEqual([]);
  });

  it('should carry the attribution and the not-a-source-of-law line in sk, en and it when the dictionaries are read', () => {
    for (const dict of [skDict, enDict, itDict]) {
      const keys = flattenKeys(dict);
      expect(keys).toContain('common.attribution');
      expect(keys).toContain('common.notLaw');
      expect(JSON.stringify(dict)).toContain('nsud.sk');
    }
    expect(JSON.stringify(enDict)).toContain('Najvyssi sud SR - OpenData (nsud.sk); decisions are anonymised by the Court; licence not named; not a source of law');
  });
});
