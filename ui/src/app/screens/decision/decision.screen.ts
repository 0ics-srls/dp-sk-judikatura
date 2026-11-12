import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectJudikaturaScreen, screenContextProvider } from '../../shared/connect-screen';
import { JudikaturaTools } from '../../tools/judikatura-tools';
import { DecisionStore } from './decision.store';
import { DecisionViewComponent } from './decision-view.component';

/** Root of the dp-sk-judikatura-decision Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-judikatura-decision',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecisionViewComponent],
  providers: [screenContextProvider(() => DecisionScreen), JudikaturaTools, DecisionStore],
  template: '<dp-sk-judikatura-decision-view />',
})
export class DecisionScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectJudikaturaScreen(this.context);
  }
}
