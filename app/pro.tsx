import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, H, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { colors } from '@/ui/theme';

export default function Pro() {
  const { L } = useLang();
  const perks = [L('বিজ্ঞাপনমুক্ত অভিজ্ঞতা', 'Ad-free experience'), L('উন্নত রিপোর্ট', 'Advanced reports'), L('PDF রশিদে ব্র্যান্ডিং', 'PDF receipt branding'), L('অতিরিক্ত মাপের টেমপ্লেট', 'Additional measurement templates'), L('উন্নত এক্সপোর্ট', 'Advanced export options')];
  return (
    <Screen>
      <H>{L('টেইলরবুক প্রো (পরিকল্পিত)', 'TailorBook Pro (planned)')}</H>
      <Card>
        {perks.map((p) => <View key={p} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 }}><Ionicons name="checkmark-circle" size={20} color={colors.secondary} /><T>{p}</T></View>)}
      </Card>
      <Btn title={L('প্রো-তে আপগ্রেড (এখনও উপলব্ধ নয়)', 'Upgrade to Pro (not available yet)')} onPress={() => undefined} disabled />
      <Card>
        <T muted>{L('এই বিল্ডে Google Play Billing সেট করা নেই, তাই কেনা যাচ্ছে না। বর্তমানে সব সুবিধা বিনামূল্যে।', 'Google Play Billing is not set up in this build, so purchase is unavailable. Everything is currently free.')}</T>
        <T muted>{L('প্রো না থাকলেও আপনার গ্রাহক, অর্ডার ও পেমেন্টের তথ্য কখনও আটকানো বা মুছে ফেলা হবে না।', 'Your customers, orders and payments are never locked or deleted without Pro.')}</T>
      </Card>
    </Screen>
  );
}
