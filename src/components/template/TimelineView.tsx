'use client'

import { TemplateEvent } from '@/types'
import { FileEdit, Send, Building2, Printer, RotateCcw, CheckCircle2, Clock } from 'lucide-react'

/**
 * Visual timeline of the template's journey through the approval workflow.
 *
 * Three visual states per step:
 *   ✓ COMPLETED  — green check on white, solid ring, date shown
 *   ● CURRENT    — large pulsing purple gradient marker, "ETAPA ATUAL" badge
 *   ○ PENDING    — dashed outline, gray, no date
 *
 * Source of truth for dates is the TemplateEvent table (one row per transition).
 */

interface TimelineViewProps {
  currentStatus: string
  events?: TemplateEvent[]
  className?: string
}

type StepKey = 'RASCUNHO' | 'ENVIADO' | 'AGUARDANDO_COORDENACAO' | 'APROVADO'

// Each step shows a different caption depending on whether it's already done,
// currently active, or still pending — so the text always reflects real state.
interface StepDef {
  key: StepKey
  label: string
  Icon: typeof FileEdit
  sub: { completed: string; current: string; pending: string }
}

const STEPS: StepDef[] = [
  {
    key: 'RASCUNHO', label: 'Rascunho', Icon: FileEdit,
    sub: { completed: 'Aluno preencheu',  current: 'Aluno preenchendo',  pending: 'Aluno preencherá' },
  },
  {
    key: 'ENVIADO', label: 'Em revisão', Icon: Send,
    sub: { completed: 'Orientador avaliou', current: 'Orientador avaliando', pending: 'Aguardando envio ao orientador' },
  },
  {
    key: 'AGUARDANDO_COORDENACAO', label: 'Coordenação', Icon: Building2,
    sub: { completed: 'Coordenação aprovou', current: 'Coordenação avaliando', pending: 'Aguardando aprovação do orientador' },
  },
  {
    key: 'APROVADO', label: 'Aprovado', Icon: Printer,
    sub: { completed: 'Liberado para impressão', current: 'Liberado para impressão', pending: 'Aguardando aprovação' },
  },
]

function activeIndexFor(status: string): number {
  switch (status) {
    case 'RASCUNHO':                return 0
    case 'ENVIADO':                 return 1
    case 'AGUARDANDO_COORDENACAO':  return 2
    case 'APROVADO':                return 3
    case 'REVISAO':                 return 0
    default:                        return 0
  }
}

function fmtDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear()).slice(-2)
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yy} · ${hh}:${mi}`
}

export function TimelineView({ currentStatus, events = [], className = '' }: TimelineViewProps) {
  const activeIdx = activeIndexFor(currentStatus)
  const isRevisao = currentStatus === 'REVISAO'

  // Last event that transitioned INTO each step
  const lastEventTo = (toStatus: string) => {
    const evs = events.filter(e => e.toStatus === toStatus)
    return evs.length > 0 ? evs[evs.length - 1] : null
  }

  const revisionEvents = events.filter(e => e.toStatus === 'REVISAO')
  const hasRevisionHistory = revisionEvents.length > 0

  return (
    <div className={`card ${className}`}>
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-ninma-purple">Linha do tempo</h3>
        <p className="text-xs text-gray-500 mt-0.5">Acompanhamento do fluxo de aprovação</p>
        {isRevisao && (
          <div className="mt-3 inline-flex items-center gap-2 bg-ninma-orange-light text-ninma-orange-dark text-xs font-semibold px-3 py-1.5 rounded-full">
            <RotateCcw size={12} />
            Documento devolvido ao aluno para ajustes
          </div>
        )}
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:block">
        <div className="relative pt-2 pb-2">
          {/* Track */}
          <div className="absolute top-8 left-[7%] right-[7%] h-1 bg-gray-200 rounded-full" />
          <div
            className="absolute top-8 left-[7%] h-1 bg-gradient-to-r from-ninma-teal via-ninma-purple to-green-500 rounded-full transition-all duration-700"
            style={{ width: `calc(${(activeIdx / (STEPS.length - 1)) * 86}%)` }}
          />

          <div className="relative flex justify-between">
            {STEPS.map((step, i) => {
              const completed = i < activeIdx
              const isCurrent = i === activeIdx && !isRevisao
              const pending = i > activeIdx
              const ev = lastEventTo(step.key)
              const Icon = step.Icon

              return (
                <div key={step.key} className="flex flex-col items-center flex-1 min-w-0 px-1">
                  {/* Marker */}
                  <div
                    className={[
                      'relative rounded-full flex items-center justify-center transition-all',
                      isCurrent
                        ? 'w-16 h-16 -mt-1 bg-gradient-to-br from-ninma-teal to-ninma-purple text-white shadow-lg ring-4 ring-ninma-purple/25'
                        : 'w-12 h-12',
                      completed && !isCurrent && 'bg-green-50 border-[3px] border-green-500 text-green-600 shadow-sm',
                      pending && !isCurrent && 'bg-white border-2 border-dashed border-gray-300 text-gray-300',
                    ].filter(Boolean).join(' ')}
                  >
                    {completed ? <CheckCircle2 size={22} /> :
                      isCurrent ? <Icon size={26} /> :
                      <Icon size={18} />}
                  </div>

                  {/* Label + date */}
                  <div className="mt-3 text-center w-full">
                    {isCurrent && (
                      <div className="inline-block mb-1 text-[9px] font-bold tracking-widest bg-ninma-purple text-white px-2 py-0.5 rounded">
                        ETAPA ATUAL
                      </div>
                    )}
                    <div className={[
                      'text-sm font-semibold truncate',
                      completed && 'text-green-700',
                      isCurrent && 'text-ninma-purple',
                      pending && 'text-gray-400',
                    ].filter(Boolean).join(' ')}>
                      {step.label}
                    </div>
                    <div className={[
                      'text-[11px] mt-0.5',
                      completed && 'text-gray-500',
                      isCurrent && 'text-ninma-inkSoft font-medium',
                      pending && 'text-gray-300',
                    ].filter(Boolean).join(' ')}>
                      {completed ? step.sub.completed : isCurrent ? step.sub.current : step.sub.pending}
                    </div>
                    {ev ? (
                      <div className={[
                        'mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full',
                        completed && 'bg-green-50 text-green-700 font-medium',
                        isCurrent && 'bg-ninma-purple text-white font-semibold',
                      ].filter(Boolean).join(' ')}>
                        <Clock size={10} />
                        {fmtDate(ev.createdAt)}
                      </div>
                    ) : pending ? (
                      <div className="mt-2 text-[10px] text-gray-300 italic">pendente</div>
                    ) : null}
                    {ev?.actorName && !pending && (
                      <div className="text-[10px] text-gray-500 mt-1 truncate px-1">
                        {ev.actorName}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Revisões */}
          {hasRevisionHistory && (
            <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-xs text-ninma-orange-dark mb-2">
                <RotateCcw size={14} />
                <span className="font-semibold uppercase tracking-wider">Histórico de revisões solicitadas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {revisionEvents.map(e => (
                  <div key={e.id} className="text-[11px] bg-ninma-orange-light text-ninma-orange-dark px-3 py-1 rounded-md font-medium">
                    {fmtDate(e.createdAt)}{e.actorName ? ` · ${e.actorName}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden">
        <div className="relative pl-12">
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gray-200" />
          {STEPS.map((step, i) => {
            const completed = i < activeIdx
            const isCurrent = i === activeIdx && !isRevisao
            const pending = i > activeIdx
            const ev = lastEventTo(step.key)
            const Icon = step.Icon
            return (
              <div key={step.key} className="relative pb-6 last:pb-0">
                <div className="absolute -left-[35px] top-0">
                  <div className={[
                    'relative rounded-full flex items-center justify-center',
                    isCurrent
                      ? 'w-12 h-12 bg-gradient-to-br from-ninma-teal to-ninma-purple text-white shadow-lg ring-4 ring-ninma-purple/25'
                      : 'w-10 h-10',
                    completed && !isCurrent && 'bg-green-50 border-[3px] border-green-500 text-green-600',
                    pending && !isCurrent && 'bg-white border-2 border-dashed border-gray-300 text-gray-300',
                  ].filter(Boolean).join(' ')}>
                    {completed ? <CheckCircle2 size={18} /> :
                      isCurrent ? <Icon size={20} /> :
                      <Icon size={14} />}
                  </div>
                </div>
                <div className="pt-1">
                  {isCurrent && (
                    <span className="inline-block mb-1 text-[9px] font-bold tracking-widest bg-ninma-purple text-white px-2 py-0.5 rounded">
                      ETAPA ATUAL
                    </span>
                  )}
                  <div className={[
                    'text-sm font-semibold',
                    completed && 'text-green-700',
                    isCurrent && 'text-ninma-purple',
                    pending && 'text-gray-400',
                  ].filter(Boolean).join(' ')}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {completed ? step.sub.completed : isCurrent ? step.sub.current : step.sub.pending}
                  </div>
                  {ev ? (
                    <div className={[
                      'mt-1.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full',
                      completed && 'bg-green-50 text-green-700 font-medium',
                      isCurrent && 'bg-ninma-purple text-white font-semibold',
                    ].filter(Boolean).join(' ')}>
                      <Clock size={10} />
                      {fmtDate(ev.createdAt)}{ev.actorName ? ` · ${ev.actorName}` : ''}
                    </div>
                  ) : pending ? (
                    <div className="text-[11px] text-gray-300 italic mt-1">pendente</div>
                  ) : null}
                </div>
              </div>
            )
          })}
          {hasRevisionHistory && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-xs text-ninma-orange-dark mb-2">
                <RotateCcw size={12} />
                <span className="font-semibold uppercase tracking-wider">Revisões solicitadas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {revisionEvents.map(e => (
                  <div key={e.id} className="text-[11px] bg-ninma-orange-light text-ninma-orange-dark px-2.5 py-1 rounded-md">
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
