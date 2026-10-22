# TailorBook BD

Offline Android tailoring manager (Bengali + English). React Native (Expo SDK 54), TypeScript strict, Expo Router, SQLite. No server, no account, no analytics.
Package ID: `com.tricosoft.tailorbookbd`

## 1. Setup (Windows / PowerShell)

Prerequisites: Node.js 20+ (22 recommended), Git, JDK 17 and Android Studio (SDK + platform tools) for local device runs.

```powershell
cd tailorbook-bd
npm install
npx expo install --fix        # aligns every Expo package to the exact SDK 54 versions
npm test                      # business-logic tests (Node built-in runner, no extra deps)
npx tsc --noEmit              # type check (must be clean before building)
```

Run on a phone/emulator (a development build is required - expo-sqlite, notifications and file APIs are not reliable in Expo Go):

```powershell
adb devices                   # USB debugging on, device listed
npx expo run:android
```

## 2. Build the APK (installable test build) and AAB (Play Store)

```powershell
npm install -g eas-cli
eas login
eas build:configure           # once; eas.json is already provided
eas build -p android --profile preview      # -> APK (internal distribution)
eas build -p android --profile production   # -> AAB (app-bundle) for Google Play
```

Notes
- `eas build --local` is not supported on Windows; use EAS cloud builds (free tier has a queue) or WSL/Linux.
- First production build offers to generate an Android keystore. Accept, then back it up: `eas credentials` -> Android -> download keystore. Losing the upload key makes updates painful (Play App Signing lets you reset an *upload* key via Play support).
- `versionCode` auto-increments on production builds (`appVersionSource: remote`). Change the marketing version in `app.json` -> `expo.version`.

## 3. Install and test the APK

1. Open the build URL EAS prints, download `.apk` on the phone (or PC).
2. Phone: allow "Install unknown apps" for the browser/file manager, tap the APK. Or from PC: `adb install -r .\tailorbook.apk`.
3. Walk through `docs/MANUAL_TEST_CHECKLIST.md`.

## 4. Project layout

```
app/                 Expo Router screens (tabs + stack)
src/domain/          Pure logic, unit-tested: money, orders/payments, units, dates, backup validation, receipts, CSV, reminders
src/db/              SQLite schema/migrations + repositories (customers, orders, payments, measurements, reports, backup)
src/services/        Device integrations: files/share, PDF, notifications
src/monetization/    Ads policy + billing placeholder (no ad/billing SDK installed)
src/ui/              Theme, shared components, language provider
__tests__/           node:test suites
docs/                Privacy policy draft, Data safety, Play checklist, store listing, manual test list, monetization notes
```

## 5. Important business rules

- **Money** is stored as integer paisa (1 BDT = 100). Never floats.
- **Totals are never stored**: order total = sum(items) - discount; paid = payments - refunds; balance = max(total - paid, 0).
- **Payments ledger is append-only.** Mistakes are fixed with a reversal (refund row linked to the original). Overpayment is blocked.
- **Cancelled orders** count as zero revenue/receivable; their payments stay visible and any net paid amount shows as "refund due".
- **Status changes never mark an order paid or touch payments.**
- **Measurements are versioned** (append-only) and each order stores a **frozen snapshot** per garment, so later edits never alter old orders.
- **Customers with orders cannot be deleted.** Orders/payments are never hard-deleted by the app (only "Delete all data" in Settings, double-confirmed).
- **Duplicate taps** cannot create duplicate orders (idempotency key per form instance; unique DB constraint).
- **Order numbers** (`TB-2026-0001`) come from a DB counter incremented in the same transaction as the order; restore resets the counter from restored data.
- **Reports** show order value, discounts, cash received and refunds separately. They are revenue figures, not profit (expenses are not tracked).

Database tables: `customers, measurements, orders, order_items, order_measurement_snapshots, payments, shop_settings, app_preferences, counters, schema_migrations` (see `src/db/migrations.ts` for full DDL, constraints and indexes). Add schema changes as a new entry in `MIGRATIONS` and bump `BACKUP_SCHEMA_VERSION` + backup columns together.

## 6. Status

### Written and unit-tested here (21 tests, logic only)
Money parsing/formatting, order totals/discounts, partial payments, overpayment block, refunds/reversals, cancellation treatment, status transitions, overdue, unit conversion, measurement validation, date helpers, migration runner, backup validation (corrupt/foreign/newer/duplicate/broken-reference), order-counter recovery, Bengali/English receipt + measurement-sheet HTML (real data, escaping, not-a-tax-invoice wording), CSV safety, reminder planning, ad policy, billing placeholder.

### Written but NOT run on a device/compiler (verify first)
All screens; every SQL repository (customers, orders, payments, reports, dashboard, measurements, backup/restore); SAF folder save, share sheet, document picker; `expo-print` PDF output; notification scheduling; the Expo package versions in `package.json`. Run `npx tsc --noEmit` and the manual checklist; fix what they find.

### Not implemented
- Editing quantity/price of existing order lines (cancel + recreate, or extend `updateOrder`).
- Dark theme; optional PIN lock; database encryption.
- Bundled Bengali font in PDFs (system font is used; see below).
- Per-order overdue notifications (one daily-style summary is scheduled instead).
- Automated tests for SQL repositories and screens (they need a device/emulator SQLite).
- Lint configuration (no ESLint set up).

### Needs your external credentials / decisions
- Google Play Console app + signing, and a service account if you want `eas submit`.
- AdMob account, app ID and ad unit IDs (`docs/MONETIZATION.md`). Ads are **off**.
- Google Play Billing product (`tailorbook_pro`) and a maintained billing library. Pro is **not purchasable** in this build.
- Privacy-policy hosting URL, support email, store graphics/screenshots, final icon artwork (`assets/icon.png` is a simple generated placeholder).

### Bengali font in PDFs
Receipts request "Noto Sans Bengali" and fall back to the device's system font; most current Android phones render Bengali correctly. If a device shows empty boxes in PDFs, embed the font: add `NotoSansBengali-Regular.ttf` (SIL OFL) under `assets/fonts/`, load it with `expo-asset` + `expo-file-system` as base64, and add an `@font-face { src: url(data:font/ttf;base64,...) }` rule to the CSS in `src/domain/receipt.ts`.
