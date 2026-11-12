/**
 * The decision Screen route parameter: `dec~<uuid>`. A uuid has nothing to encode, so the Host (which encodes `subPath` once, P78-47) shows an
 * address that opens directly and survives a reload. The key is NEVER pre-encoded here; only '/' needs care because it separates route segments.
 * The list is keyed by id only: a natural-key link would need the '/' of `8Cdo/27/2025` encoded (P81-21).
 */
const PREFIX = 'dec~';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function decKey(id: string): string {
  return `${PREFIX}${id.replaceAll('/', '%2F')}`;
}

/** null when the key is empty, has no `dec~` prefix or its id is not a uuid (the Screen then shows a hint and calls no Tool, which would answer 400). */
export function parseDecKey(subPath: string): string | null {
  if (!subPath.startsWith(PREFIX)) {
    return null;
  }
  const id = subPath.slice(PREFIX.length).replaceAll('%2F', '/').trim();
  return UUID.test(id) ? id : null;
}
