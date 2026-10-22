import { formatMoney } from './money.ts';
import { orderFinancials, type OrderStatus, type PaymentKind } from './orders.ts';
import { GARMENT_LABEL, type FieldsMap, type Unit } from './units.ts';
import { strings, type Lang } from '../i18n/strings.ts';

export interface ReceiptData {
  lang: Lang;
  shop: { name: string; address: string; phone: string };
  customerName: string;
  order: { number: string; status: OrderStatus; orderDate: string; deliveryDate: string; discountMinor: number; totalMinor: number; fabric?: string | null; style?: string | null; instructions?: string | null };
  items: { garment: string; description?: string | null; qty: number; unitPriceMinor: number }[];
  payments: { kind: PaymentKind; amountMinor: number; method: string; date: string }[];
}

export const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bnDigits = (s: string, lang: Lang) => (lang === 'bn' ? s.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)] ?? d) : s);

const METHOD: Record<string, [string, string]> = { cash: ['নগদ', 'Cash'], mfs: ['মোবাইল ব্যাংকিং', 'Mobile banking'], bank: ['ব্যাংক', 'Bank'], other: ['অন্যান্য', 'Other'] };

const CSS = `body{font-family:'Noto Sans Bengali','Noto Sans','Roboto',sans-serif;color:#222;margin:24px;font-size:13px}
h1{font-size:20px;margin:0}h2{font-size:15px;margin:18px 0 6px;color:#0F7B5F}.muted{color:#666}
table{width:100%;border-collapse:collapse}th,td{padding:6px 4px;border-bottom:1px solid #ddd;text-align:left}td.r,th.r{text-align:right}
.tot td{border:none;padding:3px 4px}.big{font-weight:700;font-size:15px}.note{margin-top:20px;font-size:11px;color:#777}`;

export function buildReceiptHtml(d: ReceiptData): string {
  const L = (bn: string, en: string) => (d.lang === 'bn' ? bn : en);
  const m = (x: number) => esc(formatMoney(x, d.lang));
  const num = (s: string) => esc(bnDigits(s, d.lang));
  const fin = orderFinancials(d.order.status, d.order.totalMinor, d.payments.map((p) => ({ kind: p.kind, amountMinor: p.amountMinor })));
  const g = (k: string) => esc(GARMENT_LABEL[k]?.[d.lang === 'bn' ? 0 : 1] ?? k);
  const items = d.items.map((i) => `<tr><td>${g(i.garment)}${i.description ? `<br><span class="muted">${esc(i.description)}</span>` : ''}</td><td class="r">${num(String(i.qty))}</td><td class="r">${m(i.unitPriceMinor)}</td><td class="r">${m(i.qty * i.unitPriceMinor)}</td></tr>`).join('');
  const pays = d.payments.map((p) => `<tr><td>${num(p.date)}</td><td>${esc(METHOD[p.method]?.[d.lang === 'bn' ? 0 : 1] ?? p.method)}${p.kind === 'refund' ? ` (${L('ফেরত', 'refund')})` : ''}</td><td class="r">${p.kind === 'refund' ? '−' : ''}${m(p.amountMinor)}</td></tr>`).join('');
  const shopLines = [d.shop.address, d.shop.phone].filter((x) => x.trim()).map((x) => `<div class="muted">${esc(x)}</div>`).join('');
  return `<!DOCTYPE html><html lang="${d.lang}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<h1>${esc(d.shop.name.trim() || strings[d.lang].appName)}</h1>${shopLines}
<h2>${L('রশিদ / অর্ডার নিশ্চিতকরণ', 'Receipt / Order Confirmation')}</h2>
<div>${L('অর্ডার নম্বর', 'Order no.')}: <b>${esc(d.order.number)}</b> · ${esc(strings[d.lang].status[d.order.status])}</div>
<div>${L('গ্রাহক', 'Customer')}: <b>${esc(d.customerName)}</b></div>
<div>${L('অর্ডারের তারিখ', 'Order date')}: ${num(d.order.orderDate)} · ${L('ডেলিভারির তারিখ', 'Expected delivery')}: ${num(d.order.deliveryDate)}</div>
<h2>${L('পোশাক', 'Garments')}</h2>
<table><tr><th>${L('বিবরণ', 'Item')}</th><th class="r">${L('পরিমাণ', 'Qty')}</th><th class="r">${L('দাম', 'Price')}</th><th class="r">${L('মোট', 'Amount')}</th></tr>${items}</table>
${d.order.fabric ? `<div class="muted">${L('কাপড়', 'Fabric')}: ${esc(d.order.fabric)}</div>` : ''}${d.order.style ? `<div class="muted">${L('স্টাইল', 'Style')}: ${esc(d.order.style)}</div>` : ''}${d.order.instructions ? `<div class="muted">${L('নির্দেশনা', 'Instructions')}: ${esc(d.order.instructions)}</div>` : ''}
<table class="tot" style="margin-top:10px;width:60%;margin-left:40%">
${d.order.discountMinor > 0 ? `<tr><td>${L('ছাড়', 'Discount')}</td><td class="r">${m(d.order.discountMinor)}</td></tr>` : ''}
<tr><td>${L('মোট', 'Total')}</td><td class="r big">${m(d.order.totalMinor)}</td></tr>
<tr><td>${L('পরিশোধিত', 'Paid')}</td><td class="r">${m(fin.paidMinor)}</td></tr>
<tr><td>${L('বাকি', 'Balance due')}</td><td class="r big">${m(fin.balanceMinor)}</td></tr>
${fin.refundDueMinor > 0 ? `<tr><td>${L('ফেরতযোগ্য', 'Refund due')}</td><td class="r">${m(fin.refundDueMinor)}</td></tr>` : ''}</table>
${d.payments.length ? `<h2>${L('পেমেন্টের ইতিহাস', 'Payment history')}</h2><table>${pays}</table>` : ''}
<div class="note">${L('এটি একটি রশিদ/অর্ডার নিশ্চিতকরণ, ট্যাক্স ইনভয়েস নয়।', 'This is a receipt / order confirmation, not a tax invoice.')}</div></body></html>`;
}

export interface SheetData {
  lang: Lang; shop: { name: string; address: string; phone: string }; customerName: string;
  entries: { garment: string; version: number; unit: Unit; recordedAt: string; fields: FieldsMap; notes: string | null }[];
}

export function buildMeasurementSheetHtml(d: SheetData): string {
  const L = (bn: string, en: string) => (d.lang === 'bn' ? bn : en);
  const blocks = d.entries.map((e) => `<h2>${esc(GARMENT_LABEL[e.garment]?.[d.lang === 'bn' ? 0 : 1] ?? e.garment)} · ${L('সংস্করণ', 'v')}${e.version} · ${esc(bnDigits(e.recordedAt, d.lang))}</h2>
<table>${Object.values(e.fields).map((f) => `<tr><td>${esc(d.lang === 'bn' && f.bn ? f.bn : f.label)}</td><td class="r">${esc(bnDigits(String(f.value), d.lang))} ${e.unit === 'in' ? L('ইঞ্চি', 'in') : L('সেমি', 'cm')}</td></tr>`).join('')}</table>${e.notes ? `<div class="muted">${esc(e.notes)}</div>` : ''}`).join('');
  return `<!DOCTYPE html><html lang="${d.lang}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<h1>${esc(d.shop.name.trim() || strings[d.lang].appName)}</h1><h2>${L('মাপের শীট', 'Measurement sheet')}: ${esc(d.customerName)}</h2>${blocks || `<div class="muted">${L('কোনো মাপ নেই', 'No measurements')}</div>`}</body></html>`;
}
