/** Ads are OFF in this build (no ad SDK installed). This policy is what any future ad integration must obey. */
export const ADS_ENABLED = false;

/** Banner ads may appear ONLY on these browse/report screens, never on data-entry or money screens. */
const BANNER_ALLOWLIST = ['/(tabs)/customers', '/(tabs)/orders', '/measurements', '/reports'];

export function bannerAllowed(route: string, isPro: boolean, enabled: boolean = ADS_ENABLED): boolean {
  return enabled && !isPro && BANNER_ALLOWLIST.includes(route);
}

/** No interstitials anywhere: not during order creation, payments, receipts or restore. */
export const INTERSTITIALS_ALLOWED = false;
