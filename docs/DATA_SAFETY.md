# Google Play Data safety - worksheet for THIS build (re-check against the live form and current policy before submitting)

| Question | Answer for this build |
|---|---|
| Does the app collect or share any user data? | No. Data stays on device; nothing is sent to the developer or third parties. |
| Is all data encrypted in transit? | N/A - no data transmitted. |
| Can users request data deletion? | Yes - in-app "Delete all data", or uninstall. |
| Ads | None in this build. |
| Purchases | None in this build. |
| Third-party SDKs that collect data | None (Expo modules only; verify with the build's dependency list). |
| Permissions declared | `POST_NOTIFICATIONS` (delivery reminders). No storage, contacts, location, camera or microphone permissions. |

If you later add **AdMob**: declare advertising ID / device identifiers and approximate location use per Google's AdMob data-disclosure guidance, update the Privacy Policy, handle consent where required, and add the `AD_ID` permission handling. If you add **Play Billing**: declare purchase history as applicable. Update this sheet before releasing that version.
