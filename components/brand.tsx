import { Activity } from 'lucide-react'

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent)] text-black shadow-[0_0_35px_rgba(202,255,74,.16)]">
        <Activity size={20} strokeWidth={2.6} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">Personal Performance OS</div>
        <div className="text-lg font-black tracking-[-0.03em]">Road to Ironman</div>
      </div>
    </div>
  )
}
