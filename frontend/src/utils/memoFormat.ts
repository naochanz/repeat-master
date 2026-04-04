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
  cursorPosition: number,
): MemoSpan[] {
  const diff = newText.length - oldText.length;
  if (diff === 0 && newText === oldText) return spans;

  const editPoint = diff > 0
    ? cursorPosition - diff
    : cursorPosition;

  const result: MemoSpan[] = [];
  let offset = 0;
  let editHandled = false;

  for (const span of spans) {
    const spanStart = offset;
    const spanEnd = offset + span.text.length;
    offset = spanEnd;

    if (diff > 0) {
      if (editHandled || spanEnd <= editPoint) {
        result.push({ ...span });
      } else if (spanStart > editPoint) {
        if (!editHandled) {
          result.push({ text: newText.slice(editPoint, editPoint + diff) });
          editHandled = true;
        }
        result.push({ ...span });
      } else {
        const localEditStart = editPoint - spanStart;
        const inserted = newText.slice(editPoint, editPoint + diff);
        const before = span.text.slice(0, localEditStart);
        const after = span.text.slice(localEditStart);
        result.push({ text: before + inserted + after, bg: span.bg, color: span.color });
        editHandled = true;
      }
    } else {
      const deleteEnd = editPoint + (-diff);
      if (spanEnd <= editPoint || spanStart >= deleteEnd) {
        result.push({ ...span });
      } else {
        const delStartInSpan = Math.max(0, editPoint - spanStart);
        const delEndInSpan = Math.min(span.text.length, deleteEnd - spanStart);
        const remaining = span.text.slice(0, delStartInSpan) + span.text.slice(delEndInSpan);
        if (remaining.length > 0) {
          result.push({ text: remaining, bg: span.bg, color: span.color });
        }
      }
    }
  }

  if (diff > 0 && !editHandled) {
    const inserted = newText.slice(editPoint, editPoint + diff);
    if (result.length > 0) {
      const lastSpan = result[result.length - 1];
      lastSpan.text += inserted;
    } else {
      result.push({ text: inserted });
    }
  }

  const resultText = result.map((s) => s.text).join('');
  if (resultText !== newText) {
    return [{ text: newText }];
  }

  return mergeAdjacentSpans(result);
}
