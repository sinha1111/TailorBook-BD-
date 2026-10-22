import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Runs `fn` every time the screen gains focus, so lists refresh after saves. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let on = true;
      fn().then((d) => { if (on) { setData(d); setError(null); } }).catch((e: unknown) => { if (on) setError(e instanceof Error ? e.message : String(e)); });
      return () => { on = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, tick]),
  );
  return { data, error, reload: () => setTick((t) => t + 1) };
}
