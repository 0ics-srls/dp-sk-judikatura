import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DecisionStore } from './decision.store';

const KNOWN_COURTS: readonly string[] = ['NSSR', 'NSSSR'];
const KNOWN_SOURCES: readonly string[] = ['api', 'pdf', 'ocr'];

@Component({
  selector: 'dp-sk-judikatura-decision-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './decision-view.component.html',
  styleUrl: './decision-view.component.css',
})
export class DecisionViewComponent {
  protected readonly store = inject(DecisionStore);

  /** The translation key of a court the package knows, null for any other (then the raw code is shown). */
  protected courtKey(court: string): string | null {
    return KNOWN_COURTS.includes(court) ? `corpus.courts.${court}` : null;
  }

  /** The translation key of a text source the package knows, null for any other (then the raw value is shown). */
  protected sourceKey(source: string): string | null {
    return KNOWN_SOURCES.includes(source) ? `decision.textSource.${source}` : null;
  }
}
