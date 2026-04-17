'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('otp')
        setMessage('Código enviado! Verifique seu e-mail.')
      } else {
        setError(data.error || 'Erro ao enviar código')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(data.redirect || '/dashboard')
      } else {
        setError(data.error || 'Código inválido')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ninma-teal-light via-white to-ninma-purple-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4">
            <img src="/logo-ninma.svg" alt="NinMaHub" className="w-16 h-auto" />
          </div>
          <h1 className="text-2xl font-bold text-ninma-dark">NinMaHub</h1>
          <p className="text-sm text-gray-500 mt-1">PPGSMI – Sistema de Templates</p>
          <p className="text-xs text-gray-400 mt-0.5">Universidade Franciscana</p>
        </div>

        <div className="card shadow-xl border-0">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-ninma-dark">Entrar no sistema</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Informe seu e-mail institucional para receber o código de acesso.
                </p>
              </div>

              {error && (
                <div className="bg-ninma-pink-light border border-ninma-pink text-ninma-pink-dark rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">E-mail institucional</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu.email@ufn.edu.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Enviando...
                  </span>
                ) : 'Enviar código de acesso'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); setOtp('') }}
                  className="text-ninma-teal text-sm hover:underline flex items-center gap-1 mb-3"
                >
                  ← Voltar
                </button>
                <h2 className="text-lg font-semibold text-ninma-dark">Insira o código</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enviamos um código de 6 dígitos para <strong>{email}</strong>
                </p>
              </div>

              {message && (
                <div className="bg-ninma-teal-light border border-ninma-teal text-ninma-teal-dark rounded-xl p-3 text-sm">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-ninma-pink-light border border-ninma-pink text-ninma-pink-dark rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Código de 6 dígitos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="input text-center text-3xl font-bold tracking-widest h-16"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={loading || otp.length !== 6}>
                {loading ? 'Verificando...' : 'Acessar sistema'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Não recebeu?{' '}
                <button
                  type="button"
                  className="text-ninma-teal hover:underline"
                  onClick={() => { setStep('email'); setMessage(''); setError('') }}
                >
                  Tentar novamente
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Programa de Pós-Graduação em Saúde Materno Infantil
        </p>
      </div>
    </div>
  )
}
