import { InfoIcon } from '@/components/icons'
import { TimelineGrid } from './TimelineGrid'
import type { PrinterTimeline } from '@/types'

export function Timeline({ printers }: { printers: PrinterTimeline[] }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Linha do Tempo de Horas</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Ocupação estimada de maquinário e alocações de horários diários
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm">
        <InfoIcon className="h-4 w-4 shrink-0 text-blue-400" />
        <p className="text-zinc-300">
          <span className="font-medium">Regra Inteligente:</span>{' '}
          <span className="text-blue-400">
            Impressões acima de 6h são direcionadas automaticamente para a CR-10 Max
          </span>{' '}
          (maior estabilidade mecânica).
        </p>
      </div>

      <TimelineGrid printers={printers} />
    </section>
  )
}
