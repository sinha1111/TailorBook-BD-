/** Placeholder id - must match the in-app product created in Google Play Console. */
export const PRO_PRODUCT_ID = 'tailorbook_pro';

export interface Entitlement { isPro: boolean; source: 'none' | 'play_billing' }

export interface BillingProvider {
  getEntitlement(): Promise<Entitlement>;
  purchasePro(): Promise<Entitlement>;
  restorePurchases(): Promise<Entitlement>;
}

/**
 * No billing library or Play Console product is configured in this build, so nothing can unlock Pro.
 * Entitlement must come only from Google Play Billing - never from app_preferences or a backup file,
 * otherwise a restored/edited backup could fake it. Business data is never locked either way.
 */
export class UnconfiguredBilling implements BillingProvider {
  async getEntitlement(): Promise<Entitlement> { return { isPro: false, source: 'none' }; }
  async purchasePro(): Promise<Entitlement> { throw new Error('billing_not_configured'); }
  async restorePurchases(): Promise<Entitlement> { return this.getEntitlement(); }
}

export const billing: BillingProvider = new UnconfiguredBilling();
