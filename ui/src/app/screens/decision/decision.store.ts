import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { injectPackageContext } from '@olx/package-ui-sdk';
import { parseDecKey } from '../../shared/dec-key';
import { httpsUrl } from '../../shared/safe-url';
import type { DecisionRecord } from '../../tools/judikatura-dto';
import { JudikaturaTools } from '../../tools/judikatura-tools';

export type LoadState = 'idle' | 'loading' | 'ready' | 'notfound' | 'error';

/** Characters asked per slice (the Tool default; sent explicitly so the first slice and the next ones are the same size). */
export const SLICE_LENGTH = 20000;

/** The detail Screen: one decision named by the route key, loaded when the key changes (an effect, never in the constructor, P78-30). */
@Injectable()
export class DecisionStore {
  private readonly tools = inject(JudikaturaTools);
  private readonly context = injectPackageContext();

  readonly key = computed(() => parseDecKey(this.context().subPath));
  readonly state = signal<LoadState>('idle');
  readonly errorDetail = signal('');

  /** The decision row of the first slice (header, links); `truncated` and `nextOffset` follow the last slice. */
  readonly decision = signal<DecisionRecord | null>(null);
  /** The slices loaded so far, concatenated. */
  readonly text = signal('');
  readonly loadingMore = signal(false);
  readonly moreError = signal('');
  readonly sourceLink = computed(() => httpsUrl(this.decision()?.sourceUrl));
  readonly pdfLink = computed(() => httpsUrl(this.decision()?.pdfUrl));
  readonly hasMore = computed(() => this.decision()?.truncated === true && this.decision()?.nextOffset !== null);

  private request = 0;

  constructor() {
    effect(() => {
      const key = this.key();
      untracked(() => void this.load(key));
    });
  }

  back(): void {
    this.context().navigateScreen('corpus');
  }

  async nextSlice(): Promise<void> {
    const current = this.decision();
    const key = this.key();
    if (current === null || key === null || current.nextOffset === null || this.loadingMore()) {
      return;
    }
    const request = this.request;
    this.loadingMore.set(true);
    this.moreError.set('');
    try {
      const { rows } = await this.tools.rozhodnutie({ id: key, offset: current.nextOffset, length: SLICE_LENGTH });
      const slice = rows[0];
      if (request !== this.request || slice === undefined) {
        return;
      }
      this.text.update((text) => text + slice.text);
      this.decision.set({ ...current, truncated: slice.truncated, nextOffset: slice.nextOffset });
    } catch (error) {
      if (request === this.request) {
        this.moreError.set(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (request === this.request) {
        this.loadingMore.set(false);
      }
    }
  }

  private reset(): void {
    this.errorDetail.set('');
    this.decision.set(null);
    this.text.set('');
    this.loadingMore.set(false);
    this.moreError.set('');
  }

  private async load(key: string | null): Promise<void> {
    const request = ++this.request;
    this.reset();
    if (key === null) {
      this.state.set('idle');
      return;
    }
    this.state.set('loading');
    try {
      const { rows } = await this.tools.rozhodnutie({ id: key, offset: 0, length: SLICE_LENGTH });
      if (request !== this.request) {
        return;
      }
      const [first] = rows;
      this.decision.set(first ?? null);
      this.text.set(first?.text ?? '');
      this.state.set(first === undefined ? 'notfound' : 'ready');
    } catch (error) {
      if (request !== this.request) {
        return;
      }
      this.errorDetail.set(error instanceof Error ? error.message : String(error));
      this.state.set('error');
    }
  }
}
