import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ScannedFile } from '../app/testing/source-scan';

export type Audience = 'operator' | 'public';

export interface DeclaredTool {
  readonly audience: Audience;
  readonly parameterKeys: readonly string[];
  /** The `parameters` JSON schema of the Tool, as declared. */
  readonly schema: object;
}

/** Tool name -> what `serving/tools/<audience>/<name>.json` declares. */
export type ToolDirectory = Map<string, DeclaredTool>;

const AUDIENCES: readonly Audience[] = ['operator', 'public'];

/** Reads the Tool pairs of the package by directory (the Manifest does not list Tools). */
export function loadToolDirectory(packageRoot: string): ToolDirectory {
  const directory: ToolDirectory = new Map();
  for (const audience of AUDIENCES) {
    const dir = join(packageRoot, 'serving', 'tools', audience);
    if (!existsSync(dir)) {
      continue;
    }
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
      const json = JSON.parse(readFileSync(join(dir, file), 'utf8')) as { parameters?: { properties?: Record<string, unknown> } };
      directory.set(file.slice(0, -'.json'.length), {
        audience,
        parameterKeys: Object.keys(json.parameters?.properties ?? {}),
        schema: json.parameters ?? {},
      });
    }
  }
  return directory;
}

/** One readable line per used Tool the package does not declare. */
export function missingTools(used: readonly string[], declared: ToolDirectory): string[] {
  return used
    .filter((tool) => !declared.has(tool))
    .map((tool) => `Tool "${tool}" is used by the UI but not declared in serving/tools/{operator,public}`);
}

const FORBIDDEN: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'fetch(', pattern: /\bfetch\(/ },
  { label: 'XMLHttpRequest', pattern: /XMLHttpRequest/ },
  { label: 'HttpClient', pattern: /HttpClient/ },
  { label: 'window.location', pattern: /window\.location/ },
  { label: 'location.href', pattern: /location\.href/ },
  { label: 'document.body', pattern: /document\.body/ },
  { label: 'document.documentElement', pattern: /document\.documentElement/ },
  { label: 'localStorage', pattern: /localStorage/ },
  { label: 'sessionStorage', pattern: /sessionStorage/ },
  { label: 'eval(', pattern: /\beval\(/ },
  { label: 'new Function', pattern: /new Function/ },
  { label: 'innerHTML assignment', pattern: /innerHTML\s*=(?!=)|\[innerHTML\]/ },
  { label: 'bypassSecurityTrust', pattern: /bypassSecurityTrust/ },
  { label: 'encodeURIComponent', pattern: /encodeURIComponent/ },
];

/** `path: label` for every forbidden construct found. */
export function forbiddenHits(files: readonly ScannedFile[]): string[] {
  return files.flatMap((file) => FORBIDDEN.filter((rule) => rule.pattern.test(file.content)).map((rule) => `${file.path}: ${rule.label}`));
}

