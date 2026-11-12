/** A piece of text; `mark` pieces were between the « » markers of ts_headline. */
export interface TextPart {
  readonly text: string;
  readonly mark: boolean;
}

/** Splits at « » into plain and marked pieces. The pieces are rendered as text nodes (never as html), so the content stays inert. Unbalanced markers stay text. */
export function textParts(value: string | null | undefined): readonly TextPart[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }
  const parts: TextPart[] = [];
  let rest = value;
  while (rest !== '') {
    const open = rest.indexOf('«');
    const close = open < 0 ? -1 : rest.indexOf('»', open + 1);
    if (open < 0 || close < 0) {
      parts.push({ text: rest, mark: false });
      break;
    }
    if (open > 0) {
      parts.push({ text: rest.slice(0, open), mark: false });
    }
    parts.push({ text: rest.slice(open + 1, close), mark: true });
    rest = rest.slice(close + 1);
  }
  return parts;
}
