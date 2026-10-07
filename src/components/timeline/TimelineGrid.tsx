import { TimelineJobBlock, HOUR_WIDTH } from './TimelineJobBlock'
import type { PrinterTimeline } from '@/types'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const LABEL_WIDTH = 160

export function TimelineGrid({ printers }: { printers: PrinterTimeline[] }) {
  const gridWidth = HOURS.length * HOUR_WIDTH

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div style={{ width: LABEL_WIDTH + gridWidth }}>
        {/* Hours header */}
        <div className="flex border-b border-zinc-800">
          <div
            className="sticky left-0 z-20 shrink-0 bg-zinc-900"
            style={{ width: LABEL_WIDTH }}
          />
          {HOURS.map((h) => (
            <div
              key={h}
              className="shrink-0 border-l border-zinc-800/60 py-2 text-center text-[11px] text-zinc-500"
              style={{ width: HOUR_WIDTH }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Printer rows */}
        {printers.map((printer) => (
          <div key={printer.id} className="flex border-b border-zinc-800 last:border-b-0">
            <div
              className="sticky left-0 z-20 shrink-0 border-r border-zinc-800 bg-zinc-900 px-3 py-4"
              style={{ width: LABEL_WIDTH }}
            >
              <p className="text-sm font-medium text-zinc-200">{printer.name}</p>
              <p className="text-xs text-zinc-500">{printer.spec}</p>
            </div>

            <div className="relative" style={{ width: gridWidth, height: 76 }}>
              <div className="pointer-events-none absolute inset-0 flex">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="shrink-0 border-l border-zinc-800/40 first:border-l-0"
                    style={{ width: HOUR_WIDTH }}
                  />
                ))}
              </div>

              {printer.blocks.map((block) => (
                <TimelineJobBlock key={block.id} block={block} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
