import { useState } from 'react'
import { CubeIcon } from '@/components/icons'

const TABS = ['Filas de Impressão', 'Cronograma / Horas'] as const

interface HeaderProps {
  printersOnline: number
}

export function Header({ printersOnline }: HeaderProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0])

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
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative pb-1 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute -bottom-[17px] left-0 h-0.5 w-full bg-orange-500" />
            )}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {printersOnline} Impressoras Online
      </div>
    </header>
  )
}
