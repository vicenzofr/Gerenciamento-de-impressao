import type { ReactNode } from 'react'

const DOT_COLOR = {
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-400',
} as const

interface QueueColumnProps {
  title: string
  count: number
  dot: keyof typeof DOT_COLOR
  children: ReactNode
}

export function QueueColumn({ title, count, dot, children }: QueueColumnProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT_COLOR[dot]}`} />
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-800 px-1.5 text-[11px] font-medium text-zinc-300">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
