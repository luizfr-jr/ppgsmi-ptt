'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl bg-ninma-teal-light flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-ninma-teal" />
          </div>
          <div>
            <p className="font-semibold text-ninma-dark text-sm">Instalar no dispositivo</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Adicione o PPGSMI à sua tela inicial para acesso rápido, mesmo sem internet.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} className="btn-primary py-1.5 px-3 text-xs">
                Instalar
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
