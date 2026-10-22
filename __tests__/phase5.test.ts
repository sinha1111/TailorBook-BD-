import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bannerAllowed, ADS_ENABLED, INTERSTITIALS_ALLOWED } from '../src/monetization/adPolicy.ts';
import { UnconfiguredBilling } from '../src/monetization/entitlements.ts';

test('ads are off by default and never allowed on money or data-entry screens', () => {
  assert.equal(ADS_ENABLED, false);
  assert.equal(INTERSTITIALS_ALLOWED, false);
  assert.equal(bannerAllowed('/(tabs)/orders', false), false);            // disabled globally
  for (const r of ['/order/new', '/order/[id]', '/order/edit', '/settings', '/measurement/edit', '/customer/edit', '/(tabs)/payments'])
    assert.equal(bannerAllowed(r, false, true), false, r);
  assert.equal(bannerAllowed('/(tabs)/orders', false, true), true);        // browse screens only when enabled
  assert.equal(bannerAllowed('/(tabs)/orders', true, true), false);        // Pro = ad-free
});

test('unconfigured billing cannot unlock Pro', async () => {
  const b = new UnconfiguredBilling();
  assert.deepEqual(await b.getEntitlement(), { isPro: false, source: 'none' });
  await assert.rejects(() => b.purchasePro(), /billing_not_configured/);
  assert.equal((await b.restorePurchases()).isPro, false);
});
