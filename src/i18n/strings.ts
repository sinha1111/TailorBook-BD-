export type Lang = 'bn' | 'en';
export const strings = {
  bn: {
    appName: 'টেইলরবুক বিডি',
    nav: { dashboard: 'ড্যাশবোর্ড', customers: 'গ্রাহক', orders: 'অর্ডার', measurements: 'মাপ', payments: 'পেমেন্ট', reports: 'রিপোর্ট', settings: 'সেটিংস' },
    status: { pending: 'অপেক্ষমাণ', in_progress: 'চলছে', ready: 'প্রস্তুত', delivered: 'ডেলিভারি হয়েছে', cancelled: 'বাতিল' },
    errors: { quantity_invalid: 'পরিমাণ কমপক্ষে ১ হতে হবে', price_invalid: 'দাম সঠিক নয়', amount_invalid: 'টাকার পরিমাণ সঠিক নয়', overpayment: 'পরিশোধ মোট মূল্যের বেশি হতে পারবে না', order_cancelled: 'বাতিল অর্ডারে পেমেন্ট নেওয়া যাবে না', refund_exceeds_paid: 'ফেরত পরিশোধের চেয়ে বেশি হতে পারবে না' },
    empty: { createFirstOrder: 'আপনার প্রথম অর্ডার তৈরি করুন' },
  },
  en: {
    appName: 'TailorBook BD',
    nav: { dashboard: 'Dashboard', customers: 'Customers', orders: 'Orders', measurements: 'Measurements', payments: 'Payments', reports: 'Reports', settings: 'Settings' },
    status: { pending: 'Pending', in_progress: 'In Progress', ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled' },
    errors: { quantity_invalid: 'Quantity must be at least 1', price_invalid: 'Invalid price', amount_invalid: 'Invalid amount', overpayment: 'Payment cannot exceed the order total', order_cancelled: 'Cannot take payment on a cancelled order', refund_exceeds_paid: 'Refund cannot exceed amount paid' },
    empty: { createFirstOrder: 'Create Your First Order' },
  },
} as const;
