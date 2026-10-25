import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Road to Ironman',
  description: 'Prototype of a modern training companion.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
