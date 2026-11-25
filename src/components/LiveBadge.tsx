export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-orange-400 ${className}`}
    >
      <span className="h-1.5 w-1.5 animate-live-dot rounded-full bg-orange-400" />
      AO VIVO
    </span>
  )
}
