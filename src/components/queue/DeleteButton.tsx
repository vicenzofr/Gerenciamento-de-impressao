import { useState } from 'react'
import { TrashIcon } from '@/components/icons'
import { ConfirmDialog } from './ConfirmDialog'

interface DeleteButtonProps {
  onClick: () => void
  label: string
  itemName: string
}

export function DeleteButton({ onClick, label, itemName }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={label}
        title={label}
        className="absolute top-2.5 right-2.5 rounded-md p-1 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>

      <ConfirmDialog
        open={confirming}
        title="Remover item"
        message={`Tem certeza que deseja remover "${itemName}"? Essa ação não pode ser desfeita.`}
        onConfirm={() => {
          onClick()
          setConfirming(false)
        }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
