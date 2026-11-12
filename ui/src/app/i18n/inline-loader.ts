import { Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import en from './en.json';
import it from './it.json';
import sk from './sk.json';

/** The three dictionaries are bundled with the package; a custom element must not depend on HTTP paths of the Host. */
export const DICTIONARIES: Readonly<Record<string, Translation>> = { sk, en, it };

@Injectable({ providedIn: 'root' })
export class InlineTranslocoLoader implements TranslocoLoader {
  getTranslation(lang: string): Observable<Translation> {
    return of(DICTIONARIES[lang] ?? en);
  }
}
