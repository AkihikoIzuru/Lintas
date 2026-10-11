// Fractional indexing for drag-and-drop ordering
// Based on: https://www.figma.com/blog/realtime-editing-of-ordered-sequences/

const BASE = 62;
const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function getIntegerPart(pos: string): string {
  const index = pos.indexOf(".");
  return index === -1 ? pos : pos.substring(0, index);
}

function getFractionalPart(pos: string): string {
  const index = pos.indexOf(".");
  return index === -1 ? "" : pos.substring(index + 1);
}

function increment(pos: string): string {
  const int = getIntegerPart(pos);
  const frac = getFractionalPart(pos);

  if (frac === "") {
    return int + "0";
  }

  let carry = 1;
  let result = "";

  for (let i = frac.length - 1; i >= 0; i--) {
    const char = frac[i];
    const digit = CHARSET.indexOf(char);
    const sum = digit + carry;

    if (sum >= BASE) {
      result = CHARSET[0] + result;
      carry = 1;
    } else {
      result = CHARSET[sum] + result;
      carry = 0;
      break;
    }
  }

  if (carry === 1) {
    return String(Number(int) + 1);
  }

  return int + "." + result;
}

export function generateKeyBetween(a: string | null, b: string | null): string {
  if (a === null && b === null) {
    return "a0";
  }

  if (a === null) {
    const intB = getIntegerPart(b!);
    const fracB = getFractionalPart(b!);

    if (intB === "0") {
      return "0." + fracB + "0";
    }

    return "0";
  }

  if (b === null) {
    return increment(a);
  }

  const intA = getIntegerPart(a);
  const intB = getIntegerPart(b);
  const fracA = getFractionalPart(a);
  const fracB = getFractionalPart(b);

  if (intA !== intB) {
    const intANum = Number(intA);
    const intBNum = Number(intB);

    if (intBNum - intANum > 1) {
      return String(intANum + 1);
    }

    return intA + "." + (fracA || "0") + "5";
  }

  // Same integer part, generate between fractional parts
  let result = intA + ".";
  let i = 0;

  while (true) {
    const digitA = i < fracA.length ? CHARSET.indexOf(fracA[i]) : 0;
    const digitB = i < fracB.length ? CHARSET.indexOf(fracB[i]) : BASE;

    if (digitB - digitA > 1) {
      result += CHARSET[digitA + 1];
      break;
    }

    result += CHARSET[digitA];
    i++;

    if (i > 100) {
      // Safety guard
      result += "5";
      break;
    }
  }

  return result;
}

export function generateNKeysBetween(
  a: string | null,
  b: string | null,
  n: number
): string[] {
  if (n <= 0) return [];
  if (n === 1) return [generateKeyBetween(a, b)];

  const keys: string[] = [];
  let prev = a;

  for (let i = 0; i < n; i++) {
    const key = generateKeyBetween(prev, b);
    keys.push(key);
    prev = key;
  }

  return keys;
}

// Convert fractional index to float for sorting
export function toFloat(pos: string): number {
  const int = getIntegerPart(pos);
  const frac = getFractionalPart(pos);

  let decimal = 0;
  for (let i = 0; i < frac.length; i++) {
    const digit = CHARSET.indexOf(frac[i]);
    decimal += digit / Math.pow(BASE, i + 1);
  }

  return Number(int) + decimal;
}