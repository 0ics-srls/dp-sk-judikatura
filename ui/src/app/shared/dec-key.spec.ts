import { decKey, parseDecKey } from './dec-key';

const ID = '3f2b8c1e-6d3a-4a52-9f0e-1c2d3e4f5a6b';

describe('dec key', () => {
  it('should build dec~<uuid> without any encoding when the id is a uuid', () => {
    expect(decKey(ID)).toBe(`dec~${ID}`);
  });

  it('should parse the id back when the key is dec~<uuid> in either letter case', () => {
    expect(parseDecKey(`dec~${ID}`)).toBe(ID);
    expect(parseDecKey(`dec~${ID.toUpperCase()}`)).toBe(ID.toUpperCase());
  });

  it('should give null when the key is empty, has another prefix or no uuid', () => {
    for (const key of ['', 'dec~', 'dec~abc', `doc~${ID}`, ID, `dec~${ID}x`]) {
      expect(parseDecKey(key), key).toBeNull();
    }
  });
});
