import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { strings, type Lang } from '../i18n/strings';

const extra: Record<string, [string, string]> = {
  name_required: ['নাম দিতে হবে', 'Name is required'],
  items_required: ['কমপক্ষে একটি পোশাক যোগ করুন', 'Add at least one garment'],
  discount_invalid: ['ছাড় সঠিক নয়', 'Invalid discount'],
  date_invalid: ['ডেলিভারির তারিখ সঠিক নয় (YYYY-MM-DD) বা অতীতের', 'Invalid or past delivery date (YYYY-MM-DD)'],
  customer_required: ['গ্রাহক নির্বাচন করুন', 'Select a customer'],
  customer_has_orders: ['এই গ্রাহকের অর্ডার আছে, মুছা যাবে না', 'This customer has orders and cannot be deleted'],
  transition_invalid: ['এই স্ট্যাটাসে যাওয়া যাবে না', 'That status change is not allowed'],
  already_reversed: ['এই পেমেন্ট আগেই ফেরত দেওয়া হয়েছে', 'This payment was already reversed'],
  not_found: ['পাওয়া যায়নি', 'Not found'],
  billing_not_configured: ['এই বিল্ডে Pro কেনা সক্রিয় নয়', 'Pro purchase is not set up in this build'],
  backup_corrupted: ['ব্যাকআপ ফাইলটি নষ্ট বা ভুল', 'The backup file is corrupted or not a valid backup'],
  backup_wrong_app: ['এটি টেইলরবুক বিডি-র ব্যাকআপ নয়', 'This is not a TailorBook BD backup'],
  backup_unsupported_version: ['ব্যাকআপটি নতুন সংস্করণের — অ্যাপ আপডেট করুন', 'This backup is from a newer app version — update the app'],
  backup_missing_table: ['ব্যাকআপে প্রয়োজনীয় তথ্য নেই', 'The backup is missing required data'],
  backup_bad_row: ['ব্যাকআপে ভুল রেকর্ড আছে', 'The backup contains invalid records'],
  backup_duplicate_id: ['ব্যাকআপে ডুপ্লিকেট রেকর্ড আছে', 'The backup contains duplicate records'],
  backup_broken_reference: ['ব্যাকআপে সংযোগ-ছেঁড়া রেকর্ড আছে', 'The backup has records that reference missing data'],
  restore_failed: ['রিস্টোর ব্যর্থ — আপনার বর্তমান তথ্য অপরিবর্তিত আছে', 'Restore failed — your current data was not changed'],
  share_unavailable: ['এই ডিভাইসে শেয়ার সুবিধা নেই', 'Sharing is not available on this device'],
  measurement_empty: ['কমপক্ষে একটি মাপ দিন', 'Enter at least one measurement'],
  measurement_invalid: ['মাপ অবশ্যই ০ এর বেশি হতে হবে', 'Measurements must be greater than 0'],
  total_below_paid: ['নতুন মোট পরিশোধিত টাকার কম হতে পারবে না', 'New total cannot be lower than the amount already paid'],
};

interface Ctx { lang: Lang; setLang: (l: Lang) => void; L: (bn: string, en: string) => string; s: (typeof strings)[Lang]; err: (e: unknown) => string }
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [lang, setLangState] = useState<Lang>('bn');
  useEffect(() => {
    db.getFirstAsync<{ value: string }>("SELECT value FROM app_preferences WHERE key='lang'").then((r) => { if (r?.value === 'en') setLangState('en'); });
  }, [db]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    void db.runAsync("INSERT INTO app_preferences(key,value) VALUES('lang',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", l);
  }, [db]);
  const s = strings[lang];
  const L = (bn: string, en: string) => (lang === 'bn' ? bn : en);
  const err = (e: unknown) => {
    const code = e instanceof Error ? e.message : String(e);
    const known = (s.errors as Record<string, string>)[code];
    if (known) return known;
    const x = extra[code];
    return x ? x[lang === 'bn' ? 0 : 1] : L('কিছু ভুল হয়েছে', 'Something went wrong');
  };
  return <LangCtx.Provider value={{ lang, setLang, L, s, err }}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error('LangProvider missing');
  return c;
}
