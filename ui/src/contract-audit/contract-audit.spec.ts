import Ajv2020 from 'ajv/dist/2020';
import { join, resolve } from 'node:path';
import { APP_ROOT, scanSources, type ScannedFile } from '../app/testing/source-scan';
import { JudikaturaTool, TOOL_INPUT_KEYS } from '../app/tools/judikatura-tool';
import { forbiddenHits, loadToolDirectory, missingTools, type ToolDirectory } from './audit';

const PACKAGE_ROOT = resolve(process.cwd(), '..');
const SRC_ROOT = join(process.cwd(), 'src');
const USED: readonly string[] = Object.values(JudikaturaTool);

const production = (root: string, patterns: readonly RegExp[]): readonly ScannedFile[] =>
  scanSources(root, patterns).filter((file) => {
    const path = file.path.replaceAll('\\', '/');
    return !path.endsWith('.spec.ts') && !path.includes('/testing/') && !path.includes('/contract-audit/');
  });

const sources = (): readonly ScannedFile[] => production(SRC_ROOT, [/\.ts$/, /\.html$/, /\.css$/]);
const templates = (): readonly ScannedFile[] => production(SRC_ROOT, [/\.ts$/, /\.html$/]);

function schemaOf(tools: ToolDirectory, tool: string): object {
  const declared = tools.get(tool);
  if (declared === undefined) {
    throw new Error(`Tool ${tool} is not declared`);
  }
  return declared.schema;
}

describe('contract audit', () => {
  const tools = loadToolDirectory(PACKAGE_ROOT);

  it('should find every JudikaturaTool value declared as a Tool with its json when the package is read', () => {
    expect(missingTools(USED, tools)).toEqual([]);
    expect([...USED].sort()).toEqual(['lookup', 'rozhodnutie', 'search', 'status']);
  });

  it('should only send input keys the Tool declares when a facade method builds its input', () => {
    for (const tool of Object.values(JudikaturaTool)) {
      const declared = tools.get(tool)?.parameterKeys ?? [];
      for (const key of TOOL_INPUT_KEYS[tool]) {
        expect(declared, `${tool}.${key}`).toContain(key);
      }
    }
  });

  it('should list every declared key of search, lookup and rozhodnutie when the facade keys are compared (no key left unused by accident)', () => {
    for (const tool of Object.values(JudikaturaTool)) {
      expect([...TOOL_INPUT_KEYS[tool]].sort(), tool).toEqual([...(tools.get(tool)?.parameterKeys ?? [])].sort());
    }
  });

  it('should give every used Tool the public audience when audited (the package is read-only)', () => {
    for (const tool of Object.values(JudikaturaTool)) {
      expect(tools.get(tool)?.audience, tool).toBe('public');
    }
  });

  it('should accept the empty argument object for search, lookup and status when validated against the Tool schema (P79-56)', () => {
    const ajv = new Ajv2020({ strict: false, validateFormats: false });
    for (const tool of [JudikaturaTool.Search, JudikaturaTool.Lookup, JudikaturaTool.Status]) {
      const validate = ajv.compile(schemaOf(tools, tool));
      expect(validate({}), `${tool}: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it('should reject the empty argument object for rozhodnutie when validated (it needs one key)', () => {
    const ajv = new Ajv2020({ strict: false, validateFormats: false });
    expect(ajv.compile(schemaOf(tools, JudikaturaTool.Rozhodnutie))({})).toBe(false);
  });

  it('should find no forbidden browser access when scanning ts and html under src', () => {
    expect(forbiddenHits(sources())).toEqual([]);
  });

  it('should never define a custom element when scanning src', () => {
    const hits = sources().filter((file) => file.content.includes('customElements.define'));
    expect(hits.map((file) => file.path)).toEqual([]);
  });

  it('should use no inline style attribute or style binding when scanning templates', () => {
    const hits = templates().filter((file) => /\sstyle\s*=|\[style[.\]]|\[ngStyle\]/.test(file.content));
    expect(hits.map((file) => file.path)).toEqual([]);
  });

  it('should link out only with https when scanning templates for href values', () => {
    const hits = templates().flatMap((file) =>
      [...file.content.matchAll(/href\s*=\s*"(http:[^"]*|javascript:[^"]*)"/g)].map((match) => `${file.path}: ${match[1] ?? ''}`),
    );
    expect(hits).toEqual([]);
  });

  it('should fail with a readable message when a Tool is removed from an in-memory copy of the package', () => {
    const copy: ToolDirectory = new Map(tools);
    copy.delete(JudikaturaTool.Rozhodnutie);
    expect(missingTools(USED, copy)).toEqual([`Tool "rozhodnutie" is used by the UI but not declared in serving/tools/{operator,public}`]);
  });

  it('should list the pattern and file when a forbidden call appears in a fixture source', () => {
    expect(forbiddenHits([{ path: 'x.ts', content: 'const r = fetch(url);' }])).toEqual(['x.ts: fetch(']);
    expect(forbiddenHits([{ path: 'y.ts', content: 'const k = encodeURIComponent(id);' }])).toEqual(['y.ts: encodeURIComponent']);
  });

  it('should scan real sources and read real Tools when the audit runs (no vacuous pass)', () => {
    expect(sources().length).toBeGreaterThan(8);
    expect(tools.size).toBeGreaterThanOrEqual(5);
    expect(tools.has('guide')).toBe(true);
  });

  it('should keep APP_ROOT under src when scanning', () => {
    expect(APP_ROOT.startsWith(SRC_ROOT)).toBe(true);
  });
});
