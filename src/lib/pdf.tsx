import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer'
import { Template } from '@/types'

// Note: @react-pdf/renderer is client-side only
// This file should only be imported dynamically

const colors = {
  teal: '#5fc3ad',
  purple: '#756fb3',
  orange: '#f9a870',
  pink: '#f05a72',
  dark: '#1e1e2e',
  gray: '#6b7280',
  lightBg: '#f8fafc',
  tealLight: '#d4f0ea',
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.dark,
    backgroundColor: colors.white,
  },
  coverPage: {
    flex: 1,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  coverLogo: {
    width: 120,
    height: 48,
    marginBottom: 32,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
  },
  coverTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  coverUniversity: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  coverProgram: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  coverBadge: {
    backgroundColor: colors.purple,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 40,
  },
  coverBadgeText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  coverGrid: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 20,
  },
  coverGridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  coverFieldLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  coverFieldValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  contentPage: {
    padding: 50,
    paddingTop: 40,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.teal,
  },
  pageHeaderText: {
    fontSize: 7,
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fieldNumberText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  fieldTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    flex: 1,
  },
  fieldValue: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.6,
    backgroundColor: colors.lightBg,
    borderRadius: 6,
    padding: 10,
    marginLeft: 28,
  },
  fieldValueEmpty: {
    fontSize: 9,
    color: '#9ca3af',
    fontStyle: 'italic',
    backgroundColor: colors.lightBg,
    borderRadius: 6,
    padding: 10,
    marginLeft: 28,
  },
  radioSelected: {
    fontSize: 9,
    color: colors.teal,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: colors.tealLight,
    borderRadius: 6,
    padding: 10,
    marginLeft: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: colors.gray,
  },
  footerLine: {
    height: 1,
    backgroundColor: colors.teal,
    marginBottom: 6,
  },
})

function FieldSection({ num, title, value, type = 'text' }: {
  num: number | string
  title: string
  value: string | null | undefined
  type?: 'text' | 'radio'
}) {
  return (
    <View style={styles.fieldSection}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldNumber}>
          <Text style={styles.fieldNumberText}>{num}</Text>
        </View>
        <Text style={styles.fieldTitle}>{title}</Text>
      </View>
      {value ? (
        <Text style={type === 'radio' ? styles.radioSelected : styles.fieldValue}>
          {value}
        </Text>
      ) : (
        <Text style={styles.fieldValueEmpty}>Não informado</Text>
      )}
    </View>
  )
}

