import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  provideTransloco,
  TRANSLOCO_MISSING_HANDLER,
  type TranslocoMissingHandler,
} from '@jsverse/transloco';
import { InlineTranslocoLoader } from './inline-loader';

/** Renders the key and reports each missing key once. */
export class LogOnceMissingHandler implements TranslocoMissingHandler {
  private readonly reported = new Set<string>();

  handle(key: string): string {
    if (!this.reported.has(key)) {
      this.reported.add(key);
      // eslint-disable-next-line no-console -- the only diagnostic channel of a missing key
      console.warn(`[dp-sk-judikatura] missing translation: ${key}`);
    }
    return key;
  }
}

export function provideJudikaturaI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: ['sk', 'en', 'it'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: true,
      },
      loader: InlineTranslocoLoader,
    }),
    { provide: TRANSLOCO_MISSING_HANDLER, useClass: LogOnceMissingHandler },
  ]);
}
