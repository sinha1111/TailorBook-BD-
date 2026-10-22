import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ORDERS_FIN, ACTIVE_SQL } from '../db/sql';
import { getPref } from '../db/settings';
import { planReminders } from '../domain/reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** Asked only when the user switches reminders on. */
export async function requestReminderPermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Rebuilds all delivery reminders from the database. Never throws: order management works even if notifications fail. */
export async function syncReminders(db: SQLiteDatabase): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if ((await getPref(db, 'reminders')) !== '1') return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.setNotificationChannelAsync('deliveries', { name: 'Delivery reminders', importance: Notifications.AndroidImportance.DEFAULT });
    const rows = await db.getAllAsync<{ id: string; order_number: string; customer_name: string; delivery_date: string; active: number }>(
      `SELECT id, order_number, customer_name, delivery_date, (${ACTIVE_SQL}) AS active FROM ${ORDERS_FIN} x WHERE ${ACTIVE_SQL}`);
    const lang = (await getPref(db, 'lang')) === 'en' ? 'en' : 'bn';
    const plan = planReminders(rows.map((r) => ({ id: r.id, orderNumber: r.order_number, customerName: r.customer_name, deliveryDate: r.delivery_date, active: !!r.active })),
      new Date(), { dayBefore: (await getPref(db, 'remind_before')) === '1', lang });
    for (const p of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: p.identifier,
        content: { title: p.title, body: p.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: 'deliveries' },
      });
    }
  } catch {
    /* notifications are optional */
  }
}
