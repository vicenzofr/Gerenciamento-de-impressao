import { CheckCircleIcon, PlusIcon } from '@/components/icons'

export interface PrintCompleteNotification {
  id: string
  printerName: string
  fileName: string
}

interface NotificationStackProps {
  notifications: PrintCompleteNotification[]
  onDismiss: (id: string) => void
  onNewPrint: (printerName: string) => void
}

export function NotificationStack({ notifications, onDismiss, onNewPrint }: NotificationStackProps) {
  if (notifications.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(380px,calc(100vw-2rem))] flex-col-reverse gap-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          role="status"
          className="animate-toast-in pointer-events-auto rounded-xl border border-emerald-500/30 bg-zinc-900 p-4 shadow-2xl shadow-black/60"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Impressão concluída</p>
              <p className="mt-0.5 text-sm text-zinc-400">
                <span className="font-medium text-zinc-200">{n.printerName}</span> terminou de
                imprimir <span className="font-medium text-zinc-200">{n.fileName}</span>
              </p>
              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onDismiss(n.id)
                    onNewPrint(n.printerName)
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Nova Impressão
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(n.id)}
                  className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Dispensar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
