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
    <div className="flex justify-between items-center pt-2">
      {onBack ? (
        <Button variant="back" onClick={onBack}>
          ← Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        variant="primary"
        onClick={onNext}
        loading={loading}
      >
        {nextLabel}
      </Button>
    </div>
  )
}