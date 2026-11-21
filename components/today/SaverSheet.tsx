'use client'

// "What is SAVER?" bottom sheet — moved from the old Home screen; now opened
// from the Morning ritual step on Today.
export function SaverSheet({ onClose }: { onClose: () => void }) {
  return (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => onClose()}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-2xl p-6 pb-10 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-[#0f172a]">Your SAVER Routine</h3>
                <p className="text-xs text-[#94a3b8] mt-0.5">Do this every morning · Takes 45–60 mins total</p>
              </div>
              <button
                onClick={() => onClose()}
                className="text-[#94a3b8] hover:text-[#64748b] text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  letter: 'S', word: 'Silence', duration: '5–10 mins', color: '#4a7fd4',
                  steps: [
                    'Find a quiet spot — no phone, no noise',
                    'Sit comfortably and breathe slowly',
                    'Read your goals out loud or write them down',
                    'Ask yourself: What is the one thing I must do today?',
                  ],
                },
                {
                  letter: 'A', word: 'Affirmations', duration: '5 mins', color: '#00D4E8',
                  steps: [
                    'Write or speak 5–10 statements about who you are becoming',
                    'Use present tense: "I am strong. I am consistent."',
                    'Say them with conviction — feel them, don\'t just recite',
                  ],
                },
                {
                  letter: 'V', word: 'Visualisation', duration: '5 mins', color: '#a855f7',
                  steps: [
                    'Close your eyes and see your 6-month goal clearly',
                    'Then see your 1-year self — how do you look, feel, move?',
                    'See your 5-year vision — who have you become?',
                    'Finally: What is the ONE thing you will accomplish today?',
                  ],
                },
                {
                  letter: 'E', word: 'Exercise', duration: '20–60 mins', color: '#f59e0b',
                  steps: [
                    'Follow your Coach Mohit programme',
                    'Even on rest days — walk, stretch, move',
                    'Non-negotiable · Your body is your vehicle',
                  ],
                },
                {
                  letter: 'R', word: 'Reading', duration: '10+ mins', color: '#22c55e',
                  steps: [
                    'Read a book that grows your mind',
                    'Minimum 10 pages every morning',
                    'Focus on health, mindset, business or biography',
                  ],
                },
              ].map((item) => (
                <div key={item.letter} className="flex gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
                  >
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {item.letter}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-[#0f172a]">{item.word}</p>
                      <span className="text-xs text-[#94a3b8]">· {item.duration}</span>
                    </div>
                    <ul className="flex flex-col gap-1">
                      {item.steps.map((step, i) => (
                        <li key={i} className="text-xs text-[#64748b] flex items-start gap-1.5">
                          <span className="text-[#94a3b8] mt-0.5 flex-shrink-0">·</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#1a1f3a] rounded-xl p-4 text-center">
              <p className="text-xs text-white/50 leading-relaxed">
                Track how many days you completed SAVER in your{' '}
                <span className="text-[#00D4E8]">weekly check-in</span>
              </p>
            </div>
          </div>
        </div>
  )
}
