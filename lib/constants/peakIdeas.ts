// PEAK Ideas — topics, colours and copy shared by client and coach screens.

export const PEAK_TOPICS = ['Consistency', 'Identity', 'Nutrition', 'Focus', 'Sleep', 'Mindset'] as const
export type PeakTopic = (typeof PEAK_TOPICS)[number]

// Each topic owns one bright colour. Dark text (#111318) always sits on it.
export const TOPIC_COLOR: Record<PeakTopic, string> = {
  Consistency: '#FF8A65',
  Identity: '#A78BFA',
  Nutrition: '#4ADE80',
  Focus: '#60A5FA',
  Sleep: '#818CF8',
  Mindset: '#F472B6',
}

export const TOPIC_LABEL: Record<PeakTopic, string> = {
  Consistency: 'Consistency',
  Identity: 'Identity',
  Nutrition: 'Nutrition',
  Focus: 'Focus & time',
  Sleep: 'Sleep & recovery',
  Mindset: 'Mindset',
}

// The moments an idea is written for — matched against the client's daily check-ins.
export const PEAK_TRIGGERS = [
  'missed_workout',
  'low_sleep',
  'low_energy',
  'overeating',
  'needs_support',
  'comeback',
  'new_start',
] as const
export type PeakTrigger = (typeof PEAK_TRIGGERS)[number]

export const TRIGGER_LABEL: Record<PeakTrigger, string> = {
  missed_workout: 'After a missed workout',
  low_sleep: 'After poor sleep',
  low_energy: 'Low-energy days',
  overeating: 'After an off-plan eating day',
  needs_support: 'When they asked for support',
  comeback: 'Coming back after a break',
  new_start: 'First week with PEAK Ideas',
}

export const PEAK = {
  bg: '#111318',
  surface: '#1B1E25',
  surface2: '#23262E',
  text: '#F5F5F4',
  soft: '#D4D6DB',
  muted: '#A1A6B0',
  line: 'rgba(255,255,255,0.12)',
  ink: '#111318',
  cyan: '#00D4E8',
  gold: '#F5B83D',
  green: '#4ADE80',
} as const

export const MAX_EXTRA_PER_DAY = 3

export function topicColor(topic: string): string {
  return TOPIC_COLOR[topic as PeakTopic] || PEAK.cyan
}
