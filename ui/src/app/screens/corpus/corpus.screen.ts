import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type PackageScreenContext } from '@olx/package-ui-sdk';
import { connectJudikaturaScreen, screenContextProvider } from '../../shared/connect-screen';
import { JudikaturaTools } from '../../tools/judikatura-tools';
import { CorpusStore } from './corpus.store';
import { CorpusViewComponent } from './corpus-view.component';

/** Root of the dp-sk-judikatura-corpus Screen. The root only wires the context; the view injects what needs it (avoids NG0200). */
@Component({
  selector: 'dp-sk-judikatura-corpus',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CorpusViewComponent],
  providers: [screenContextProvider(() => CorpusScreen), JudikaturaTools, CorpusStore],
  template: '<dp-sk-judikatura-corpus-view />',
})
export class CorpusScreen {
  readonly context = input.required<PackageScreenContext>();

  constructor() {
    connectJudikaturaScreen(this.context);
  }
}
