import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ELEMENTS } from '../app/screens';
import { JudikaturaTool } from '../app/tools/judikatura-tool';
import { loadToolDirectory } from './audit';

interface Declared {
  readonly id: string;
  readonly element: string;
  readonly label: Readonly<Record<string, string>>;
  readonly default?: boolean;
}

interface UiBlock {
  readonly entry: string;
  readonly styles: readonly string[];
  readonly screens: readonly Declared[];
  readonly permissions: readonly string[];
}

const PACKAGE_ROOT = resolve(process.cwd(), '..');
const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'dataplatform.json'), 'utf8')) as { ui?: UiBlock };
const ui = manifest.ui;
const DIST = resolve(process.cwd(), 'dist');
const MAIN = join(DIST, 'main.js');

const sizes = (): number[] => readdirSync(DIST).map((name) => statSync(join(DIST, name)).size);

/**
 * The Manifest `ui` block is added by block 23 of plan-c (the release block). Until then these checks are skipped with a visible reason
 * instead of failing; the day `dataplatform.json` carries `ui` they run without any change here.
 */
const SKIP_REASON = 'Manifest has no ui block yet (plan-c block 23 adds it)';
const withUi = ui === undefined ? it.skip : it;
const declared = (): UiBlock => {
  if (ui === undefined) {
    throw new Error(SKIP_REASON);
  }
  return ui;
};

describe('Manifest ui section', () => {
  it('should read the Manifest of the package when the ui block is looked for (the skipped checks carry the reason in their names)', () => {
    expect(manifest).toBeTypeOf('object');
  });

  withUi(`should declare every ELEMENTS key exactly once when the Manifest is read [${SKIP_REASON}]`, () => {
    expect(declared().screens.map((screen) => screen.element).sort()).toEqual(Object.keys(ELEMENTS).sort());
  });

  withUi(`should keep screen ids unique, exactly one default and labels in sk, en and it when the screens are declared [${SKIP_REASON}]`, () => {
    const { screens } = declared();
    const ids = screens.map((screen) => screen.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screens.filter((screen) => screen.default === true).map((screen) => screen.id)).toEqual(['corpus']);
    for (const screen of screens) {
      expect(Object.keys(screen.label).sort(), screen.id).toEqual(['en', 'it', 'sk']);
    }
  });

  withUi(`should declare the three judikatura Screens with their elements when the Manifest is read [${SKIP_REASON}]`, () => {
    const block = declared();
    expect(block.screens.map((screen) => [screen.id, screen.element])).toEqual([
      ['corpus', 'dp-sk-judikatura-corpus'],
      ['decision', 'dp-sk-judikatura-decision'],
      ['status', 'dp-sk-judikatura-status'],
    ]);
    expect(block.entry).toBe('ui/dist/main.js');
    expect(block.styles).toEqual(['ui/dist/styles.css']);
  });

  withUi(`should grant exactly the Tools the UI uses and navigate when the permissions are read [${SKIP_REASON}]`, () => {
    const block = declared();
    const granted = block.permissions.filter((permission) => permission.startsWith('tools:')).map((permission) => permission.slice('tools:'.length));
    expect(granted.sort()).toEqual(Object.values(JudikaturaTool).sort());
    expect(block.permissions).toContain('navigate');
    const tools = loadToolDirectory(PACKAGE_ROOT);
    for (const tool of granted) {
      expect(tools.has(tool), tool).toBe(true);
    }
  });

  withUi(`should find entry and styles under ui/dist when the build is committed [${SKIP_REASON}]`, () => {
    const block = declared();
    for (const file of [block.entry, ...block.styles]) {
      expect(existsSync(join(PACKAGE_ROOT, file)), file).toBe(true);
    }
  });
});

describe('built bundle', () => {
  it('should stay within 5 MB in total and 1.5 MB per file when dist is measured', () => {
    expect(existsSync(MAIN), `run npm run build first: ${MAIN} missing`).toBe(true);
    expect(sizes().reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(Math.max(...sizes())).toBeLessThanOrEqual(1.5 * 1024 * 1024);
  });

  it('should not contain zone.js when read from dist', () => {
    expect(readFileSync(MAIN, 'utf8')).not.toContain('zone.js');
  });

  it('should define every element once and survive a second import when imported twice', async () => {
    const url = pathToFileURL(MAIN).href;
    await import(/* @vite-ignore */ `${url}?first`);
    for (const tag of Object.keys(ELEMENTS)) {
      expect(customElements.get(tag), tag).toBeDefined();
    }
    const before = Object.keys(ELEMENTS).map((tag) => customElements.get(tag));
    await expect(import(/* @vite-ignore */ `${url}?second`)).resolves.toBeDefined();
    expect(Object.keys(ELEMENTS).map((tag) => customElements.get(tag))).toEqual(before);
  });
});
