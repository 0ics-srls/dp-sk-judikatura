import { provideZonelessChangeDetection, type EnvironmentProviders, type Provider } from '@angular/core';
import { providePackagePrimeNG } from '@olx/package-ui-sdk';
import { provideJudikaturaI18n } from './i18n/provide-judikatura-i18n';

/**
 * Application-level providers of the package. No router (Screens render from `subPath`); `JudikaturaTools` is provided by
 * each root because it needs the context that root connects.
 */
export const judikaturaProviders: readonly (Provider | EnvironmentProviders)[] = [
  providePackagePrimeNG({ packageName: 'sk-judikatura' }),
  provideJudikaturaI18n(),
  provideZonelessChangeDetection(),
];
