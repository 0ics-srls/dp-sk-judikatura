import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectJudikaturaScreen, screenContextProvider } from '../../shared/connect-screen';
import { JudikaturaTools } from '../../tools/judikatura-tools';
import { StatusStore } from './status.store';
import { StatusViewComponent } from './status-view.component';

/** Root of the dp-sk-judikatura-status Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-judikatura-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusViewComponent],
  providers: [screenContextProvider(() => StatusScreen), JudikaturaTools, StatusStore],
  template: '<dp-sk-judikatura-status-view />',
})
export class StatusScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectJudikaturaScreen(this.context);
  }
}