const nivelLabels: Record<string, string> = { ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' }
const demandaLabels: Record<string, string> = { ESPONTANEO: 'Espontânea', CONCORRENCIA: 'Por concorrência', CONTRATADA: 'Contratada' }
const objetivoLabels: Record<string, string> = { EXPERIMENTAL: 'Experimental', SOLUCAO_PROBLEMA: 'Solução de um problema previamente identificado', SEM_FOCO: 'Sem um foco de aplicação inicialmente definido' }
const tipoLabels: Record<string, string> = { REAL: 'Real', POTENCIAL: 'Potencial' }
const repLabels: Record<string, string> = { SIM: 'Sim', NAO: 'Não' }
const abrangLabels: Record<string, string> = { INTERNACIONAL: 'Internacional', NACIONAL: 'Nacional', REGIONAL: 'Regional', LOCAL: 'Local' }
const complexLabels: Record<string, string> = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' }
const inovacaoLabels: Record<string, string> = { ALTO: 'Alto teor inovativo', MEDIO: 'Médio teor inovativo', BAIXO: 'Baixo teor inovativo', SEM: 'Sem Inovação' }
const estagioLabels: Record<string, string> = { PILOTO: 'Piloto/Protótipo', FINALIZADO: 'Finalizado e implantado', TESTE: 'Em teste' }
const fomentosLabels: Record<string, string> = { FINANCIAMENTO: 'Financiamento', COOPERACAO: 'Cooperação' }
const linhaLabels: Record<string, string> = {
  SAUDE_MATERNA: 'Atenção integral à saúde materna, neonatal e infantil',
  GESTAO_REDE: 'Organização e gestão da rede de atenção à saúde materno infantil',
}

const areaLabels: Record<string, string> = {
  ECONOMICO: 'Econômico', SAUDE: 'Saúde', ENSINO: 'Ensino', SOCIAL: 'Social',
  AMBIENTAL: 'Ambiental', CIENTIFICO: 'Científico', APRENDIZAGEM: 'Aprendizagem', CULTURAL: 'Cultural',
}

function parseJSON(val: string | null | undefined): string[] {
  try { return JSON.parse(val || '[]') } catch { return [] }
}

function TemplatePDFDocument({ template }: { template: Template }) {
  const impactoAreas = parseJSON(template.impactoArea).map(v => areaLabels[v] || v).join(', ')
  const setores = parseJSON(template.setorBeneficiado)

  return (
    <Document title={template.tituloPt || 'Template PPGSMI'} author="PPGSMI – NinMaHub">
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>NinMaHub</Text>
          <Text style={styles.coverUniversity}>Universidade Franciscana</Text>
          <Text style={styles.coverProgram}>
            Programa de Pós-Graduação em{'\n'}Saúde Materno Infantil
          </Text>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>Produto Técnico-Tecnológico</Text>
          </View>

          <View style={styles.coverGrid}>
            <View style={styles.coverGridRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.coverFieldLabel}>Aluno</Text>
                <Text style={styles.coverFieldValue}>{template.aluno || '—'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coverFieldLabel}>Orientador</Text>
                <Text style={styles.coverFieldValue}>{template.orientador || '—'}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.coverFieldLabel}>Banca Avaliadora</Text>
              <Text style={styles.coverFieldValue}>{template.bancaAvaliadora || '—'}</Text>
            </View>
            {template.data && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.coverFieldLabel}>Data</Text>
                <Text style={styles.coverFieldValue}>{template.data}</Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderText}>PPGSMI – Universidade Franciscana</Text>
          <Text style={styles.pageHeaderText}>Produto Técnico-Tecnológico</Text>
        </View>

        <FieldSection num={1} title="Título do Produto (Português)" value={template.tituloPt} />
        <FieldSection num="" title="Título do Produto (Inglês)" value={template.tituloEn} />
        <FieldSection num={2} title="Linha de Pesquisa" value={template.linhaPesquisa ? linhaLabels[template.linhaPesquisa] : null} type="radio" />
        <FieldSection num={3} title="Participação de discente/egresso/docente e participante externo" value={template.participantes} />
        <FieldSection num={4} title="Objetivo do Produto Técnico-Tecnológico" value={template.objetivo} />
        <FieldSection num={5} title="Finalidade do Produto Técnico-Tecnológico" value={template.finalidade} />

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>NinMaHub – PPGSMI – Universidade Franciscana</Text>
          </View>
          <Text style={[styles.footerText, { marginLeft: 20 }]}>1</Text>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderText}>PPGSMI – Universidade Franciscana</Text>
          <Text style={styles.pageHeaderText}>Produto Técnico-Tecnológico</Text>
        </View>

        <FieldSection num={6} title="Referencial teórico e metodológico" value={template.referencialTeorico} />
        <FieldSection num={7} title="Descrição do Produto Técnico-Tecnológico" value={template.descricaoProduto} />
        <FieldSection num={8} title="Relevância científica, tecnológica, social e de inovação" value={template.relevancia} />
        <FieldSection num={9} title="Observações" value={template.observacoes} />

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>NinMaHub – PPGSMI – Universidade Franciscana</Text>
          </View>
          <Text style={[styles.footerText, { marginLeft: 20 }]}>2</Text>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderText}>PPGSMI – Universidade Franciscana</Text>
          <Text style={styles.pageHeaderText}>Impacto</Text>
        </View>

        <FieldSection num={10} title="Impacto – Nível" value={template.impactoNivel ? nivelLabels[template.impactoNivel] : null} type="radio" />
        <FieldSection num={11} title="Impacto – Demanda" value={template.impactoDemanda ? demandaLabels[template.impactoDemanda] : null} type="radio" />
        <FieldSection num={12} title="Impacto – Objetivo" value={template.impactoObjetivo ? objetivoLabels[template.impactoObjetivo] : null} type="radio" />
        <FieldSection num={13} title="Impacto – Área Impactada" value={impactoAreas || null} type="radio" />
        <FieldSection num={14} title="Impacto – Tipo" value={template.impactoTipo ? tipoLabels[template.impactoTipo] : null} type="radio" />
        {template.impactoTipoDesc && <FieldSection num="" title="Descrição do Tipo de Impacto" value={template.impactoTipoDesc} />}
        <FieldSection num={15} title="Replicabilidade" value={template.replicabilidade ? repLabels[template.replicabilidade] : null} type="radio" />
        {template.replicabilidadeDesc && <FieldSection num="" title="Descrição da Replicabilidade" value={template.replicabilidadeDesc} />}
        <FieldSection num={16} title="Abrangência territorial" value={template.abrangencia ? abrangLabels[template.abrangencia] : null} type="radio" />

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>NinMaHub – PPGSMI – Universidade Franciscana</Text>
          </View>
          <Text style={[styles.footerText, { marginLeft: 20 }]}>3</Text>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, styles.contentPage]}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageHeaderText}>PPGSMI – Universidade Franciscana</Text>
          <Text style={styles.pageHeaderText}>Características e Informações Adicionais</Text>
        </View>

        <FieldSection num={17} title="Complexidade" value={template.complexidade ? complexLabels[template.complexidade] : null} type="radio" />
        {template.complexidadeDesc && <FieldSection num="" title="Descrição da Complexidade" value={template.complexidadeDesc} />}
        <FieldSection num={18} title="Inovação" value={template.inovacao ? inovacaoLabels[template.inovacao] : null} type="radio" />
        {template.inovacaoDesc && <FieldSection num="" title="Descrição da Inovação" value={template.inovacaoDesc} />}

        {setores.length > 0 && (
          <View style={styles.fieldSection}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldNumber}>
                <Text style={styles.fieldNumberText}>19</Text>
              </View>
              <Text style={styles.fieldTitle}>Setor da sociedade beneficiado</Text>
            </View>
            {setores.map((s, i) => (
              <Text key={i} style={[styles.fieldValue, { marginBottom: 2 }]}>• {s}</Text>
            ))}
          </View>
        )}

        <FieldSection num={20} title="Vínculo com o PDI" value={template.vinculoPDI ? repLabels[template.vinculoPDI] : null} type="radio" />
        <FieldSection num={21} title="Fomento" value={template.fomento ? fomentosLabels[template.fomento] : null} type="radio" />
        {template.fomentoCodigo && <FieldSection num="" title="Código do projeto" value={template.fomentoCodigo} />}
        <FieldSection num={22} title="Registro/depósito de propriedade intelectual" value={template.propriedadeIntelectual} />
        <FieldSection num={23} title="Estágio da tecnologia" value={template.estagioTecnologia ? estagioLabels[template.estagioTecnologia] : null} type="radio" />
        <FieldSection num={24} title="Transferência de tecnologia/conhecimento" value={template.transferenciaConhecimento ? repLabels[template.transferenciaConhecimento] : null} type="radio" />
        <FieldSection num={25} title="URL do Produto Técnico-Tecnológico" value={template.urlProduto} />
        <FieldSection num={26} title="Divulgação" value={template.divulgacao} />
        <FieldSection num={27} title="Anexos" value={template.anexosDesc} />

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>NinMaHub – PPGSMI – Universidade Franciscana</Text>
          </View>
          <Text style={[styles.footerText, { marginLeft: 20 }]}>4</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateTemplatePDF(template: Template) {
  const doc = <TemplatePDFDocument template={template} />
  const blob = await pdf(doc).toBlob()
  const filename = `PPGSMI_${(template.tituloPt || 'template').replace(/\s+/g, '_').slice(0, 50)}_${new Date().getFullYear()}.pdf`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
