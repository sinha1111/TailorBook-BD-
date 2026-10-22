import React from 'react';
import { useRouter } from 'expo-router';
import { MenuRow, Screen } from '@/ui/components';
import { useLang } from '@/ui/lang';

export default function More() {
  const r = useRouter(); const { L } = useLang();
  return (
    <Screen>
      <MenuRow icon="wallet" title={L('পেমেন্ট', 'Payments')} subtitle={L('বাকি ও পেমেন্টের ইতিহাস', 'Dues and payment history')} onPress={() => r.push('/payments')} />
      <MenuRow icon="calendar" title={L('ডেলিভারি সূচি', 'Delivery schedule')} subtitle={L('মেয়াদোত্তীর্ণ, আজ ও আসন্ন', 'Overdue, today and upcoming')} onPress={() => r.push('/schedule')} />
      <MenuRow icon="bar-chart" title={L('রিপোর্ট', 'Reports')} subtitle={L('প্রাপ্তি, বকেয়া, অর্ডারের পরিসংখ্যান', 'Payments, dues, order statistics')} onPress={() => r.push('/reports')} />
      <MenuRow icon="cloud-upload" title={L('ব্যাকআপ ও রিস্টোর', 'Backup & restore')} subtitle={L('আপনার তথ্য নিরাপদ রাখুন', 'Keep your data safe')} onPress={() => r.push('/backup')} />
      <MenuRow icon="shield-checkmark" title={L('এক্সপোর্ট ও গোপনীয়তা', 'Export & privacy')} subtitle={L('CSV এক্সপোর্ট, তথ্য সুরক্ষা', 'CSV export, data protection')} onPress={() => r.push('/privacy')} />
      <MenuRow icon="settings" title={L('সেটিংস', 'Settings')} subtitle={L('দোকান, ভাষা, রিমাইন্ডার', 'Shop, language, reminders')} onPress={() => r.push('/settings')} />
      <MenuRow icon="star" title={L('প্রো', 'Pro')} subtitle={L('অতিরিক্ত সুবিধা', 'Extra features')} onPress={() => r.push('/pro')} />
      <MenuRow icon="information-circle" title={L('অ্যাপ সম্পর্কে', 'About')} subtitle="TailorBook BD" onPress={() => r.push('/about')} />
    </Screen>
  );
}
