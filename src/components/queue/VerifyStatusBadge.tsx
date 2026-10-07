import type { VerifyStatus } from '@/types'

const STYLES: Record<VerifyStatus, string> = {
  INSPECAO_PENDENTE: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  RETIRADA_PRONTA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
}

const LABELS: Record<VerifyStatus, string> = {
  INSPECAO_PENDENTE: 'Inspeção Pendente',
  RETIRADA_PRONTA: 'Retirada Pronta',
}

export function VerifyStatusBadge({ status }: { status: VerifyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
