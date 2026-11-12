import { effect, signal, untracked, type WritableSignal } from '@angular/core';

export const SEARCH_DEBOUNCE_MS = 300;

const sameQuery = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Parses an input to a whole number; empty or invalid gives undefined. */
export function toYear(value: string): number | undefined {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * A filtered list: typing is debounced (`edit`), choosing is immediate (`choose`); a query equal to the current one is not loaded again, the latest
 * request wins, nothing is loaded before `enabled` (the tab was opened) and nothing in the constructor (the context input is set later, P78-30).
 */
export abstract class ListStore<Q extends object, R> {
  readonly rows = signal<readonly R[]>([]);
  readonly loading = signal(false);
  /** Translation key of the failure, null when fine. */
  readonly error = signal<string | null>(null);
  readonly errorDetail = signal('');
  readonly enabled: WritableSignal<boolean>;
  readonly query: WritableSignal<Q>;

  private draft: Q;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private request = 0;

  protected constructor(initial: Q, enabled: boolean) {
    this.draft = initial;
    this.query = signal(initial, { equal: sameQuery });
    this.enabled = signal(enabled);
    effect(() => {
      if (!this.enabled()) {
        return;
      }
      const query = this.query();
      untracked(() => void this.run(query));
    });
  }

  protected abstract readRows(query: Q): Promise<readonly R[]>;

  enable(): void {
    this.enabled.set(true);
  }

  /** Typing: applied after the debounce. */
  edit(patch: Partial<Q>): void {
    this.draft = { ...this.draft, ...patch };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.query.set(this.draft);
    }, SEARCH_DEBOUNCE_MS);
  }

  /** Choosing (or paging): applied now, together with what was typed. */
  choose(patch: Partial<Q>): void {
    clearTimeout(this.timer);
    this.draft = { ...this.draft, ...patch };
    this.query.set(this.draft);
  }

  private async run(query: Q): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    try {
      const rows = await this.readRows(query);
      if (request !== this.request) {
        return;
      }
      this.rows.set(rows);
      this.error.set(null);
      this.errorDetail.set('');
    } catch (error) {
      if (request !== this.request) {
        return;
      }
      this.rows.set([]);
      this.error.set('common.error');
      this.errorDetail.set(error instanceof Error ? error.message : String(error));
    } finally {
      if (request === this.request) {
        this.loading.set(false);
      }
    }
  }
}
