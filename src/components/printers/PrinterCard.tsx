import { PrinterIcon } from '@/components/icons'
import type { Printer } from '@/types'

export function PrinterCard({ printer }: { printer: Printer }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
          <PrinterIcon className="h-4 w-4" />
        </span>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${
            printer.online ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${printer.online ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          {printer.online ? 'Online' : 'Offline'}
        </span>
      </div>
      <p className="mt-3 truncate text-sm font-medium text-zinc-100">{printer.name}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{printer.spec}</p>
    </div>
  )
}
