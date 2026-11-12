import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CorpusStore } from './corpus.store';

const KNOWN_COURTS: readonly string[] = ['NSSR', 'NSSSR'];

@Component({
  selector: 'dp-sk-judikatura-corpus-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './corpus-view.component.html',
  styleUrl: './corpus-view.component.css',
})
export class CorpusViewComponent {
  protected readonly store = inject(CorpusStore);

  protected readonly courts: readonly string[] = KNOWN_COURTS;
  protected readonly kolegia: readonly string[] = ['civil', 'commercial', 'administrative', 'criminal'];
  protected readonly sorts: readonly string[] = ['datum_desc', 'datum_asc', 'cislo'];
  protected readonly modes: readonly string[] = ['hybrid', 'lexical', 'semantic'];

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  /** The translation key of a court the package knows, null for any other (then the raw code is shown). */
  protected courtKey(court: string): string | null {
    return KNOWN_COURTS.includes(court) ? `corpus.courts.${court}` : null;
  }
}
