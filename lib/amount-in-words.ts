/**
 * Amount in words, as printed on Nigerian / West African receipts and
 * invoices: "Fifty-three thousand, seven hundred and fifty naira only".
 *
 * British usage ("and" inside hundreds, "one thousand and five"). Works in
 * integer minor units (kobo, cents) so float noise never reaches the words.
 */

type Units = { major: [string, string]; minor: [string, string] | null };

const CURRENCY_UNITS: Record<string, Units> = {
  NGN: { major: ["naira", "naira"], minor: ["kobo", "kobo"] },
  GHS: { major: ["Ghana cedi", "Ghana cedis"], minor: ["pesewa", "pesewas"] },
  KES: { major: ["Kenyan shilling", "Kenyan shillings"], minor: ["cent", "cents"] },
  ZAR: { major: ["rand", "rand"], minor: ["cent", "cents"] },
  USD: { major: ["US dollar", "US dollars"], minor: ["cent", "cents"] },
  GBP: { major: ["pound", "pounds"], minor: ["penny", "pence"] },
  EUR: { major: ["euro", "euros"], minor: ["cent", "cents"] },
};

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALES: [number, string][] = [
  [1_000_000_000_000, "trillion"],
  [1_000_000_000, "billion"],
  [1_000_000, "million"],
  [1_000, "thousand"],
];

function underHundred(n: number): string {
  if (n < 20) return ONES[n]!;
  const t = TENS[Math.floor(n / 10)]!;
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

function underThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (!h) return underHundred(rest);
  return rest ? `${ONES[h]} hundred and ${underHundred(rest)}` : `${ONES[h]} hundred`;
}

/** 1234567 → "one million, two hundred and thirty-four thousand, five hundred and sixty-seven" */
export function integerToWords(n: number): string {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`Unsupported amount: ${n}`);
  if (n === 0) return "zero";

  const parts: string[] = [];
  let rest = n;
  for (const [size, name] of SCALES) {
    if (rest >= size) {
      parts.push(`${underThousand(Math.floor(rest / size))} ${name}`);
      rest %= size;
    }
  }
  if (rest) {
    // "one thousand and five": British "and" before a final group under 100.
    parts.push(parts.length && rest < 100 ? `and ${underHundred(rest)}` : underThousand(rest));
  }
  return parts.join(", ").replace(", and ", " and ");
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function amountInWords(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const minorUnits = Math.round(Math.abs(amount) * 100);
  const major = Math.floor(minorUnits / 100);
  const minor = minorUnits % 100;

  const units = CURRENCY_UNITS[code];
  if (!units) {
    const words = integerToWords(major) + (minor ? ` and ${minor}/100` : "");
    return `${capitalise(words)} ${code} only`;
  }

  const majorText = `${integerToWords(major)} ${units.major[major === 1 ? 0 : 1]}`;
  if (!minor || !units.minor) return `${capitalise(majorText)} only`;

  const minorText = `${integerToWords(minor)} ${units.minor[minor === 1 ? 0 : 1]}`;
  if (major === 0) return `${capitalise(minorText)} only`;
  return `${capitalise(majorText)} and ${minorText} only`;
}
