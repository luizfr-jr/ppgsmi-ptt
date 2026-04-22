'use client'

import { useState, useCallback, useEffect } from 'react'
import { Save, Download, Send, CheckCircle, RotateCcw, AlertCircle, Link } from 'lucide-react'
import { TemplateStatus } from '@/types'
import { RadioGroup } from './RadioGroup'
import { NinMaLogo } from '@/components/layout/NinMaLogo'
import { CheckboxGroup } from './CheckboxGroup'
import { AttachmentsUploader } from './AttachmentsUploader'
import { Template, Attachment } from '@/types'

interface TemplateFormProps {
  template: Template
  attachments?: Attachment[]
  readOnly?: boolean
  canChangeStatus?: boolean
  // Role of the currently logged-in user, used to pick which status
  // transitions appear in the toolbar. Falls back gracefully if absent.
  userRole?: 'ALUNO' | 'ORIENTADOR' | 'COORDENACAO' | 'SUPERADMIN'
  onSaved?: (t: Template) => void
}

const SECTOR_OPTIONS = [
  { value: 'AGRICULTURA', label: 'Agricultura, pecuária, prod. florestal, pesca e aquicultura' },
  { value: 'INDUSTRIA', label: 'Indústria de transformação' },
  { value: 'AGUA_ESGOTO', label: 'Água, esgoto, atividades de gestão de resíduos e descontaminação' },
  { value: 'CONSTRUCAO', label: 'Construção' },
  { value: 'COMERCIO', label: 'Comércio, reparação e veículos automotores e motocicletas' },
  { value: 'TRANSPORTE', label: 'Transporte, armazenagem e correio' },
  { value: 'ALOJAMENTO', label: 'Alojamento e alimentação' },
  { value: 'INFORMACAO', label: 'Informação e comunicação' },
  { value: 'FINANCEIRO', label: 'Atividades financeiras, de seguros e serviços relacionados' },
  { value: 'IMOBILIARIO', label: 'Atividades imobiliárias' },
  { value: 'PROFISSIONAL', label: 'Atividades profissionais, científicas e técnicas' },
  { value: 'ADMINISTRATIVO', label: 'Atividades administrativas e serviços complementares' },
  { value: 'ADM_PUBLICA', label: 'Administração pública, defesa e seguridade social' },
  { value: 'EDUCACAO', label: 'Educação' },
  { value: 'SAUDE', label: 'Saúde humana e serviços sociais' },
  { value: 'ARTES', label: 'Artes, cultura, esporte e recreação' },
  { value: 'OUTROS_SERVICOS', label: 'Outras atividades de serviços' },
  { value: 'SERVICOS_DOM', label: 'Serviços domésticos' },
  { value: 'ORGANISMOS_INTL', label: 'Organismos internacionais e outras instituições extraterritoriais' },
]

function isValidUrl(url: string): boolean {
  if (!url) return false
  try { new URL(url); return true } catch { return false }
}

