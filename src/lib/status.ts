import { TemplateStatus } from '@/types'

/**
 * Fonte única de verdade para rótulos e estilos dos status de template.
 *
 * Antes cada tela (orientador, coordenação, formulário, timeline) definia seus
 * próprios rótulos, o que fazia o mesmo status aparecer com nomes diferentes
 * (ex.: ENVIADO como "Pendentes" numa tela e "Enviado" em outra). Tudo passa a
 * vir daqui para manter a nomenclatura consistente em todo o sistema.
 */
export const STATUS_CONFIG: Record<
  TemplateStatus,
  { label: string; className: string }
> = {
  RASCUNHO:               { label: 'Rascunho',              className: 'badge-rascunho' },
  ENVIADO:                { label: 'Enviado',               className: 'badge-enviado' },
  AGUARDANDO_COORDENACAO: { label: 'Aguardando coordenação', className: 'badge-aguardando' },
  REVISAO:                { label: 'Em Revisão',            className: 'badge-revisao' },
  APROVADO:               { label: 'Aprovado',              className: 'badge-aprovado' },
}

/** Ordem canônica das etapas do fluxo, para dropdowns e listagens. */
export const STATUS_ORDER: TemplateStatus[] = [
  'RASCUNHO',
  'ENVIADO',
  'AGUARDANDO_COORDENACAO',
  'REVISAO',
  'APROVADO',
]

/** Rótulo de um status (com fallback seguro para valores desconhecidos). */
export function statusLabel(status: string): string {
  return STATUS_CONFIG[status as TemplateStatus]?.label || status
}

/** Classe de badge de um status (fallback para o estilo de rascunho). */
export function statusBadgeClass(status: string): string {
  return STATUS_CONFIG[status as TemplateStatus]?.className || 'badge-rascunho'
}
