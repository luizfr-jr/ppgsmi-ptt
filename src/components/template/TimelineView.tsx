'use client'

import { TemplateEvent } from '@/types'
import { FileEdit, Send, UserCheck, Building2, Printer, RotateCcw, CheckCircle2 } from 'lucide-react'

/**
 * Visual timeline of the template's journey through the approval workflow.
 *
 * Design:
 *   Step 1 → Rascunho     → Step 2 → Envio ao orientador → Step 3 → Orientador aprova →
 *   Step 4 → Coordenação aprova → Step 5 → Aprovado para impressão
 *
 * If a REVISAO event occurred we render a side marker under the relevant step
 * so the user can see the round-trip without losing the main flow.
 *
 * The ordering is inferred from TemplateEvent rows (source of truth) plus the
 * current template status (for the "future" greyed-out steps).
 */

interface TimelineViewProps {
  currentStatus: string
  events?: TemplateEvent[]
  className?: string
}

type StepKey = 'RASCUNHO' | 'ENVIADO' | 'AGUARDANDO_COORDENACAO' | 'APROVADO'

const STEPS: { key: StepKey; label: string; sub: string; Icon: typeof FileEdit }[] = [
  { key: 'RASCUNHO',                label: 'Rascunho',        sub: 'Aluno preenchendo',        Icon: FileEdit },
  { key: 'ENVIADO',                 label: 'Em revisão',      sub: 'Orientador avaliando',     Icon: Send },
  { key: 'AGUARDANDO_COORDENACAO',  label: 'Coordenação',     sub: 'Avaliação final',          Icon: Building2 },
  { key: 'APROVADO',                label: 'Aprovado',        sub: 'Liberado para impressão',  Icon: Printer },
]

// Given the current status, which step index is the active one?
function activeIndexFor(status: string): number {
  switch (status) {
    case 'RASCUNHO':                return 0
    case 'ENVIADO':                 return 1
    case 'AGUARDANDO_COORDENACAO':  return 2
    case 'APROVADO':                return 3
    case 'REVISAO':                 return 0 // bounces back to aluno
    default:                        return 0
  }
}

function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} · ${hh}:${mi}`
}

export function TimelineView({ currentStatus, events = [], className = '' }: TimelineViewProps) {
  const activeIdx = activeIndexFor(currentStatus)
  const isRevisao = currentStatus === 'REVISAO'

  // Find the most recent event that transitioned INTO each step — gives the
  // timestamp shown under the marker when that step has been reached.
  const lastEventTo = (toStatus: string) => {
    const evs = events.filter(e => e.toStatus === toStatus)
    return evs.length > 0 ? evs[evs.length - 1] : null
  }

  // Did any REVISAO event happen? If so, render a marker below step 1.
  const revisionEvents = events.filter(e => e.toStatus === 'REVISAO')
  const hasRevisionHistory = revisionEvents.length > 0

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-ninma-purple">Linha do tempo</h3>
          <p className="text-xs text-gray-500 mt-0.5">Acompanhamento do fluxo de aprovação</p>
        </div>
        {isRevisao && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-ninma-orange-light text-ninma-orange-dark px-3 py-1 rounded-full">
            <RotateCcw size={12} />
            Em revisão pelo aluno
          </span>
        )}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Connecting track */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-ninma-teal via-ninma-purple to-green-500 transition-all duration-500"
            style={{ width: `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {STEPS.map((step, i) => {
              const reached = i <= activeIdx
              const isCurrent = i === activeIdx && !isRevisao
              const ev = lastEventTo(step.key)
              const Icon = step.Icon
              return (
                <div key={step.key} className="flex flex-col items-center flex-1" style={{ maxWidth: '22%' }}>
                  <div
                    className={[
                      'w-11 h-11 rounded-full flex items-center justify-center border-[3px] transition-all z-10',
                      reached
                        ? 'bg-white border-ninma-purple text-ninma-purple shadow-md'
                        : 'bg-gray-50 border-gray-200 text-gray-300',
                      isCurrent && 'ring-4 ring-ninma-purple/20',
                    ].filter(Boolean).join(' ')}
                  >
                    {reached && i < activeIdx ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`text-xs font-semibold ${reached ? 'text-ninma-dark' : 'text-gray-400'}`}>
                      {step.label}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${reached ? 'text-gray-500' : 'text-gray-300'}`}>
                      {step.sub}
                    </div>
                    {ev && (
                      <div className="text-[10px] mt-1 text-ninma-purple font-medium">
                        {fmtDate(ev.createdAt)}
                      </div>
                    )}
                    {ev?.actorName && (
                      <div className="text-[10px] text-gray-400 truncate max-w-[120px] mx-auto">
                        {ev.actorName}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Revisão detour marker */}
          {hasRevisionHistory && (
            <div className="mt-8 pt-4 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-xs text-ninma-orange-dark">
                <RotateCcw size={14} />
                <span className="font-semibold">Histórico de revisões solicitadas:</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {revisionEvents.map(e => (
                  <div key={e.id} className="text-[11px] bg-ninma-orange-light text-ninma-orange-dark px-2.5 py-1 rounded-md">
                    {fmtDate(e.createdAt)} · {e.actorName || 'Revisor'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden">
        <div className="relative pl-10">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />
          {STEPS.map((step, i) => {
            const reached = i <= activeIdx
            const ev = lastEventTo(step.key)
            const Icon = step.Icon
            return (
              <div key={step.key} className="relative pb-5 last:pb-0">
                <div
                  className={[
                    'absolute -left-[27px] w-9 h-9 rounded-full flex items-center justify-center border-[3px]',
                    reached ? 'bg-white border-ninma-purple text-ninma-purple' : 'bg-gray-50 border-gray-200 text-gray-300',
                  ].join(' ')}
                >
                  {reached && i < activeIdx ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${reached ? 'text-ninma-dark' : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500">{step.sub}</div>
                  {ev && (
                    <div className="text-xs text-ninma-purple mt-1">
                      {fmtDate(ev.createdAt)}{ev.actorName ? ` · ${ev.actorName}` : ''}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {hasRevisionHistory && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-xs text-ninma-orange-dark mb-2">
                <RotateCcw size={12} />
                <span className="font-semibold">Revisões solicitadas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {revisionEvents.map(e => (
                  <div key={e.id} className="text-[11px] bg-ninma-orange-light text-ninma-orange-dark px-2 py-0.5 rounded-md">
                    {fmtDate(e.createdAt)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Suppress unused import warnings for icons reserved for future steps
void UserCheck
