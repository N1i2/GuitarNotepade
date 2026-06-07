function isUppercaseLetter(char: string): boolean {
  return (
    char.length > 0 &&
    char === char.toUpperCase() &&
    char !== char.toLowerCase()
  );
}

export function isUppercaseWordStart(
  text: string,
  localIndex: number,
  globalIndex: number,
): boolean {
  if (globalIndex === 0) {
    return false;
  }

  const char = text[localIndex];
  if (!isUppercaseLetter(char)) {
    return false;
  }

  if (localIndex === 0) {
    return true;
  }

  return text[localIndex - 1] === " ";
}

export function needsLineBreakBefore(text: string, globalOffset: number): boolean {
  if (!text) {
    return false;
  }

  return isUppercaseWordStart(text, 0, globalOffset);
}

export function splitInternalUppercaseLineBreaks(
  text: string,
  globalOffset: number,
): string[] {
  if (!text) {
    return [];
  }

  const breakIndices: number[] = [];

  for (let index = 1; index < text.length; index++) {
    if (isUppercaseWordStart(text, index, globalOffset + index)) {
      breakIndices.push(index);
    }
  }

  if (breakIndices.length === 0) {
    return [text];
  }

  const parts: string[] = [];
  let start = 0;

  for (const breakAt of breakIndices) {
    parts.push(text.substring(start, breakAt));
    start = breakAt;
  }

  if (start < text.length) {
    parts.push(text.substring(start));
  }

  return parts.filter((part) => part.length > 0);
}

export function splitAtUppercaseLineBreaks(
  text: string,
  globalOffset: number,
): string[] {
  return splitInternalUppercaseLineBreaks(text, globalOffset);
}
