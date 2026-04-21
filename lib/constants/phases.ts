export const PHASES = {
  Onboarding: {
    label: 'Onboarding',
    emoji: '📋',
    weeks: '0',
    description: 'Getting started',
    color: '#f59e0b',
    retentionRiskWeeks: [],
  },
  Adaptation: {
    label: 'Adaptation',
    emoji: '🌱',
    weeks: '1–4',
    description: 'Habit formation',
    color: '#4a7fd4',
    retentionRiskWeeks: [3],
  },
  Building: {
    label: 'Building',
    emoji: '💪',
    weeks: '5–12',
    description: 'Progressive overload',
    color: '#00d4d4',
    retentionRiskWeeks: [7],
  },
  Performance: {
    label: 'Performance',
    emoji: '🔥',
    weeks: '13–20',
    description: 'Peak results',
    color: '#22c55e',
    retentionRiskWeeks: [],
  },
  Maintenance: {
    label: 'Maintenance',
    emoji: '🏆',
    weeks: '21+',
    description: 'Lifestyle integration',
    color: '#a855f7',
    retentionRiskWeeks: [],
  },
} as const

export type Phase = keyof typeof PHASES