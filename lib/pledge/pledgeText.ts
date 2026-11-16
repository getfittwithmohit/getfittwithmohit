// The Unstoppable Pledge — single source of truth for the pledge wording.
// Used by the pledge page (on screen) and by the downloadable PDF.
// `pause: true` marks the last line of a stanza.

export interface PledgeLine {
  text: string
  pause: boolean
}

export const PLEDGE_OPENING =
  'pledge from today that I will become unstoppable in my health, fitness, and performance.'

export const PLEDGE_LINES: PledgeLine[] = [
  { text: 'From this day forward, I take full control of my mind, my thoughts, my body, my energy, and my life.', pause: true },
  { text: 'I will no longer treat my health as optional.', pause: false },
  { text: 'I will no longer ignore my body while chasing success.', pause: false },
  { text: 'I will no longer live in a way that makes me weak, tired, distracted, and average.', pause: true },
  { text: 'I choose strength over excuses.', pause: false },
  { text: 'I choose discipline over delay.', pause: false },
  { text: 'I choose action over overthinking.', pause: false },
  { text: 'I choose long-term greatness over short-term comfort.', pause: true },
  { text: 'I understand that real success is not only about money, titles, or status.', pause: false },
  { text: 'Real success is having the energy to perform.', pause: false },
  { text: 'Real success is having a body that supports my mission.', pause: false },
  { text: 'Real success is having a mind that stays clear under pressure.', pause: false },
  { text: 'Real success is being healthy enough to enjoy the life I am working so hard to build.', pause: true },
  { text: 'From today, I vow to remove everything that weakens me: bad habits, excuse-making, lazy thinking, negative environments, self-doubt, and the patterns that keep me stuck.', pause: true },
  { text: 'I was not born to settle for low energy, poor health, and average performance.', pause: false },
  { text: 'I was born to evolve.', pause: false },
  { text: 'I was born to lead.', pause: false },
  { text: 'I was born to inspire.', pause: true },
  { text: 'I will respect my body.', pause: false },
  { text: 'I will train my body.', pause: false },
  { text: 'I will fuel my body.', pause: false },
  { text: 'I will recover my body.', pause: false },
  { text: 'I will sharpen my mind.', pause: false },
  { text: 'I will build a lifestyle that supports high performance.', pause: true },
  { text: 'I will work hard.', pause: false },
  { text: 'I will work smart.', pause: false },
  { text: 'I will train consistently.', pause: false },
  { text: 'I will take care of my sleep.', pause: false },
  { text: 'I will improve my food choices.', pause: false },
  { text: 'I will respect my routine.', pause: false },
  { text: 'I will show up even on the days I do not feel like it.', pause: true },
  { text: 'I will stop blaming time.', pause: false },
  { text: 'I will stop blaming work.', pause: false },
  { text: 'I will stop blaming stress.', pause: false },
  { text: 'I will stop blaming circumstances.', pause: false },
  { text: 'I will take full ownership of my life.', pause: true },
  { text: 'I will become the kind of person my family can be proud of.', pause: false },
  { text: 'I will build a legacy of health, discipline, strength, and service.', pause: true },
  { text: 'I pledge to become unstoppable in my health.', pause: false },
  { text: 'I pledge to become unstoppable in my fitness.', pause: false },
  { text: 'I pledge to become unstoppable in my performance.', pause: false },
  { text: 'I pledge to become unstoppable in my life.', pause: false },
  { text: 'I start now.', pause: true },
]

// Group the lines into stanzas (a stanza ends on a `pause` line).
export function pledgeStanzas(): string[][] {
  const stanzas: string[][] = []
  let current: string[] = []
  for (const line of PLEDGE_LINES) {
    current.push(line.text)
    if (line.pause) {
      stanzas.push(current)
      current = []
    }
  }
  if (current.length) stanzas.push(current)
  return stanzas
}