export function TemplateForm({ template: initialTemplate, attachments = [], readOnly = false, canChangeStatus = false, userRole, onSaved }: TemplateFormProps) {
  const [template, setTemplate] = useState(initialTemplate)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Parse JSON arrays
  const impactoAreaValues: string[] = (() => {
    try { return JSON.parse(template.impactoArea || '[]') } catch { return [] }
  })()
  const setorValues: string[] = (() => {
    try { return JSON.parse(template.setorBeneficiado || '[]') } catch { return [] }
  })()

  function update(field: keyof Template, value: string | null) {
    setTemplate(prev => ({ ...prev, [field]: value }))
  }

  // Auto-save with debounce
  useEffect(() => {
    if (readOnly) return
    const timer = setTimeout(() => {
      handleSave()
    }, 3000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template])

  async function handleSave() {
    if (readOnly) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      const data = await res.json()
      if (data.success) {
        setSavedAt(new Date())
        onSaved?.(data.data)
      } else {
        setError('Erro ao salvar')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(newStatus: TemplateStatus) {
    const res = await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (data.success) {
      setTemplate(prev => ({ ...prev, status: newStatus }))
      onSaved?.(data.data)
    }
  }

  async function handleExportPDF() {
    setGeneratingPDF(true)
    try {
      // Re-fetch attachments so files uploaded in this session are included
      let freshAttachments = attachments
      try {
        const res = await fetch(`/api/templates/${template.id}/attachments`)
        const data = await res.json()
        if (data.success) freshAttachments = data.data
      } catch { /* keep initial list on network error */ }

      const { generateTemplatePDF } = await import('@/lib/pdf')
      await generateTemplatePDF(template, freshAttachments)
    } catch (e) {
      console.error('PDF error', e)
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Erro ao gerar PDF: ${msg.slice(0, 120)}`)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    ENVIADO: 'Enviado ao orientador',
    AGUARDANDO_COORDENACAO: 'Aguardando coordenação',
    REVISAO: 'Em revisão',
    APROVADO: 'Aprovado para impressão',
  }

  const statusColors: Record<string, string> = {
    RASCUNHO: 'bg-gray-100 text-gray-600',
    ENVIADO: 'bg-ninma-teal-light text-ninma-teal-dark',
    AGUARDANDO_COORDENACAO: 'bg-ninma-purple-light text-ninma-purple',
    REVISAO: 'bg-ninma-orange-light text-ninma-orange-dark',
    APROVADO: 'bg-green-100 text-green-700',
  }

  const isCoord = userRole === 'COORDENACAO' || userRole === 'SUPERADMIN'
  const isAdvisor = userRole === 'ORIENTADOR'
  const isStudent = userRole === 'ALUNO'

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="card sticky top-16 z-30 flex items-center justify-between gap-3 flex-wrap shadow-md">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[template.status] || statusColors.RASCUNHO}`}>
            {statusLabels[template.status] || template.status}
          </span>
          {savedAt && !saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <CheckCircle size={12} className="text-ninma-teal" />
              Salvo
            </span>
          )}
          {saving && <span className="text-xs text-gray-400">Salvando...</span>}
          {error && <span className="text-xs text-ninma-pink">{error}</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!readOnly && (
            <button onClick={handleSave} disabled={saving} className="btn-outline flex items-center gap-2 py-2 px-4 text-sm">
              <Save size={15} />
              Salvar
            </button>
          )}

          <button onClick={handleExportPDF} disabled={generatingPDF} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
            <Download size={15} />
            {generatingPDF ? 'Gerando...' : 'Exportar PDF'}
          </button>

          {canChangeStatus && (
            <>
              {/* Aluno — envia ao orientador */}
              {(isStudent || !userRole) && template.status === 'RASCUNHO' && (
                <button
                  onClick={() => handleStatusChange('ENVIADO')}
                  className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <Send size={15} />
                  Enviar ao orientador
                </button>
              )}
              {(isStudent || !userRole) && template.status === 'REVISAO' && (
                <button
                  onClick={() => handleStatusChange('ENVIADO')}
                  className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                >
                  <Send size={15} />
                  Reenviar ao orientador
                </button>
              )}

              {/* Orientador — aprova para coordenação ou devolve ao aluno */}
              {isAdvisor && template.status === 'ENVIADO' && (
                <>
                  <button
                    onClick={() => handleStatusChange('REVISAO')}
                    className="bg-ninma-orange hover:bg-ninma-orange-dark text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2"
                  >
                    <RotateCcw size={15} />
                    Solicitar revisão
                  </button>
                  <button
                    onClick={() => handleStatusChange('AGUARDANDO_COORDENACAO')}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={15} />
                    Aprovar e enviar à coordenação
                  </button>
                </>
              )}

              {/* Coordenação — aprova definitivo ou devolve ao aluno */}
              {isCoord && template.status === 'AGUARDANDO_COORDENACAO' && (
                <>
                  <button
                    onClick={() => handleStatusChange('REVISAO')}
                    className="bg-ninma-orange hover:bg-ninma-orange-dark text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2"
                  >
                    <RotateCcw size={15} />
                    Solicitar revisão
                  </button>
                  <button
                    onClick={() => handleStatusChange('APROVADO')}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-xl text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={15} />
                    Aprovar para impressão
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* CAPA */}
      <div className="card">
        <div className="text-center border-b border-ninma-teal/20 pb-6 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ninma-teal-light mb-3">
            <NinMaLogo className="w-12 h-auto" />
          </div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Universidade Franciscana</h2>
          <h3 className="text-base font-bold text-ninma-dark mt-1">
            Programa de Pós-Graduação em Saúde Materno Infantil
          </h3>
          <div className="inline-block mt-3 bg-gradient-to-r from-ninma-teal to-ninma-purple text-white px-4 py-1.5 rounded-full text-sm font-semibold">
            Produto Técnico-Tecnológico
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Aluno</label>
            <input
              type="text"
              className="input"
              placeholder="Nome completo do aluno"
              value={template.aluno || ''}
              onChange={e => update('aluno', e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="label">Orientador</label>
            <input
              type="text"
              className="input"
              placeholder="Nome completo do orientador"
              value={template.orientador || ''}
              onChange={e => update('orientador', e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="label">Coorientador <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
            <input
              type="text"
              className="input"
              placeholder="Nome completo do coorientador"
              value={template.coorientador || ''}
              onChange={e => update('coorientador', e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="label">Banca Avaliadora</label>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="Membros da banca avaliadora (um por linha)"
              value={template.bancaAvaliadora || ''}
              onChange={e => update('bancaAvaliadora', e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={template.data || ''}
              onChange={e => update('data', e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* CAMPO 1 - Título */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">1</span>
          Título do Produto
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Título em Português</label>
            <input
              type="text"
              className="input"
              placeholder="Título do produto em português"
              value={template.tituloPt || ''}
              onChange={e => update('tituloPt', e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="label">Title in English</label>
            <input
              type="text"
              className="input"
              placeholder="Product title in English"
              value={template.tituloEn || ''}
              onChange={e => update('tituloEn', e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* CAMPO 2 - Linha de Pesquisa */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">2</span>
          Linha de Pesquisa
        </div>
        <RadioGroup
          name="linhaPesquisa"
          value={template.linhaPesquisa}
          onChange={v => update('linhaPesquisa', v)}
          disabled={readOnly}
          options={[
            { value: 'SAUDE_MATERNA', label: 'Atenção integral à saúde materna, neonatal e infantil' },
            { value: 'GESTAO_REDE', label: 'Organização e gestão da rede de atenção à saúde materno infantil' },
          ]}
        />
      </div>

      {/* CAMPO 3 - Participantes */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">3</span>
          Participação de discente/egresso/docente e participante externo ao programa
        </div>
        <textarea
          className="textarea"
          placeholder="Descreva os participantes (discente, egresso, docente e participante externo)"
          value={template.participantes || ''}
          onChange={e => update('participantes', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* CAMPO 4 - Objetivo */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">4</span>
          Objetivo do Produto Técnico-Tecnológico
        </div>
        <textarea
          className="textarea"
          placeholder="Descreva o objetivo do produto técnico-tecnológico"
          value={template.objetivo || ''}
          onChange={e => update('objetivo', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* CAMPO 5 - Finalidade */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">5</span>
          Finalidade do Produto Técnico-Tecnológico
          <span className="ml-auto text-xs font-normal text-gray-400">máx. 255 caracteres</span>
        </div>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="Descreva a finalidade do produto (máximo 255 caracteres)"
          maxLength={255}
          value={template.finalidade || ''}
          onChange={e => update('finalidade', e.target.value)}
          disabled={readOnly}
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {(template.finalidade || '').length}/255
        </div>
      </div>

      {/* CAMPO 6 - Referencial Teórico */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">6</span>
          Referencial teórico e metodológico
        </div>
        <textarea
          className="textarea"
          placeholder="Descreva o referencial teórico e metodológico utilizado"
          value={template.referencialTeorico || ''}
          onChange={e => update('referencialTeorico', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* CAMPO 7 - Descrição do Produto */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">7</span>
          Descrição do Produto Técnico-Tecnológico
        </div>
        <textarea
          className="textarea"
          placeholder="Descreva detalhadamente o produto técnico-tecnológico"
          value={template.descricaoProduto || ''}
          onChange={e => update('descricaoProduto', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* CAMPO 8 - Relevância */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">8</span>
          Relevância científica, tecnológica, social e de inovação
        </div>
        <textarea
          className="textarea"
          placeholder="Descreva a relevância científica, tecnológica, social e de inovação do produto"
          value={template.relevancia || ''}
          onChange={e => update('relevancia', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* CAMPO 9 - Observações */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">9</span>
          Observações
        </div>
        <textarea
          className="textarea"
          placeholder="Observações adicionais"
          value={template.observacoes || ''}
          onChange={e => update('observacoes', e.target.value)}
          disabled={readOnly}
        />
      </div>

      {/* IMPACTO - seção agrupada */}
      <div className="card">
        <h2 className="text-base font-bold text-ninma-dark mb-6 pb-3 border-b border-gray-100">
          Impacto do Produto Técnico-Tecnológico
        </h2>

        {/* CAMPO 10 - Nível */}
        <div className="mb-6">
          <div className="section-title">
            <span className="field-number">10</span>
            Nível
          </div>
          <RadioGroup
            name="impactoNivel"
            value={template.impactoNivel}
            onChange={v => update('impactoNivel', v)}
            disabled={readOnly}
            options={[
              { value: 'ALTO', label: 'Alto', description: 'Houve mudança permanente.' },
              { value: 'MEDIO', label: 'Médio', description: 'Houve mudanças temporária.' },
              { value: 'BAIXO', label: 'Baixo', description: 'Não houve mudança.' },
            ]}
          />
        </div>

        {/* CAMPO 11 - Demanda */}
        <div className="mb-6">
          <div className="section-title">
            <span className="field-number">11</span>
            Demanda
          </div>
          <RadioGroup
            name="impactoDemanda"
            value={template.impactoDemanda}
            onChange={v => update('impactoDemanda', v)}
            disabled={readOnly}
            options={[
              { value: 'ESPONTANEO', label: 'Espontânea', description: 'Oferta de Produto Técnico-Tecnológico pelo programa espontaneamente, sem que haja demanda de instituição.' },
              { value: 'CONCORRENCIA', label: 'Por concorrência', description: 'Programa apresentou proposta para concorrência, p. ex. edital, concurso.' },
              { value: 'CONTRATADA', label: 'Contratada', description: 'Programa foi procurado por instituição para desenvolver determinado Produto Técnico-Tecnológico.' },
            ]}
          />
        </div>

        {/* CAMPO 12 - Objetivo */}
        <div className="mb-6">
          <div className="section-title">
            <span className="field-number">12</span>
            Objetivo
          </div>
          <RadioGroup
            name="impactoObjetivo"
            value={template.impactoObjetivo}
            onChange={v => update('impactoObjetivo', v)}
            disabled={readOnly}
            options={[
              { value: 'EXPERIMENTAL', label: 'Experimental', description: 'Protótipo, modelo, fase inicial de Produto Técnico-Tecnológico.' },
              { value: 'SOLUCAO_PROBLEMA', label: 'Solução de um problema previamente identificado', description: 'Produto Técnico-Tecnológico direcionado para a solução de um problema.' },
              { value: 'SEM_FOCO', label: 'Sem um foco de aplicação inicialmente definido', description: 'Produto Técnico-Tecnológico que no decorrer de sua produção teve identificado o potencial de solução de um problema.' },
            ]}
          />
        </div>

        {/* CAMPO 13 - Área */}
        <div className="mb-6">
          <div className="section-title">
            <span className="field-number">13</span>
            Área Impactada
            <span className="ml-2 text-xs font-normal text-gray-400">(selecione a mais relevante)</span>
          </div>
          <CheckboxGroup
            name="impactoArea"
            values={impactoAreaValues}
            onChange={vals => update('impactoArea', JSON.stringify(vals))}
            disabled={readOnly}
            options={[
              { value: 'ECONOMICO', label: 'Econômico' },
              { value: 'SAUDE', label: 'Saúde' },
              { value: 'ENSINO', label: 'Ensino' },
              { value: 'SOCIAL', label: 'Social' },
              { value: 'AMBIENTAL', label: 'Ambiental' },
              { value: 'CIENTIFICO', label: 'Científico' },
              { value: 'APRENDIZAGEM', label: 'Aprendizagem' },
              { value: 'CULTURAL', label: 'Cultural' },
            ]}
          />
        </div>

        {/* CAMPO 14 - Tipo */}
        <div>
          <div className="section-title">
            <span className="field-number">14</span>
            Tipo
          </div>
          <RadioGroup
            name="impactoTipo"
            value={template.impactoTipo}
            onChange={v => update('impactoTipo', v)}
            disabled={readOnly}
            options={[
              { value: 'REAL', label: 'Real', description: 'Ocorreram mudanças, social, econômica, educacional, na saúde e outras, resultantes do Produto Técnico-Tecnológico.' },
              { value: 'POTENCIAL', label: 'Potencial', description: 'Ainda não foi possível identificar mudanças concretas resultantes do Produto Técnico-Tecnológico.' },
            ]}
          />
          <div className="mt-3">
            <label className="label">Descrever <span className="text-gray-400 text-xs font-normal">(máx. 255 caracteres)</span></label>
            <textarea
              className="textarea min-h-[80px]"
              maxLength={255}
              placeholder="Descreva o tipo de impacto"
              value={template.impactoTipoDesc || ''}
              onChange={e => update('impactoTipoDesc', e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* CAMPO 15 - Replicabilidade */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">15</span>
          Replicabilidade
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Facilidade com que se pode empregar o Produto Técnico-Tecnológico a fim de atingir seus objetivos específicos para os quais foi desenvolvida. Possível de ser replicada em diferentes ambientes e grupos sociais.
        </p>
        <RadioGroup
          name="replicabilidade"
          value={template.replicabilidade}
          onChange={v => update('replicabilidade', v)}
          disabled={readOnly}
          options={[
            { value: 'SIM', label: 'Sim' },
            { value: 'NAO', label: 'Não' },
          ]}
        />
        <div className="mt-3">
          <label className="label">Descrever</label>
          <textarea
            className="textarea min-h-[80px]"
            placeholder="Descreva a replicabilidade"
            value={template.replicabilidadeDesc || ''}
            onChange={e => update('replicabilidadeDesc', e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* CAMPO 16 - Abrangência */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">16</span>
          Abrangência territorial
        </div>
        <RadioGroup
          name="abrangencia"
          value={template.abrangencia}
          onChange={v => update('abrangencia', v)}
          disabled={readOnly}
          options={[
            { value: 'INTERNACIONAL', label: 'Internacional', description: 'Instituição em país diferente do Brasil.' },
            { value: 'NACIONAL', label: 'Nacional', description: 'Uma ou mais instituição(ões) em diferentes estados do território nacional.' },
            { value: 'REGIONAL', label: 'Regional', description: 'Uma ou mais instituição(ões) e/ou município(s) no mesmo estado.' },
            { value: 'LOCAL', label: 'Local', description: 'Instituição ou município.' },
          ]}
        />
      </div>

      {/* CAMPO 17 - Complexidade */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">17</span>
          Complexidade
        </div>
        <RadioGroup
          name="complexidade"
          value={template.complexidade}
          onChange={v => update('complexidade', v)}
          disabled={readOnly}
          options={[
            { value: 'ALTA', label: 'Alta', description: 'Sinergia ou associação de diferentes áreas do conhecimento e interação de múltiplos atores.' },
            { value: 'MEDIA', label: 'Média', description: 'Combinação de conhecimentos pré-estabelecidos restrita à uma área do conhecimento e participação de poucos autores.' },
            { value: 'BAIXA', label: 'Baixa', description: 'Alteração/adaptação de conhecimento existente e estabelecido sem a participação de diferentes atores.' },
          ]}
        />
        <div className="mt-3">
          <label className="label">Descrever</label>
          <textarea
            className="textarea min-h-[80px]"
            placeholder="Descreva o grau de complexidade"
            value={template.complexidadeDesc || ''}
            onChange={e => update('complexidadeDesc', e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* CAMPO 18 - Inovação */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">18</span>
          Inovação
        </div>
        <RadioGroup
          name="inovacao"
          value={template.inovacao}
          onChange={v => update('inovacao', v)}
          disabled={readOnly}
          options={[
            { value: 'ALTO', label: 'Alto teor inovativo', description: 'Desenvolvimento com base em conhecimento inédito.' },
            { value: 'MEDIO', label: 'Médio teor inovativo', description: 'Combinação de conhecimento pré-estabelecidos.' },
            { value: 'BAIXO', label: 'Baixo teor inovativo', description: 'Adaptação de conhecimento existente.' },
            { value: 'SEM', label: 'Sem Inovação', description: 'Repetição de conhecimento já existente.' },
          ]}
        />
        <div className="mt-3">
          <label className="label">Descrever</label>
          <textarea
            className="textarea min-h-[80px]"
            placeholder="Descreva o teor de inovação"
            value={template.inovacaoDesc || ''}
            onChange={e => update('inovacaoDesc', e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* CAMPO 19 - Setor */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">19</span>
          Setor da sociedade beneficiado com o impacto
          <span className="ml-2 text-xs font-normal text-gray-400">(selecione o mais impactado)</span>
        </div>
        <CheckboxGroup
          name="setorBeneficiado"
          values={setorValues}
          onChange={vals => update('setorBeneficiado', JSON.stringify(vals))}
          disabled={readOnly}
          options={SECTOR_OPTIONS}
        />
      </div>

      {/* CAMPO 20 - PDI */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">20</span>
          Declaração de vínculo do produto com o Plano de Desenvolvimento Institucional (PDI)
        </div>
        <RadioGroup
          name="vinculoPDI"
          value={template.vinculoPDI}
          onChange={v => update('vinculoPDI', v)}
          disabled={readOnly}
          options={[
            { value: 'SIM', label: 'Sim' },
            { value: 'NAO', label: 'Não' },
          ]}
        />
        <p className="text-xs text-gray-400 mt-2">* Anexar documento comprobatório</p>
      </div>

      {/* CAMPO 21 - Fomento */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">21</span>
          Fomento
        </div>
        <RadioGroup
          name="fomento"
          value={template.fomento}
          onChange={v => update('fomento', v)}
          disabled={readOnly}
          options={[
            { value: 'FINANCIAMENTO', label: 'Financiamento', description: 'Externo ao programa.' },
            { value: 'COOPERACAO', label: 'Cooperação', description: 'Desenvolvimento em parceria externa ao programa.' },
          ]}
        />
        <div className="mt-3">
          <label className="label">Código do projeto</label>
          <input
            type="text"
            className="input"
            placeholder="Código do projeto de fomento"
            value={template.fomentoCodigo || ''}
            onChange={e => update('fomentoCodigo', e.target.value)}
            disabled={readOnly}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">* Anexar documento comprobatório</p>
      </div>

      {/* CAMPO 22 - Propriedade Intelectual */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">22</span>
          Registro/depósito de propriedade intelectual
        </div>
        <div>
          <label className="label">Código de registro</label>
          <input
            type="text"
            className="input"
            placeholder="Código de registro de propriedade intelectual"
            value={template.propriedadeIntelectual || ''}
            onChange={e => update('propriedadeIntelectual', e.target.value)}
            disabled={readOnly}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">* Anexar documento comprobatório</p>
      </div>

      {/* CAMPO 23 - Estágio */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">23</span>
          Estágio da tecnologia
        </div>
        <RadioGroup
          name="estagioTecnologia"
          value={template.estagioTecnologia}
          onChange={v => update('estagioTecnologia', v)}
          disabled={readOnly}
          options={[
            { value: 'PILOTO', label: 'Piloto/Protótipo' },
            { value: 'FINALIZADO', label: 'Finalizado e implantado' },
            { value: 'TESTE', label: 'Em teste' },
          ]}
        />
        <p className="text-xs text-gray-400 mt-2">* Anexar documento comprobatório</p>
      </div>

      {/* CAMPO 24 - Transferência */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">24</span>
          Transferência de tecnologia/conhecimento
        </div>
        <RadioGroup
          name="transferenciaConhecimento"
          value={template.transferenciaConhecimento}
          onChange={v => update('transferenciaConhecimento', v)}
          disabled={readOnly}
          options={[
            { value: 'SIM', label: 'Sim', description: 'Produto Técnico-Tecnológico foi incorporada/implementada na(s) instituição(ões).' },
            { value: 'NAO', label: 'Não' },
          ]}
        />
        <p className="text-xs text-gray-400 mt-2">* Anexar documento comprobatório</p>
      </div>

      {/* CAMPO 25 - URL */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">25</span>
          Endereço do Produto Técnico-Tecnológico – URL
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Link size={15} />
          </div>
          <input
            type="text"
            className={`input pl-9 pr-10 transition-colors ${
              template.urlProduto
                ? isValidUrl(template.urlProduto)
                  ? 'border-green-400 focus:border-green-500'
                  : 'border-red-400 focus:border-red-500'
                : ''
            }`}
            placeholder="https://..."
            value={template.urlProduto || ''}
            onChange={e => update('urlProduto', e.target.value)}
            disabled={readOnly}
          />
          {template.urlProduto && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidUrl(template.urlProduto) ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertCircle size={16} className="text-red-400" />
              )}
            </div>
          )}
        </div>
        {template.urlProduto && !isValidUrl(template.urlProduto) && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <AlertCircle size={12} /> URL inválida. Inclua o protocolo (ex: https://site.com)
          </p>
        )}
        {template.urlProduto && isValidUrl(template.urlProduto) && (
          <a
            href={template.urlProduto}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ninma-teal hover:underline mt-1.5 inline-flex items-center gap-1"
          >
            <Link size={11} /> Abrir link
          </a>
        )}
      </div>

      {/* CAMPO 26 - Divulgação */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">26</span>
          Divulgação
        </div>
        <p className="text-xs text-gray-500 mb-3">Descreva as formas de divulgação e/ou anexe fotos, imagens e reportagens.</p>
        <textarea
          className="textarea mb-4"
          placeholder="Links de reportagens, publicações, redes sociais..."
          value={template.divulgacao || ''}
          onChange={e => update('divulgacao', e.target.value)}
          disabled={readOnly}
        />
        <AttachmentsUploader
          templateId={template.id}
          initial={attachments.filter(a => a.section === 'divulgacao')}
          readOnly={readOnly}
          section="divulgacao"
        />
      </div>

      {/* CAMPO 27 - Anexos */}
      <div className="card">
        <div className="section-title">
          <span className="field-number">27</span>
          Anexos
        </div>
        <div className="bg-ninma-teal-light/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-ninma-teal-dark font-medium mb-2">Dependendo do Produto Técnico-Tecnológico, anexar:</p>
          <ul className="text-xs text-ninma-teal-dark space-y-1 list-disc list-inside">
            <li>Apresentação do Produto Técnico-Tecnológico</li>
            <li>Declaração emitida pela organização/instituição demandante</li>
            <li>Declaração emitida pelo Núcleo de Inovação Tecnológica, contrato de licenciamento ou documento de patente</li>
            <li>Outros documentos (registro INPI, repositórios de software, código fonte)</li>
            <li>Contrato Social / Estatuto social organização / Registro em Junta Comercial</li>
            <li>Projeto e programação do Curso ou Declaração de Parceiros</li>
            <li>Anais, programação ou outros documentos de eventos</li>
            <li>Premiações</li>
            <li>Termo de outorga / PDI da Universidade</li>
          </ul>
        </div>
        <AttachmentsUploader
          templateId={template.id}
          initial={attachments.filter(a => !a.section)}
          readOnly={readOnly}
        />
      </div>

      {/* Bottom save button */}
      {!readOnly && (
        <div className="flex justify-end gap-3 pb-8">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      )}
    </div>
  )
}
