/** `querySelector` that fails the test with the selector when nothing matches (instead of a non-null assertion). */
export function must(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector);
  if (found === null) {
    throw new Error(`no element matches ${selector}`);
  }
  return found;
}
