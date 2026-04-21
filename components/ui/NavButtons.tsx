import { Button } from './Button'

interface NavButtonsProps {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  loading?: boolean
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue →',
  loading = false,
}: NavButtonsProps) {
  return (
    <div className="flex justify-between items-center pt-4 mt-2 border-t border-[#e2e8f0]">
      {onBack ? (
        <Button
          variant="back"
          type="button"
          onClick={onBack}
          disabled={loading}
        >
          ← Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        variant="primary"
        type="button"
        onClick={onNext}
        loading={loading}
      >
        {nextLabel}
      </Button>
    </div>
  )
}