import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { StatusStore } from './status.store';

const KNOWN_COURTS: readonly string[] = ['NSSR', 'NSSSR'];

@Component({
  selector: 'dp-sk-judikatura-status-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, DatePipe],
  templateUrl: './status-view.component.html',
  styleUrl: './status-view.component.css',
})
export class StatusViewComponent {
  protected readonly store = inject(StatusStore);

  /** The translation key of a court the package knows, null for any other (then the raw code is shown). */
  protected courtKey(court: string | null): string | null {
    return court !== null && KNOWN_COURTS.includes(court) ? `status.courts.${court}` : null;
  }

  /** Count of a text source of a row (a missing key is 0). */
  protected source(counts: Readonly<Record<string, number>>, name: string): number {
    return counts[name] ?? 0;
  }
}
