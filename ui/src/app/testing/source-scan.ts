import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ScannedFile {
  readonly path: string;
  readonly content: string;
}

/** Source root of the app, relative to `ui/` (specs run with `ui/` as the working directory). */
export const APP_ROOT = join(process.cwd(), 'src', 'app');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** Every file under `root` whose posix-style path matches one of the patterns. */
export function scanSources(root: string, patterns: readonly RegExp[]): readonly ScannedFile[] {
  return walk(root)
    .filter((path) => patterns.some((pattern) => pattern.test(path.replaceAll('\\', '/'))))
    .map((path) => ({ path, content: readFileSync(path, 'utf8') }));
}

const TRANSLOCO_LITERAL = /['"]([A-Za-z0-9_.-]+)['"]\s*\|\s*transloco/g;

export interface TemplateKey {
  readonly key: string;
  readonly path: string;
}

/** Literal keys used as `'a.b' | transloco` in html templates and inline templates (not specs, not testing helpers). */
export function templateKeys(root: string): readonly TemplateKey[] {
  const files = scanSources(root, [/\.html$/, /\.ts$/]).filter(
    (file) => !file.path.endsWith('.spec.ts') && !/[\\/]testing[\\/]/.test(file.path),
  );
  return files.flatMap((file) =>
    [...file.content.matchAll(TRANSLOCO_LITERAL)].map((match) => ({ key: match[1] ?? '', path: file.path })),
  );
}

/** `{a:{b:'x'}}` -> `['a.b']`. */
export function flattenKeys(dictionary: Readonly<Record<string, unknown>>, prefix = ''): string[] {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return typeof value === 'object' && value !== null
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

/** `{a:{b:'x'}}` -> `{'a.b':'x'}`. */
export function flattenEntries(dictionary: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const visit = (node: Readonly<Record<string, unknown>>, prefix: string): void => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix === '' ? key : `${prefix}.${key}`;
      if (typeof value === 'object' && value !== null) {
        visit(value as Record<string, unknown>, path);
      } else {
        out[path] = value;
      }
    }
  };
  visit(dictionary, '');
  return out;
}
