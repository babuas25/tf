import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-xl border-0 ring-0 outline outline-1 outline-[hsl(var(--primary))] bg-[hsla(var(--primary)/0.16)] p-6 transition-all duration-300 text-foreground dark:text-white shadow-none">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-semibold text-foreground dark:text-white">{title}</h3>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground dark:text-white">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground dark:text-white/80">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={`text-xs ${trend.isPositive ? 'text-green-600 dark:text-emerald-400' : 'text-red-600 dark:text-rose-400'}`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground dark:text-white/70 ml-1">
              from last month
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
