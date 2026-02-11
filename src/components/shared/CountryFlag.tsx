interface CountryFlagProps {
  country: string
  className?: string
}

export function CountryFlag({ country, className = "" }: CountryFlagProps) {
  // Use a simple text-based approach with country codes
  return (
    <div className={`flex items-center justify-center w-8 h-8 rounded-sm bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 ${className}`}>
      {country}
    </div>
  )
}
