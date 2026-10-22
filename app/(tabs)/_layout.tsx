import React from 'react';
import { Pressable, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLang } from '@/ui/lang';
import { colors } from '@/ui/theme';

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <Pressable onPress={() => setLang(lang === 'bn' ? 'en' : 'bn')} accessibilityRole="button" accessibilityLabel="Language" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{lang === 'bn' ? 'EN' : 'বাংলা'}</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const { s, L } = useLang();
  const icon = (name: React.ComponentProps<typeof Ionicons>['name']) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' }, headerRight: () => <LangToggle />,
      tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line }, tabBarLabelStyle: { fontSize: 11 },
    }}>
      <Tabs.Screen name="index" options={{ title: L('হোম', 'Home'), headerTitle: L('টেইলরবুক বিডি', 'TailorBook BD'), tabBarIcon: icon('home') }} />
      <Tabs.Screen name="customers" options={{ title: s.nav.customers, tabBarIcon: icon('people') }} />
      <Tabs.Screen name="orders" options={{ title: s.nav.orders, tabBarIcon: icon('receipt') }} />
      <Tabs.Screen name="measurements" options={{ title: L('মাপ', 'Measures'), headerTitle: s.nav.measurements, tabBarIcon: icon('cut') }} />
      <Tabs.Screen name="more" options={{ title: L('আরও', 'More'), headerTitle: L('আরও', 'More'), tabBarIcon: icon('grid') }} />
    </Tabs>
  );
}
