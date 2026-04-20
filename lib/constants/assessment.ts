export type Environment = 'gym' | 'home' | 'hotel' | 'outdoor'
export type Parameter = 'Endurance' | 'Strength' | 'Flexibility' | 'Mobility'
export type EffortLevel = 'Easy' | 'Moderate' | 'Hard'

export interface TestField {
  label: string
  placeholder: string
  unit: string
}

export interface AssessmentTest {
  id: string
  parameter: Parameter
  name: string
  instructions: string[]
  tip: string
  fields: TestField[]
}

export interface EnvironmentProtocol {
  label: string
  emoji: string
  description: string
  tests: AssessmentTest[]
}

export const ASSESSMENT_PROTOCOLS: Record<Environment, EnvironmentProtocol> = {
  gym: {
    label: 'Gym',
    emoji: '🏋️',
    description: 'Full equipment available',
    tests: [
      {
        id: 'gym_endurance',
        parameter: 'Endurance',
        name: '1-Mile Treadmill Run',
        instructions: [
          'Set treadmill to a comfortable pace — not a sprint',
          'Run exactly 1 mile (1.6km) at a consistent pace',
          'Record your total time when you finish',
          'Note your effort level honestly',
        ],
        tip: 'Don\'t go too fast early — pace yourself evenly.',
        fields: [
          { label: 'Time — minutes', placeholder: 'e.g. 9', unit: 'mins' },
          { label: 'Time — seconds', placeholder: 'e.g. 45', unit: 'secs' },
        ],
      },
      {
        id: 'gym_strength',
        parameter: 'Strength',
        name: 'Push-Up Max (1 Set)',
        instructions: [
          'Start in a full push-up position — hands shoulder-width apart',
          'Lower chest to ground, push back up — that\'s 1 rep',
          'Do as many as you can without stopping',
          'Stop when form breaks — no cheating',
        ],
        tip: 'Full range of motion only. Half reps don\'t count.',
        fields: [
          { label: 'Total reps completed', placeholder: 'e.g. 22', unit: 'reps' },
        ],
      },
      {
        id: 'gym_flexibility',
        parameter: 'Flexibility',
        name: 'Seated Forward Fold',
        instructions: [
          'Sit on the floor, legs straight out in front',
          'Place a ruler at your feet with zero at your toes',
          'Reach forward as far as you can with both hands — hold 3 seconds',
          'Measure how far your fingertips reach past or before your toes',
        ],
        tip: 'Use + if past toes, − if short of toes.',
        fields: [
          { label: 'Distance from toes (+ past / − short)', placeholder: 'e.g. +3 or -2', unit: 'inches' },
        ],
      },
      {
        id: 'gym_mobility',
        parameter: 'Mobility',
        name: 'Deep Squat Hold',
        instructions: [
          'Stand with feet shoulder-width apart, toes slightly out',
          'Squat down as low as you can, keeping heels on the floor',
          'Hold at the bottom — arms between knees if needed for balance',
          'Time how long you can hold the position comfortably',
        ],
        tip: 'Heels must stay flat. Holding a door frame doesn\'t count.',
        fields: [
          { label: 'Hold time', placeholder: 'e.g. 45', unit: 'seconds' },
        ],
      },
    ],
  },

  home: {
    label: 'Home',
    emoji: '🏠',
    description: 'Bodyweight only',
    tests: [
      {
        id: 'home_endurance',
        parameter: 'Endurance',
        name: 'Step-Up Test (3 Minutes)',
        instructions: [
          'Find a step or sturdy box 30–40cm high',
          'Step up and down at a steady rhythm — 24 steps per minute',
          'Do this for exactly 3 minutes',
          'Sit down immediately when done and count your pulse for 60 seconds',
        ],
        tip: 'Lower heart rate after rest = better cardiovascular fitness.',
        fields: [
          { label: 'Heart rate after 1 min rest', placeholder: 'e.g. 98', unit: 'bpm' },
        ],
      },
      {
        id: 'home_strength',
        parameter: 'Strength',
        name: 'Push-Up Max (1 Set)',
        instructions: [
          'Start in a full push-up position — hands shoulder-width apart',
          'Lower chest to ground, push back up — that\'s 1 rep',
          'Do as many as you can without stopping',
          'Stop when form breaks',
        ],
        tip: 'Full range of motion only.',
        fields: [
          { label: 'Total reps completed', placeholder: 'e.g. 18', unit: 'reps' },
        ],
      },
      {
        id: 'home_flexibility',
        parameter: 'Flexibility',
        name: 'Seated Forward Fold',
        instructions: [
          'Sit on the floor, legs straight out',
          'Place a ruler at your feet with zero at your toes',
          'Reach forward as far as possible — hold 3 seconds',
          'Measure distance from fingertips to toes',
        ],
        tip: 'Use + if past toes, − if short of toes.',
        fields: [
          { label: 'Distance from toes (+ past / − short)', placeholder: 'e.g. +2 or -3', unit: 'inches' },
        ],
      },
      {
        id: 'home_mobility',
        parameter: 'Mobility',
        name: 'Deep Squat Hold',
        instructions: [
          'Feet shoulder-width apart, toes slightly out',
          'Squat as low as possible, heels flat on floor',
          'Hold at the bottom',
          'Time how long you hold comfortably',
        ],
        tip: 'Heels must stay flat throughout.',
        fields: [
          { label: 'Hold time', placeholder: 'e.g. 38', unit: 'seconds' },
        ],
      },
    ],
  },

  hotel: {
    label: 'Hotel / Travel',
    emoji: '🏨',
    description: 'Minimal space, no equipment',
    tests: [
      {
        id: 'hotel_endurance',
        parameter: 'Endurance',
        name: 'Jumping Jack Test (2 Minutes)',
        instructions: [
          'Stand with feet together, arms at sides',
          'Jump — spread legs shoulder-width and raise arms overhead',
          'Jump back to start — that\'s 1 rep',
          'Count how many you complete in exactly 2 minutes',
        ],
        tip: 'Keep a steady rhythm. Don\'t race — maintain form throughout.',
        fields: [
          { label: 'Total jumping jacks in 2 minutes', placeholder: 'e.g. 80', unit: 'reps' },
        ],
      },
      {
        id: 'hotel_strength',
        parameter: 'Strength',
        name: 'Push-Up Max (1 Set)',
        instructions: [
          'Start in a full push-up position',
          'Lower chest to ground, push back up — 1 rep',
          'Max reps without stopping, maintaining form',
        ],
        tip: 'Full range of motion only.',
        fields: [
          { label: 'Total reps completed', placeholder: 'e.g. 15', unit: 'reps' },
        ],
      },
      {
        id: 'hotel_flexibility',
        parameter: 'Flexibility',
        name: 'Standing Toe Touch',
        instructions: [
          'Stand straight, feet together',
          'Slowly reach down toward the floor, knees straight',
          'Hold for 3 seconds at your lowest point',
          'Measure the gap from fingertips to floor',
        ],
        tip: '0 = fingertips touching floor. Higher number = less flexible.',
        fields: [
          { label: 'Gap from fingertips to floor', placeholder: 'e.g. 4', unit: 'inches' },
        ],
      },
      {
        id: 'hotel_mobility',
        parameter: 'Mobility',
        name: 'Wall Ankle Mobility Test',
        instructions: [
          'Stand facing a wall, toes touching it',
          'Try to touch your knee to the wall while keeping heel flat',
          'If you can, move foot back 1cm at a time until you can\'t',
          'Measure the distance from toe to wall at your limit',
        ],
        tip: 'Greater distance = better ankle mobility.',
        fields: [
          { label: 'Distance from toe to wall at limit', placeholder: 'e.g. 4.5', unit: 'inches' },
        ],
      },
    ],
  },

  outdoor: {
    label: 'Outdoor',
    emoji: '🌳',
    description: 'Park, open space or track',
    tests: [
      {
        id: 'outdoor_endurance',
        parameter: 'Endurance',
        name: '12-Minute Cooper Run',
        instructions: [
          'Set a timer for 12 minutes',
          'Run as far as you can in 12 minutes at a steady pace — not a sprint',
          'When timer stops, measure or estimate the distance covered',
          'Use Google Maps to estimate your route distance if no track',
        ],
        tip: 'Higher distance = better aerobic fitness. Pace yourself — don\'t start too fast.',
        fields: [
          { label: 'Distance covered in 12 minutes', placeholder: 'e.g. 1800', unit: 'metres' },
        ],
      },
      {
        id: 'outdoor_strength',
        parameter: 'Strength',
        name: 'Push-Up Max (1 Set)',
        instructions: [
          'Full push-up position on grass or ground',
          'Lower chest to ground, push back up — 1 rep',
          'Max reps, full form, no stopping',
        ],
        tip: 'Full range of motion only.',
        fields: [
          { label: 'Total reps completed', placeholder: 'e.g. 20', unit: 'reps' },
        ],
      },
      {
        id: 'outdoor_flexibility',
        parameter: 'Flexibility',
        name: 'Seated Forward Fold',
        instructions: [
          'Sit on flat ground, legs straight',
          'Reach forward as far as possible — hold 3 seconds',
          'Measure distance from fingertips to toes',
        ],
        tip: 'Use + if past toes, − if short of toes.',
        fields: [
          { label: 'Distance from toes (+ past / − short)', placeholder: 'e.g. +1 or -4', unit: 'inches' },
        ],
      },
      {
        id: 'outdoor_mobility',
        parameter: 'Mobility',
        name: 'Deep Squat Hold',
        instructions: [
          'Feet shoulder-width apart, toes slightly out',
          'Squat as low as possible, heels flat',
          'Hold at the bottom — time yourself',
        ],
        tip: 'Heels must stay flat throughout.',
        fields: [
          { label: 'Hold time', placeholder: 'e.g. 52', unit: 'seconds' },
        ],
      },
    ],
  },
}

export const PARAMETER_COLORS: Record<Parameter, string> = {
  Endurance: '#4a7fd4',
  Strength: '#ef4444',
  Flexibility: '#22c55e',
  Mobility: '#a855f7',
}

export const EFFORT_OPTIONS: EffortLevel[] = ['Easy', 'Moderate', 'Hard']