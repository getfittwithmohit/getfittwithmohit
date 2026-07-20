'use client'

import { useState } from 'react'

type MeasurementType = 'waist' | 'chest' | 'hip' | 'weight'

interface MeasurementGuideProps {
  type: MeasurementType
}

const GUIDES: Record<MeasurementType, { title: string; instructions: string[] }> = {
  waist: {
    title: 'How to measure your waist',
    instructions: [
      'Stand relaxed, don\'t suck in your stomach',
      'Find the narrowest point of your torso — usually just above your belly button',
      'Wrap the tape around, keeping it level all the way around',
      'Measure after breathing out normally, not holding your breath',
    ],
  },
  chest: {
    title: 'How to measure your chest',
    instructions: [
      'Stand straight with arms relaxed at your sides',
      'Wrap the tape around the fullest part of your chest',
      'Keep the tape level — it should sit at the same height in front and back',
      'Measure with the tape snug but not compressing your chest',
    ],
  },
  hip: {
    title: 'How to measure your hips',
    instructions: [
      'Stand with your feet together',
      'Find the widest point around your hips and buttocks',
      'Wrap the tape around, keeping it level all the way around',
      'Keep the tape snug but not pulled tight',
    ],
  },
  weight: {
    title: 'How to weigh yourself accurately',
    instructions: [
      'Weigh first thing in the morning, after using the bathroom',
      'Weigh before eating or drinking anything',
      'Use the same scale, on the same flat surface, every time',
      'Wear similar (minimal) clothing each time for consistency',
    ],
  },
}

function WaistIllustration() {
  return (
    <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto">
      {/* Simple body silhouette */}
      <ellipse cx="60" cy="22" rx="14" ry="16" fill="#e2e8f0" />
      <path
        d="M40 40 Q35 60 38 78 L40 95 Q42 105 60 108 Q78 105 80 95 L82 78 Q85 60 80 40 Q60 32 40 40 Z"
        fill="#e2e8f0"
      />
      <path d="M38 78 Q35 95 36 130 L44 130 L46 95" fill="#e2e8f0" />
      <path d="M82 78 Q85 95 84 130 L76 130 L74 95" fill="#e2e8f0" />
      {/* Tape line at waist — narrowest point */}
      <ellipse cx="60" cy="80" rx="24" ry="4" fill="none" stroke="#00d4d4" strokeWidth="2.5" strokeDasharray="4 3" />
      <text x="60" y="146" textAnchor="middle" fontSize="9" fill="#4a7fd4" fontWeight="600">narrowest point</text>
    </svg>
  )
}

function ChestIllustration() {
  return (
    <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto">
      <ellipse cx="60" cy="22" rx="14" ry="16" fill="#e2e8f0" />
      <path
        d="M38 40 Q33 55 37 70 L40 95 Q42 105 60 108 Q78 105 80 95 L83 70 Q87 55 82 40 Q60 32 38 40 Z"
        fill="#e2e8f0"
      />
      <path d="M37 70 Q33 90 35 130 L43 130 L46 95" fill="#e2e8f0" />
      <path d="M83 70 Q87 90 85 130 L77 130 L74 95" fill="#e2e8f0" />
      {/* Tape line at chest — fullest part, upper torso */}
      <ellipse cx="60" cy="58" rx="27" ry="4" fill="none" stroke="#00d4d4" strokeWidth="2.5" strokeDasharray="4 3" />
      <text x="60" y="146" textAnchor="middle" fontSize="9" fill="#4a7fd4" fontWeight="600">fullest part</text>
    </svg>
  )
}

function HipIllustration() {
  return (
    <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto">
      <ellipse cx="60" cy="22" rx="14" ry="16" fill="#e2e8f0" />
      <path
        d="M40 40 Q35 60 38 78 L42 100 Q44 110 60 113 Q76 110 78 100 L82 78 Q85 60 80 40 Q60 32 40 40 Z"
        fill="#e2e8f0"
      />
      <path d="M42 100 Q38 110 36 130 L44 130 L48 105" fill="#e2e8f0" />
      <path d="M78 100 Q82 110 84 130 L76 130 L72 105" fill="#e2e8f0" />
      {/* Tape line at hip — widest point, lower torso */}
      <ellipse cx="60" cy="102" rx="27" ry="4" fill="none" stroke="#00d4d4" strokeWidth="2.5" strokeDasharray="4 3" />
      <text x="60" y="146" textAnchor="middle" fontSize="9" fill="#4a7fd4" fontWeight="600">widest point</text>
    </svg>
  )
}

function WeightIllustration() {
  return (
    <svg viewBox="0 0 120 160" className="w-20 h-28 mx-auto">
      {/* Simple scale illustration */}
      <rect x="25" y="120" width="70" height="14" rx="4" fill="#e2e8f0" />
      <rect x="35" y="100" width="50" height="22" rx="3" fill="#1a1f3a" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="#00d4d4" fontWeight="700">0.0</text>
      {/* Sun rising — morning symbol */}
      <circle cx="60" cy="55" r="14" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
      <line x1="60" y1="32" x2="60" y2="38" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="55" x2="46" y2="55" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="55" x2="80" y2="55" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="45" y1="40" x2="49" y2="44" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="75" y1="40" x2="71" y2="44" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <text x="60" y="146" textAnchor="middle" fontSize="9" fill="#4a7fd4" fontWeight="600">first thing, morning</text>
    </svg>
  )
}

const ILLUSTRATIONS: Record<MeasurementType, () => React.JSX.Element> = {
  waist: WaistIllustration,
  chest: ChestIllustration,
  hip: HipIllustration,
  weight: WeightIllustration,
}

export function MeasurementGuide({ type }: MeasurementGuideProps) {
  const [open, setOpen] = useState(false)
  const guide = GUIDES[type]
  const Illustration = ILLUSTRATIONS[type]

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-[#4a7fd4] hover:text-[#3a6fc4] transition-colors"
      >
        <span className="w-3.5 h-3.5 rounded-full bg-[#4a7fd4]/15 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
          i
        </span>
        How to measure
      </button>

      {open && (
        <div className="mt-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex gap-4 items-start">
          <Illustration />
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#0f172a] mb-2">{guide.title}</p>
            <ul className="flex flex-col gap-1.5">
              {guide.instructions.map((line, i) => (
                <li key={i} className="text-xs text-[#64748b] flex items-start gap-1.5">
                  <span className="text-[#4a7fd4] mt-0.5 flex-shrink-0">·</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}