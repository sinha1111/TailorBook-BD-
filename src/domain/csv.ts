export type Cell = string | number | null;

/** RFC 4180 quoting plus a guard so spreadsheet apps don't execute text starting with = + - @ as a formula. */
export function toCsv(rows: Cell[][]): string {
  const cell = (c: Cell): string => {
    if (c === null) return '';
    let s = String(c);
    if (typeof c === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n'); // BOM keeps Bengali readable in Excel
}

export function minorToDecimal(minor: number): string {
  const neg = minor < 0; const a = Math.abs(minor);
  return `${neg ? '-' : ''}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`;
}
