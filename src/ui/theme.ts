/** Central design tokens. Every screen and component reads from here. */
export const colors = {
  primary: '#075B49', primaryDark: '#05463A', secondary: '#109B78', accent: '#F5A623',
  background: '#F8F7F0', cream: '#F8F7F0', surface: '#FFFFFF', card: '#FFFFFF',
  ink: '#1F2937', muted: '#64748B', line: '#E5E7EB',
  danger: '#DC2626', success: '#15803D', warn: '#B45309', gold: '#F5A623',
  tint: '#E6F2EE', okBg: '#E6F2EE', blue: '#2563EB', purple: '#7C3AED',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const fonts = { title: 22, heading: 17, body: 15, small: 13, tiny: 11 } as const;

export const elevation = {
  card: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  fab: { shadowColor: '#05463A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sheet: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 },
} as const;

/** Status colors always come with a text label - color is never the only signal. */
export const statusColors: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },       // amber
  in_progress: { bg: '#DBEAFE', fg: '#1D4ED8' },   // blue
  ready: { bg: '#DCFCE7', fg: '#15803D' },         // green
  delivered: { bg: '#CCFBF1', fg: '#0F766E' },     // teal
  cancelled: { bg: '#F1F5F9', fg: '#B91C1C' },     // neutral/red text
};
