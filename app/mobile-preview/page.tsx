import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Road to Ironman · Mobile preview',
}

export default function MobilePreviewPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#05070a] px-3 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-5xl flex-col items-center justify-center gap-3">
        <div className="flex w-full max-w-[390px] items-center justify-between px-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-lime-300">Road to Ironman</p>
            <h1 className="mt-1 text-sm font-semibold text-zinc-200">Aperçu mobile permanent</h1>
          </div>
          <Link href="/" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white">Vue normale</Link>
        </div>
        <div
          className="relative overflow-hidden rounded-[2.75rem] border border-white/20 bg-black p-[7px] shadow-[0_25px_100px_rgba(0,0,0,.65)]"
          style={{
            width: 'min(390px, calc(100vw - 32px), calc((100dvh - 104px) * .462))',
            height: 'min(844px, calc(100dvh - 104px))',
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-[11px] z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
          <iframe
            title="Road to Ironman — aperçu sur téléphone"
            src="/"
            className="block h-full w-full rounded-[2.25rem] border-0 bg-black"
          />
        </div>
        <p className="text-center text-[10px] text-zinc-600">390 × 844 · l’app reste interactive et conserve ses données locales.</p>
      </div>
    </main>
  )
}
