import { forwardRef, inject, type Provider, type Signal, type Type } from '@angular/core';
import { connectPackageScreen, providePackageContext, type PackageScreenContext, type PackageScreenHost } from '@olx/package-ui-sdk';
import { LocaleBridge } from '../i18n/locale-bridge';

/** Call in the constructor of every Screen / widget / tab root: SDK wiring plus the active language. */
export function connectJudikaturaScreen(context: Signal<PackageScreenContext>): void {
  connectPackageScreen(context);
  inject(LocaleBridge).connect(context);
}

/** `providePackageContext(forwardRef(() => Root))` with the `any` of `forwardRef` contained in one place. */
export function screenContextProvider(host: () => Type<PackageScreenHost>): Provider {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- forwardRef is typed Type<any>
  return providePackageContext(forwardRef(host));
}
