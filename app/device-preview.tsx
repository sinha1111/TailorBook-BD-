import React, { useState } from 'react';
import { Platform, ScrollView, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chip, Row } from '@/ui/components';
import { useLang } from '@/ui/lang';
import { colors, fonts, radius, spacing } from '@/ui/theme';

type Device = { id: string; name: string; width: number; height: number };

const IPHONE_14: Device = { id: 'iphone', name: 'iPhone 14', width: 390, height: 844 };

const DEVICES: Device[] = [
  { id: 'small', name: 'Small Android', width: 320, height: 640 },
  { id: 'se', name: 'iPhone SE', width: 375, height: 667 },
  IPHONE_14,
  { id: 'pixel', name: 'Pixel 7', width: 412, height: 915 },
  { id: 'tablet', name: 'iPad mini', width: 768, height: 1024 },
];

export default function DevicePreview() {
  const { L } = useLang();
  const [device, setDevice] = useState<Device>(IPHONE_14);
  const [reloadKey, setReloadKey] = useState(0);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background }}>
        <Text style={{ fontSize: fonts.body, color: colors.muted, textAlign: 'center' }}>
          {L('এই প্রিভিউ শুধু ওয়েব ব্রাউজারে দেখা যায়।', 'This preview is only available in a web browser.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface }}>
        <Row>
          {DEVICES.map((d) => (
            <Chip key={d.id} label={d.name} selected={d.id === device.id} onPress={() => setDevice(d)} />
          ))}
        </Row>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fonts.small, color: colors.muted }}>{`${device.name} · ${device.width} × ${device.height}`}</Text>
          <Pressable
            onPress={() => setReloadKey((k) => k + 1)}
            accessibilityRole="button"
            accessibilityLabel={L('রিলোড', 'Reload')}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={{ fontSize: fonts.small, fontWeight: '600', color: colors.primary }}>{L('রিলোড', 'Reload')}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center' }}>
        <View
          style={{
            width: device.width + 20,
            height: device.height + 20,
            borderRadius: radius.lg * 2,
            borderWidth: 10,
            borderColor: colors.ink,
            backgroundColor: colors.ink,
            overflow: 'hidden',
          }}
        >
          <iframe
            key={`${device.id}-${reloadKey}`}
            src="/"
            title={device.name}
            style={{ width: '100%', height: '100%', border: 0, backgroundColor: colors.background }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
