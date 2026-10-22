import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getOrderDetail } from '../db/orders';
import { getShop } from '../db/settings';
import { getCustomer } from '../db/customers';
import { listCustomerMeasurements } from '../db/measurements';
import { buildMeasurementSheetHtml, buildReceiptHtml, type ReceiptData } from '../domain/receipt';
import type { FieldsMap } from '../domain/units';
import type { Lang } from '../i18n/strings';
import { shareFileUri } from './files';

export async function loadReceiptData(db: SQLiteDatabase, orderId: string, lang: Lang): Promise<ReceiptData> {
  const d = await getOrderDetail(db, orderId);
  if (!d) throw new Error('not_found');
  const shop = await getShop(db);
  return {
    lang, shop: { name: shop.shop_name, address: shop.shop_address, phone: shop.shop_phone }, customerName: d.order.customer_name,
    order: { number: d.order.order_number, status: d.order.status, orderDate: d.order.order_date, deliveryDate: d.order.delivery_date, discountMinor: d.order.discount_minor, totalMinor: d.order.total_minor, fabric: d.order.fabric_info, style: d.order.style_notes, instructions: d.order.instructions },
    items: d.items.map((i) => ({ garment: i.garment_type, description: i.description, qty: i.quantity, unitPriceMinor: i.unit_price_minor })),
    payments: d.payments.map((p) => ({ kind: p.kind, amountMinor: p.amount_minor, method: p.method, date: p.paid_at.slice(0, 10) })),
  };
}

async function sharePdf(html: string, fileName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  const target = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.moveAsync({ from: uri, to: target });
  await shareFileUri(target, 'application/pdf');
}

export async function shareReceiptPdf(db: SQLiteDatabase, orderId: string, lang: Lang): Promise<void> {
  const d = await loadReceiptData(db, orderId, lang);
  await sharePdf(buildReceiptHtml(d), `receipt-${d.order.number}.pdf`);
}

export async function printReceipt(db: SQLiteDatabase, orderId: string, lang: Lang): Promise<void> {
  await Print.printAsync({ html: buildReceiptHtml(await loadReceiptData(db, orderId, lang)) });
}

export async function shareMeasurementSheet(db: SQLiteDatabase, customerId: string, lang: Lang): Promise<void> {
  const c = await getCustomer(db, customerId);
  if (!c) throw new Error('not_found');
  const shop = await getShop(db);
  const all = await listCustomerMeasurements(db, customerId);
  const latest = all.filter((m, i) => all.findIndex((x) => x.garment_type === m.garment_type) === i); // rows are version DESC per garment
  const html = buildMeasurementSheetHtml({
    lang, shop: { name: shop.shop_name, address: shop.shop_address, phone: shop.shop_phone }, customerName: c.name,
    entries: latest.map((m) => ({ garment: m.garment_type, version: m.version, unit: m.unit, recordedAt: m.recorded_at.slice(0, 10), fields: JSON.parse(m.fields_json) as FieldsMap, notes: m.notes })),
  });
  await sharePdf(html, `measurements-${c.id}.pdf`);
}
