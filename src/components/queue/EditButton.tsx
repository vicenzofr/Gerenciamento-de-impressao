import { PencilIcon } from '@/components/icons'

export function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute top-2.5 right-9 rounded-md p-1 text-zinc-600 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
    >
      <PencilIcon className="h-3.5 w-3.5" />
    </button>
  )
}
