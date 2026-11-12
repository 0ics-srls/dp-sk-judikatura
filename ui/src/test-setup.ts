/** jsdom has no window.matchMedia; PrimeNG components call it during init. Non-matching stub. */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: (): void => undefined,
      removeListener: (): void => undefined,
      addEventListener: (): void => undefined,
      removeEventListener: (): void => undefined,
      dispatchEvent: (): boolean => false,
    }) as MediaQueryList;
}

/** jsdom has no ResizeObserver; PrimeNG Tabs use it. No-op stub. */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {
      /* no-op stub */
    }
    unobserve(): void {
      /* no-op stub */
    }
    disconnect(): void {
      /* no-op stub */
    }
  };
}
