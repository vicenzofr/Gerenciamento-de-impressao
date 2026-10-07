import { CubeIcon } from '@/components/icons'

interface HeaderProps {
  printersOnline: number
}

export function Header({ printersOnline }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
          <CubeIcon className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold text-white">PrintQueue</span>
        <span className="text-lg font-semibold text-orange-500">3D</span>
      </div>

      <nav className="flex items-center gap-8">
        <span className="relative pb-1 text-sm font-medium text-orange-500">
          Filas de Impressão
          <span className="absolute -bottom-[17px] left-0 h-0.5 w-full bg-orange-500" />
        </span>
      </nav>

      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {printersOnline} Impressoras Online
      </div>
    </header>
  )
}
