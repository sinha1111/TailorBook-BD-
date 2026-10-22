# Manual Android test checklist (mark only what you actually ran)

Setup: install the preview APK on at least one low-end phone and one small-screen phone.

- [ ] Fresh install: app opens in Bengali; dashboard shows "Create Your First Order"; no sample data.
- [ ] Add customer (name only, then with phone/address/notes); edit; search by name and by phone.
- [ ] Delete a customer with no orders (works) and with orders (blocked with message).
- [ ] Record measurements for Panjabi in inches; edit -> version 2; reuse version 1 as new version; switch to cm (values convert on screen only).
- [ ] Create an order (2 garments, discount, advance). Order number shown; measurement snapshot visible. Edit customer measurements afterwards - old order unchanged.
- [ ] Tap "Save order" rapidly several times -> exactly one order exists.
- [ ] Invalid input rejected: quantity 0, discount > subtotal, past delivery date, payment > balance.
- [ ] Status flow Pending -> In Progress -> Ready -> Delivered; payment status unaffected.
- [ ] Partial payments to full; reverse a payment (reversal row appears, original kept); balance correct each time.
- [ ] Cancel an order with a payment: balance 0, "Refund due" shown, order excluded from revenue, history kept.
- [ ] Orders tab: search by number/customer/garment, every filter, all sorts; overdue shows in red.
- [ ] Dashboard numbers match hand calculation (active, due today, overdue, outstanding, received today/month).
- [ ] Reports: Today / This month / All time; CSV export opens in a spreadsheet with Bengali text intact.
- [ ] Receipt PDF: shop details set vs not set; Bengali text renders (no boxes); amounts match; says receipt, not tax invoice; share sheet works; print works.
- [ ] Measurement sheet PDF renders.
- [ ] Reminders: turn on -> permission prompt; deny -> app still works and explains; allow -> create order due tomorrow and confirm notification fires; change date/status and confirm old reminder is gone.
- [ ] Backup to folder (SAF) and via share; restore the file on the same phone; confirm counts match the summary.
- [ ] Uninstall, reinstall, restore the backup -> all data, order counter and settings back; create new order -> no duplicate order number.
- [ ] Corrupt the backup file (delete a few characters) -> clear error, data unchanged. Pick a random JSON -> "not a TailorBook BD backup".
- [ ] Airplane mode: every core feature above works.
- [ ] Force-close and reopen; restart the phone; data persists.
- [ ] Small screen + large system font + keyboard open: no field hidden behind the keyboard.
- [ ] Delete all data (double confirm) -> empty dashboard; backup still restorable.
