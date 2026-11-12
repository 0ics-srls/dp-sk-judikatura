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
