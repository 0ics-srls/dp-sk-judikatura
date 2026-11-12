import { Injectable } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import {
  DATE_KEYS,
  JSON_LIST_KEYS,
  JSON_MAP_KEYS,
  NUMBER_KEYS,
  type DecisionRecord,
  type LookupRow,
  type SearchHit,
  type StatusRow,
  type ToolRows,
} from './judikatura-dto';
import { JudikaturaTool, TOOL_INPUT_KEYS } from './judikatura-tool';

/** A Tool call failed; carries the Tool name and the code of the rejection when it had one. */
export class JudikaturaToolError extends Error {
  constructor(
    readonly tool: JudikaturaTool,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'JudikaturaToolError';
  }
}

type Wire = Record<string, unknown>;

const camel = (key: string): string => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const snake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = new Date(typeof value === 'string' ? value : NaN);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

function parsed(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Wire {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A jsonb array element: camelised keys, dates and numbers coerced like a column. */
function mapMember(value: unknown): unknown {
  return isRecord(value) ? mapRow(value) : value;
}

/** A jsonb map of counts: `{ api: "9" }` and `{ api: 9 }` both give numbers; anything else is dropped. */
function countMap(value: unknown): Record<string, number> {
  const map = parsed(value);
  if (!isRecord(map)) {
    return {};
  }
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(map)) {
    const number = toNumber(count);
    if (typeof number === 'number') {
      counts[key] = number;
    }
  }
  return counts;
}

function mapRow(row: Wire): Wire {
  const mapped: Wire = {};
  for (const [key, value] of Object.entries(row)) {
    const name = camel(key);
    if (DATE_KEYS.includes(name)) {
      mapped[name] = toDate(value);
    } else if (NUMBER_KEYS.includes(name)) {
      mapped[name] = toNumber(value);
    } else if (JSON_LIST_KEYS.includes(name)) {
      const list = parsed(value);
      mapped[name] = Array.isArray(list) ? list.map(mapMember) : [];
    } else if (JSON_MAP_KEYS.includes(name)) {
      mapped[name] = countMap(value);
    } else {
      mapped[name] = value;
    }
  }
  return mapped;
}

/** snake case input from camelCase arguments; undefined arguments are dropped, only keys of the Tool are sent. */
function buildInput(tool: JudikaturaTool, args: Readonly<Record<string, unknown>>): Wire {
  const allowed = TOOL_INPUT_KEYS[tool];
  const input: Wire = {};
  for (const [key, value] of Object.entries(args)) {
    const wire = snake(key);
    if (value !== undefined && allowed.includes(wire)) {
      input[wire] = value;
    }
  }
  return input;
}

interface Unwrapped {
  readonly rows: readonly Wire[];
  readonly warnings: readonly string[];
}

function warningCode(warning: unknown): string {
  if (typeof warning === 'string') {
    return warning;
  }
  const code = typeof warning === 'object' && warning !== null ? (warning as { code?: unknown }).code : undefined;
  return typeof code === 'string' ? code : 'unknown';
}

/** A Tool answer is either the rows or the envelope `{ data, warnings? }`. */
function unwrap(result: unknown): Unwrapped {
  if (Array.isArray(result)) {
    return { rows: result as Wire[], warnings: [] };
  }
  if (typeof result === 'object' && result !== null && Array.isArray((result as { data?: unknown }).data)) {
    const envelope = result as { data: Wire[]; warnings?: unknown };
    const warnings = Array.isArray(envelope.warnings) ? (envelope.warnings as unknown[]).map(warningCode) : [];
    return { rows: envelope.data, warnings };
  }
  return { rows: [], warnings: [] };
}

function codeOf(error: unknown): string | null {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  return typeof code === 'string' ? code : null;
}

export interface LookupArgs {
  readonly cislo?: string | undefined;
  readonly ecli?: string | undefined;
  readonly court?: string | undefined;
  readonly kolegium?: number | undefined;
  readonly senat?: string | undefined;
  readonly datumFrom?: string | undefined;
  readonly datumTo?: string | undefined;
  readonly sort?: string | undefined;
  readonly limit?: number | undefined;
  readonly offset?: number | undefined;
}

export interface SearchArgs {
  readonly query?: string | undefined;
  readonly k?: number | undefined;
  readonly mode?: string | undefined;
  readonly court?: string | undefined;
  readonly kolegium?: number | undefined;
  readonly datumFrom?: string | undefined;
  readonly datumTo?: string | undefined;
}

export interface DecisionArgs {
  readonly id?: string | undefined;
  readonly offset?: number | undefined;
  readonly length?: number | undefined;
}

/** The only place the Screens call Tools: camelCase in, camelCase rows out. */
@Injectable()
export class JudikaturaTools {
  private readonly context = injectPackageContext();

  private async call(tool: JudikaturaTool, args: Readonly<Record<string, unknown>> = {}): Promise<Unwrapped> {
    try {
      return unwrap(await this.context().tools.call<unknown>(tool, buildInput(tool, args)));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new JudikaturaToolError(tool, codeOf(error), message);
    }
  }

  private async rows<T>(tool: JudikaturaTool, args: Readonly<Record<string, unknown>> = {}): Promise<ToolRows<T>> {
    const { rows, warnings } = await this.call(tool, args);
    return { rows: rows.map((row) => mapRow(row) as T), warnings };
  }

  lookup(args: LookupArgs): Promise<ToolRows<LookupRow>> {
    return this.rows(JudikaturaTool.Lookup, { ...args });
  }

  search(args: SearchArgs): Promise<ToolRows<SearchHit>> {
    return this.rows(JudikaturaTool.Search, { ...args });
  }

  /** Every decision the id matches (one); the text is the slice at `offset`. */
  rozhodnutie(args: DecisionArgs): Promise<ToolRows<DecisionRecord>> {
    return this.rows(JudikaturaTool.Rozhodnutie, { ...args });
  }

  status(): Promise<ToolRows<StatusRow>> {
    return this.rows(JudikaturaTool.Status);
  }
}
