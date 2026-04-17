import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PPGSMI – Sistema de Templates | NinMaHub',
  description: 'Sistema de preenchimento de Produto Técnico-Tecnológico do Programa de Pós-Graduação em Saúde Materno Infantil – Universidade Franciscana',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PPGSMI',
  },
}

export const viewport: Viewport = {
  themeColor: '#5fc3ad',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
