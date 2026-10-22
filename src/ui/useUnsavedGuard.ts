import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/** Asks before leaving a form with unsaved changes (header back, Android back, gestures). Call allow() right before a successful save navigates away. */
export function useUnsavedGuard(dirty: boolean, t: { title: string; message: string; stay: string; discard: string }) {
  const navigation = useNavigation();
  const allowed = useRef(false);
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (!dirty || allowed.current) return;
    e.preventDefault();
    Alert.alert(t.title, t.message, [
      { text: t.stay, style: 'cancel' },
      { text: t.discard, style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
    ]);
  }), [navigation, dirty, t.title, t.message, t.stay, t.discard]);
  return { allow: () => { allowed.current = true; } };
}
