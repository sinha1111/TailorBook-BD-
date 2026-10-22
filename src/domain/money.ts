/** All money is stored as integer minor units (paisa). 1 BDT = 100 paisa. */
export type Minor = number;

/** Parse user text like "1,250.50" or "১২৫০.৫০" into paisa. Returns null if invalid or negative. */
export function parseMoney(input: string): Minor | null {
  const bn = '০১২৩৪৫৬৭৮৯';
  const s = input.trim().replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/[,\s৳]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole = '0', frac = ''] = s.split('.');
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(minor) ? minor : null;
}

export function formatMoney(minor: Minor, lang: 'bn' | 'en' = 'bn'): string {
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  let text = whole.toLocaleString('en-US');
  if (frac !== 0) text += '.' + String(frac).padStart(2, '0');
  if (lang === 'bn') text = text.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)] ?? d);
  return `${neg ? '-' : ''}৳${text}`;
}
