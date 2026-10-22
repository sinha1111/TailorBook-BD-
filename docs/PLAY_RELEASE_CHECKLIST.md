# Google Play release checklist (verify each item against current Play Console requirements)

- [ ] `npx tsc --noEmit` clean, `npm test` green, manual checklist completed on real devices.
- [ ] Final icon (512x512 store icon, adaptive icon), feature graphic 1024x500, phone screenshots (Bengali + English).
- [ ] `app.json`: name, version, `android.package = com.tricosoft.tailorbookbd`; versionCode auto-increments (EAS remote).
- [ ] Target API level meets Play's current minimum (check Expo SDK 54 defaults vs. Play policy page).
- [ ] Build AAB: `eas build -p android --profile production`; keystore backed up.
- [ ] Create app in Play Console; enroll in Play App Signing; upload AAB to Internal testing first.
- [ ] Privacy policy published at a public URL (from `docs/PRIVACY_POLICY.md`, finalized); link added in Console.
- [ ] Data safety form completed from `docs/DATA_SAFETY.md`; content rating questionnaire; target audience (not children); app category (Business).
- [ ] Store listing text (`docs/STORE_LISTING.md`) in Bengali and English.
- [ ] If your Play developer account is a new personal account, check the current closed-testing requirement before production release.
- [ ] Release notes; staged rollout; monitor Android vitals.
- [ ] If adding ads/billing later: follow `docs/MONETIZATION.md`, update policy + Data safety first.
