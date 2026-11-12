/** The url when it is an https link, else the empty string: a source link is only ever rendered for https. */
export function httpsUrl(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}
