# Ads and Pro - integration notes (nothing is active in this build)

**Rules baked into the code**
- `src/monetization/adPolicy.ts`: ads are disabled; if enabled, banners only on browse screens (customers/orders lists, measurements picker, reports); never on order creation/edit, payments, receipts, measurements entry, settings or restore; no interstitials.
- `src/monetization/entitlements.ts`: `UnconfiguredBilling` cannot unlock Pro. Entitlement must come only from Google Play Billing, never from preferences or backups. Existing data is never hidden or deleted when Pro is absent. The Settings "Upgrade to Pro" button is disabled and says it is not available.

**Adding AdMob (after the app is stable)**
1. Create AdMob app + banner unit; keep Google's *test* IDs during development.
2. `npx expo install react-native-google-mobile-ads`, add its config plugin with your Android app ID in `app.json`, rebuild a dev client.
3. Render a banner component gated by `bannerAllowed(route, isPro)`.
4. Update Data safety, privacy policy, and consent flow; test with test ads only.

**Adding Pro (one-time purchase)**
1. Play Console -> Monetize -> In-app products: create `tailorbook_pro` (or change `PRO_PRODUCT_ID`).
2. Pick a maintained billing library compatible with SDK 54 (e.g. `react-native-iap`/`expo-iap` - verify current docs), implement `BillingProvider` (`getEntitlement`, `purchasePro`, `restorePurchases`), acknowledge purchases, re-check entitlement on launch (works offline from the cached Play purchase state).
3. Gate only Pro extras (advanced reports, PDF branding, extra templates, advanced exports). Do not gate viewing/creating core records. Currently every feature is free because no Pro-only feature has been built yet.
4. Test with licensed testers / internal testing track.
