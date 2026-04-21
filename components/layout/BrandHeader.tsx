interface BrandHeaderProps {
  subtitle?: string
  title?: string
  description?: string
}

export function BrandHeader({
  subtitle = 'Transform to Inspire',
  title,
  description,
}: BrandHeaderProps) {
  return (
    <div className="bg-[#1a1f3a] text-center py-8 px-4 relative">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/logo.png"
          alt="GetFittWithMohit"
          className="w-20 h-20 object-contain"
        />
        {title && (
          <h2 className="text-white text-xl font-medium">{title}</h2>
        )}
        {description && (
          <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}