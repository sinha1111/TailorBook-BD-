import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Chip, PrimaryButton, Row } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { colors } from '@/ui/theme';

export default function Intro() {
  const r = useRouter(); const { L, lang, setLang } = useLang();
  const items = [L('গ্রাহক ও মাপ সংরক্ষণ', 'Customers & measurements'), L('অর্ডার ট্র্যাকিং ও ডেলিভারি রিমাইন্ডার', 'Order tracking & delivery reminders'), L('পেমেন্ট ও বাকির হিসাব', 'Payments & due ledger'), L('PDF রশিদ, রিপোর্ট ও ব্যাকআপ', 'PDF receipts, reports & backup')];
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 64, alignItems: 'center', gap: 14 }}>
        <Image source={require('../assets/icon.png')} style={{ width: 110, height: 110, borderRadius: 26 }} accessibilityLabel="TailorBook BD" />
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.primary }}>TailorBook BD</Text>
        <Text style={{ fontSize: 15, color: colors.muted, textAlign: 'center' }}>{L('ইন্টারনেট ছাড়াই আপনার টেইলারিং ব্যবসা পরিচালনা করুন। কোনো অ্যাকাউন্ট লাগবে না।', 'Run your tailoring business without internet. No account needed.')}</Text>
        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 14 }}>
          {items.map((t) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
              <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontWeight: '700', color: colors.ink, marginTop: 12 }}>{L('ভাষা', 'Language')}</Text>
        <Row><Chip label="বাংলা" selected={lang === 'bn'} onPress={() => setLang('bn')} /><Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} /></Row>
        <View style={{ alignSelf: 'stretch', marginTop: 16 }}><PrimaryButton title={L('পরবর্তী', 'Next')} onPress={() => r.push('/setup')} /></View>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Offline · Simple · Reliable</Text>
      </ScrollView>
    </View>
  );
}
