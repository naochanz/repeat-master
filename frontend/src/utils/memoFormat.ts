export interface MemoSpan {
  text: string;
  bg?: string;
  color?: string;
}

interface FormattedMemo {
  v: 1;
  spans: MemoSpan[];
}

type ParsedMemo =
  | { type: 'plain'; text: string }
  | { type: 'formatted'; spans: MemoSpan[] };

export function parseMemo(memo: string): ParsedMemo {
  if (!memo) return { type: 'plain', text: '' };
  if (!memo.startsWith('{')) return { type: 'plain', text: memo };
  try {
    const parsed = JSON.parse(memo) as FormattedMemo;
    if (parsed.v === 1 && Array.isArray(parsed.spans)) {
      return { type: 'formatted', spans: parsed.spans };
    }
    return { type: 'plain', text: memo };
  } catch {
    return { type: 'plain', text: memo };
  }
}

export function serializeMemo(spans: MemoSpan[]): string {
  const hasFormatting = spans.some((s) => s.bg || s.color);
  if (!hasFormatting) return spans.map((s) => s.text).join('');
  const cleaned = spans.map((s) => {
    const span: MemoSpan = { text: s.text };
    if (s.bg) span.bg = s.bg;
    if (s.color) span.color = s.color;
    return span;
  });
  const data: FormattedMemo = { v: 1, spans: cleaned };
  return JSON.stringify(data);
}

export function toPlainText(memo: string): string {
  const parsed = parseMemo(memo);
  if (parsed.type === 'plain') return parsed.text;
  return parsed.spans.map((s) => s.text).join('');
}

export function spansToPlainText(spans: MemoSpan[]): string {
  return spans.map((s) => s.text).join('');
}

export function memoToSpans(memo: string): MemoSpan[] {
  const parsed = parseMemo(memo);
  if (parsed.type === 'plain') {
    return parsed.text ? [{ text: parsed.text }] : [];
  }
  return parsed.spans;
}

export function applyFormat(
  spans: MemoSpan[],
  selection: { start: number; end: number },
  format: { bg?: string | null; color?: string | null },
): MemoSpan[] {
  if (selection.start === selection.end) return spans;

  const result: MemoSpan[] = [];
  let offset = 0;

  for (const span of spans) {
    const spanStart = offset;
    const spanEnd = offset + span.text.length;
    offset = spanEnd;

    if (spanEnd <= selection.start || spanStart >= selection.end) {
      result.push(span);
      continue;
    }

    if (spanStart < selection.start) {
      result.push({ text: span.text.slice(0, selection.start - spanStart), bg: span.bg, color: span.color });
    }

    const overlapStart = Math.max(spanStart, selection.start);
    const overlapEnd = Math.min(spanEnd, selection.end);
    const formatted: MemoSpan = { text: span.text.slice(overlapStart - spanStart, overlapEnd - spanStart) };
    formatted.bg = format.bg === null ? undefined : (format.bg ?? span.bg);
    formatted.color = format.color === null ? undefined : (format.color ?? span.color);
    result.push(formatted);

    if (spanEnd > selection.end) {
      result.push({ text: span.text.slice(selection.end - spanStart), bg: span.bg, color: span.color });
    }
  }

  return mergeAdjacentSpans(result);
}

function mergeAdjacentSpans(spans: MemoSpan[]): MemoSpan[] {
  if (spans.length === 0) return spans;
  const merged: MemoSpan[] = [spans[0]];
  for (let i = 1; i < spans.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = spans[i];
    if (prev.bg === curr.bg && prev.color === curr.color) {
      prev.text += curr.text;
    } else {
      merged.push(curr);
    }
  }
  return merged.filter((s) => s.text.length > 0);
}

export function reconcileSpansWithText(
  oldText: string,
  newText: string,
  spans: MemoSpan[],
  _cursorPosition: number,
): MemoSpan[] {
  if (newText === oldText) return spans;

  // Find edit region by comparing strings directly (reliable with IME/CJK input)
  let prefixLen = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  const maxSuffix = Math.min(oldText.length - prefixLen, newText.length - prefixLen);
  while (
    suffixLen < maxSuffix &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldEditStart = prefixLen;
  const oldEditEnd = oldText.length - suffixLen;
  const insertedText = newText.slice(prefixLen, newText.length - suffixLen);

  const result: MemoSpan[] = [];
  let offset = 0;
  let inserted = false;

  for (const span of spans) {
    const spanStart = offset;
    const spanEnd = offset + span.text.length;
    offset = spanEnd;

    // Span entirely before edit region
    if (spanEnd <= oldEditStart) {
      result.push({ ...span });
      continue;
    }

    // Span entirely after edit region
    if (spanStart >= oldEditEnd) {
      if (!inserted && insertedText.length > 0) {
        result.push({ text: insertedText });
        inserted = true;
      }
      result.push({ ...span });
      continue;
    }

    // Span overlaps with edit region — keep parts outside, insert new text once
    if (spanStart < oldEditStart) {
      result.push({ text: span.text.slice(0, oldEditStart - spanStart), bg: span.bg, color: span.color });
    }

    if (!inserted && insertedText.length > 0) {
      result.push({ text: insertedText, bg: span.bg, color: span.color });
      inserted = true;
    }

    if (spanEnd > oldEditEnd) {
      result.push({ text: span.text.slice(oldEditEnd - spanStart), bg: span.bg, color: span.color });
    }
  }

  // Appending at the end
  if (!inserted && insertedText.length > 0) {
    const lastSpan = result.length > 0 ? result[result.length - 1] : undefined;
    result.push({ text: insertedText, bg: lastSpan?.bg, color: lastSpan?.color });
  }

  return mergeAdjacentSpans(result);
}
