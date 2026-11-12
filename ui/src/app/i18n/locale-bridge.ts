import { effect, EffectRef, inject, Injector, Injectable, type Signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import type { PackageLocale, PackageScreenContext } from '@olx/package-ui-sdk';

export const SUPPORTED_LOCALES: readonly PackageLocale[] = ['sk', 'en', 'it'];
export const FALLBACK_LOCALE: PackageLocale = 'en';

export function resolveLocale(locale: string): PackageLocale {
  return SUPPORTED_LOCALES.find((supported) => supported === locale) ?? FALLBACK_LOCALE;
}

/** Keeps the active Transloco language equal to `context.locale` of the Screen. */
@Injectable({ providedIn: 'root' })
export class LocaleBridge {
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);

  connect(context: Signal<PackageScreenContext>): EffectRef {
    return effect(
      () => {
        this.transloco.setActiveLang(resolveLocale(context().locale));
      },
      { injector: this.injector },
    );
  }
}
