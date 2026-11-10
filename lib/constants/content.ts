export const AUDIO_CATEGORIES = [
  { value: 'Audiobook', label: 'Audiobooks', emoji: '📚' },
  { value: 'Mindset Talk', label: 'Mindset Talks', emoji: '🧠' },
  { value: 'Meditation', label: 'Meditations', emoji: '🧘' },
  { value: 'Visualisation', label: 'Visualisations', emoji: '🎯' },
] as const

export type AudioCategory = (typeof AUDIO_CATEGORIES)[number]['value']

export const STORAGE_BUCKETS = {
  courseDocs: 'course-docs',
  audioLibrary: 'audio-library',
} as const

// Signed links for private files stay valid this long. Audio needs to outlast
// a full listening session of a long audiobook chapter.
export const SIGNED_URL_SECONDS = {
  document: 60 * 10,
  audio: 60 * 60 * 6,
} as const

// Supabase rejects uploads above the project's file size limit (50 MB on the
// free plan). Checked before uploading so the coach gets a clear message.
export const MAX_UPLOAD_MB = 50
