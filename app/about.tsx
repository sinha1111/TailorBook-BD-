import React from 'react';
import { Image, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Card, Screen, T } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { colors } from '@/ui/theme';

export default function About() {
  const { L } = useLang();
  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <Image source={require('../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 22 }} accessibilityLabel="TailorBook BD" />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>TailorBook BD</Text>
        <T muted>{L('সংস্করণ ', 'Version ')}{Constants.expoConfig?.version ?? '1.0.0'}</T>
      </View>
      <Card>
        <T>{L('দর্জি ও ছোট টেইলারিং ব্যবসার জন্য অফলাইন গ্রাহক, মাপ, অর্ডার ও পেমেন্ট ম্যানেজার।', 'An offline customer, measurement, order and payment manager for tailors and small tailoring shops.')}</T>
        <T muted>com.tricosoft.tailorbookbd</T>
        <T muted>{L('কোনো অ্যাকাউন্ট, সার্ভার বা অ্যানালিটিক্স নেই।', 'No account, server or analytics.')}</T>
      </Card>
    </Screen>
  );
}
