import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { CoverageWindow, StatusRow } from '../../tools/judikatura-dto';
import { JudikaturaTools } from '../../tools/judikatura-tools';

export interface SkippedReason {
  readonly reason: string;
  readonly count: number;
}

export interface CoverageLine extends CoverageWindow {
  readonly key: string;
  /** `YYYY-MM` of the start of the window. */
  readonly label: string;
}

/** Chamber code of the Tool -> the key of the chamber name in the dictionaries (`corpus.kolegia.<name>`). */
export const KOLEGIUM_NAMES: Readonly<Record<string, string>> = { '1': 'civil', '2': 'commercial', '3': 'administrative', '4': 'criminal' };

export interface KolegiumCount {
  readonly code: string;
  /** Dictionary key suffix, null for a code the package does not know. */
  readonly name: string | null;
  readonly count: number;
}

@Injectable()
export class StatusStore {
  private readonly tools = inject(JudikaturaTools);

  readonly rows = signal<readonly StatusRow[]>([]);
  readonly loading = signal(false);
  /** Translation key of the failure, null when fine. */
  readonly error = signal<string | null>(null);
  readonly errorDetail = signal('');
  /** True once a load has finished: before it the Screen shows the loading line, not "no decisions". */
  readonly loaded = signal(false);

  /** The court rows; the empty corpus answers one row without a court, which is not a row of the table. */
  readonly courts = computed(() => this.rows().filter((row) => row.court !== null));
  readonly empty = computed(() => this.loaded() && this.courts().length === 0 && this.error() === null);
  /** The note and the corpus-wide members are the same on every row: read once from the first row. */
  readonly limits = computed(() => this.rows()[0]?.honestLimits ?? null);
  readonly piiTotal = computed(() => this.courts().reduce((sum, row) => sum + row.piiFlagsTotal, 0));
  readonly anyPending = computed(() => this.courts().some((row) => row.passagesPending > 0));
  readonly lastIngestedAt = computed(() => {
    const times = this.courts().flatMap((row) => (row.lastIngestedAt === null ? [] : [row.lastIngestedAt.getTime()]));
    return times.length === 0 ? null : new Date(Math.max(...times));
  });

  readonly skipped = computed<readonly SkippedReason[]>(() => {
    const row = this.rows()[0];
    return Object.entries(row?.skipped ?? {}).map(([reason, count]) => ({ reason, count }));
  });

  /** The last coverage windows, newest first (the Tool lists them oldest first). */
  readonly coverage = computed<readonly CoverageLine[]>(() =>
    [...(this.rows()[0]?.coverage ?? [])]
      .map((window) => {
        const from = window.windowFrom?.toISOString().slice(0, 7) ?? '-';
        return { ...window, key: `${from}|${window.windowTo?.toISOString() ?? ''}`, label: from };
      })
      .reverse(),
  );

  private request = 0;

  constructor() {
    // an effect, not a constructor call: the context input is set after construction (P78-30)
    effect(() => {
      untracked(() => void this.refresh());
    });
  }

  kolegia(row: StatusRow): readonly KolegiumCount[] {
    return Object.entries(row.byKolegium)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, count]) => ({ code, name: KOLEGIUM_NAMES[code] ?? null, count }));
  }

  async refresh(): Promise<void> {
    const request = ++this.request;
    this.loading.set(true);
    try {
      const { rows } = await this.tools.status();
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
        this.loaded.set(true);
      }
    }
  }
}
