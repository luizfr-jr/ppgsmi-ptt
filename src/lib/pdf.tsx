// Layout D — Dossiê Científico PPGSMI
// @react-pdf/renderer — client-side only (import dynamically)
import {
  Document, Page, Text, View, StyleSheet, Image, Font, Svg, Circle, pdf,
} from '@react-pdf/renderer'
import { Template, Attachment } from '@/types'

// ─── Font registration (lazy, runs once in browser) ───────────────────────
let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  const o = typeof window !== 'undefined' ? window.location.origin : ''
  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${o}/fonts/inter-400.woff2`, fontWeight: 400 },
      { src: `${o}/fonts/inter-500.woff2`, fontWeight: 500 },
      { src: `${o}/fonts/inter-600.woff2`, fontWeight: 600 },
      { src: `${o}/fonts/inter-700.woff2`, fontWeight: 700 },
    ],
  })
  Font.register({
    family: 'SourceSerif4',
    fonts: [
      { src: `${o}/fonts/sourceserif4-400.woff2`,        fontWeight: 400 },
      { src: `${o}/fonts/sourceserif4-400-italic.woff2`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${o}/fonts/sourceserif4-600.woff2`,        fontWeight: 600 },
      { src: `${o}/fonts/sourceserif4-700.woff2`,        fontWeight: 700 },
    ],
  })
  Font.register({
    family: 'JetBrainsMono',
    fonts: [
      { src: `${o}/fonts/jetbrainsmono-400.woff2`, fontWeight: 400 },
      { src: `${o}/fonts/jetbrainsmono-600.woff2`, fontWeight: 600 },
      { src: `${o}/fonts/jetbrainsmono-700.woff2`, fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback(w => [w]) // disable hyphenation
  fontsRegistered = true
}

// ─── Brand colours (PPGSMI manual de marca) ───────────────────────────────
const C = {
  rose:       '#D43E5C',
  purple:     '#6B5EA0',
  teal:       '#6BB49D',
  coral:      '#E89A5C',
  roseSoft:   '#fbe8ee',
  purpleSoft: '#edeaf4',
  tealSoft:   '#e6f4ef',
  coralSoft:  '#fbeddb',
  ink:        '#1a1f3a',
  inkSoft:    '#3e4566',
  muted:      '#7a8098',
  rule:       '#e7e9f2',
  paper:      '#ffffff',
}

// ─── Label maps ───────────────────────────────────────────────────────────
const linhaLabels: Record<string, string> = {
  SAUDE_MATERNA: 'Atenção integral à saúde materna, neonatal e infantil',
  GESTAO_REDE:   'Organização e gestão da rede de atenção à saúde materno infantil',
}
const nivelLabels:         Record<string, string> = { ALTO:'Alto', MEDIO:'Médio', BAIXO:'Baixo' }
const demandaLabels:       Record<string, string> = { ESPONTANEO:'Espontânea', CONCORRENCIA:'Por concorrência', CONTRATADA:'Contratada' }
const objetivoLabels:      Record<string, string> = { EXPERIMENTAL:'Experimental', SOLUCAO_PROBLEMA:'Solução de um problema previamente identificado', SEM_FOCO:'Sem um foco de aplicação inicialmente definido' }
const tipoLabels:          Record<string, string> = { REAL:'Real', POTENCIAL:'Potencial' }
const boolLabels:          Record<string, string> = { SIM:'Sim', NAO:'Não' }
const abrangLabels:        Record<string, string> = { INTERNACIONAL:'Internacional', NACIONAL:'Nacional', REGIONAL:'Regional', LOCAL:'Local' }
const complexLabels:       Record<string, string> = { ALTA:'Alta', MEDIA:'Média', BAIXA:'Baixa' }
const inovacaoLabels:      Record<string, string> = { ALTO:'Alto teor inovativo', MEDIO:'Médio teor inovativo', BAIXO:'Baixo teor inovativo', SEM:'Sem Inovação' }
const estagioLabels:       Record<string, string> = { PILOTO:'Piloto/Protótipo', FINALIZADO:'Finalizado e implantado', TESTE:'Em teste' }
const fomentosLabels:      Record<string, string> = { FINANCIAMENTO:'Financiamento', COOPERACAO:'Cooperação' }
const areaLabels:          Record<string, string> = {
  ECONOMICO:'Econômico', SAUDE:'Saúde', ENSINO:'Ensino', SOCIAL:'Social',
  AMBIENTAL:'Ambiental', CIENTIFICO:'Científico', APRENDIZAGEM:'Aprendizagem', CULTURAL:'Cultural',
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const val  = (v: string | null | undefined) => v?.trim() || '—'
const look = (map: Record<string, string>, k: string | null | undefined) => (k && map[k]) ? map[k] : '—'
const parseJSON  = (s: string | null | undefined): string[] => { try { return JSON.parse(s || '[]') } catch { return [] } }
const fmtDateLong = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`
}
const fmtDateShort = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
const makeDocId = (iso: string | null | undefined) => {
  if (!iso) return 'DOC-PTT'
  const [y, m, d] = iso.split('-')
  return `DOC-${y}-${m}${d}-PTT`
}
const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
const fileExt = (name: string) => name.split('.').pop()?.toUpperCase() || 'ARQ'

// ─── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Page bases
  coverPageStyle:   { fontFamily: 'Inter', fontSize: 10, backgroundColor: C.paper, position: 'relative' },
  contentPageStyle: { fontFamily: 'Inter', fontSize: 10, backgroundColor: '#f9f9f7', position: 'relative' },
  closingPageStyle: { fontFamily: 'Inter', fontSize: 10, backgroundColor: C.paper, position: 'relative' },

  // ── Cover ──
  cover: { flexDirection: 'column', height: '100%', backgroundColor: C.paper },

  coverTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 52, paddingTop: 40, paddingBottom: 0,
  },
  ninmaLogo: { width: 160, height: 40, objectFit: 'contain' },
  chip: {
    fontSize: 7.5, letterSpacing: 1.5, fontWeight: 600, color: C.purple,
    borderWidth: 1.5, borderColor: C.purple, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 6,
  },

  coverBody: {
    flex: 1, paddingHorizontal: 52, justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 8, letterSpacing: 2.2, fontWeight: 700, color: C.coral,
    marginBottom: 18,
  },
  h1: {
    fontFamily: 'SourceSerif4', fontSize: 40, lineHeight: 1.05, fontWeight: 700,
    color: C.ink, marginBottom: 16, maxWidth: 440,
  },
  h1Accent: { color: C.purple },
  coverSub: {
    fontSize: 12, color: C.inkSoft, marginBottom: 36, lineHeight: 1.5,
  },

  coverFields: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderWidth: 1, borderColor: C.rule, borderRadius: 10,
    paddingHorizontal: 28, paddingVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    maxWidth: 500,
  },
  coverField:      { width: '50%', marginBottom: 18, paddingRight: 12 },
  coverFieldFull:  { width: '100%', marginBottom: 0, paddingRight: 0 },
  coverFieldLabel: {
    fontSize: 7.5, letterSpacing: 1.8, fontWeight: 700, color: C.muted,
    marginBottom: 4, textTransform: 'uppercase',
  },
  coverFieldValue: { fontSize: 11, fontWeight: 600, color: C.ink, lineHeight: 1.35 },
  coverFieldValueList: { fontSize: 10.5, fontWeight: 500, color: C.ink, lineHeight: 1.5 },

  coverFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 52, paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: C.rule,
  },
  coverFootText: { fontSize: 7.5, letterSpacing: 1, color: C.muted, fontFamily: 'JetBrainsMono' },
  dotBar: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 99 },

  // ── Content page chrome ──
  pg: {
    flexDirection: 'column', height: '100%',
    paddingHorizontal: 48, paddingTop: 44, paddingBottom: 48,
    backgroundColor: C.paper,
  },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.rule,
    marginBottom: 26,
  },
  headLogo:    { width: 72, height: 18, objectFit: 'contain' },
  headSection: {
    flex: 1, textAlign: 'center', fontSize: 7.5, letterSpacing: 1.8,
    color: C.muted, fontWeight: 600,
  },
  headPurple:  { color: C.purple },
  headDocId:   { fontFamily: 'JetBrainsMono', fontSize: 7.5, color: C.muted },

  foot: {
    marginTop: 'auto', paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.rule,
    flexDirection: 'row', alignItems: 'center',
  },
  footLeft:    { flex: 1, fontSize: 7.5, color: C.muted, fontFamily: 'JetBrainsMono' },
  footPageWrap:{ alignItems: 'center' },
  footPage:    { fontFamily: 'JetBrainsMono', fontWeight: 700, fontSize: 9, color: C.purple },
  footTotal:   { fontFamily: 'JetBrainsMono', fontSize: 9, color: C.muted },
  footRight:   { flex: 1, textAlign: 'right', fontSize: 7.5, color: C.muted, fontFamily: 'JetBrainsMono' },

  // ── Section title ──
  secTitle: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 20, paddingBottom: 10,
    borderBottomWidth: 2, borderBottomColor: C.purple,
  },
  badge: {
    fontSize: 7.5, letterSpacing: 1.2, fontWeight: 700, color: C.purple,
    backgroundColor: C.purpleSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4,
  },
  secH2: {
    fontFamily: 'SourceSerif4', fontSize: 16, fontWeight: 700,
    color: C.ink, letterSpacing: -0.3,
  },

  // ── Fields ──
  fields: { gap: 13 },
  field: { flexDirection: 'row', gap: 10 },
  fieldSub: { flexDirection: 'row', gap: 10, marginLeft: 0, opacity: 0.9 },

  fieldNBox: {
    width: 28, height: 28, backgroundColor: C.purpleSoft, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fieldNText: { fontFamily: 'JetBrainsMono', fontSize: 9.5, fontWeight: 700, color: C.purple },
  fieldSubArrow: {
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fieldSubArrowText: { fontSize: 11, color: C.muted },

  fieldBody:     { flex: 1, paddingBottom: 2 },
  fieldLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: 0.8, color: C.muted,
    marginBottom: 3, textTransform: 'uppercase',
  },
  fieldSubLabel: {
    fontSize: 9.5, fontStyle: 'italic', fontWeight: 500,
    color: C.inkSoft, marginBottom: 3,
  },
  fieldValue:    { fontSize: 10.5, lineHeight: 1.55, color: C.ink },
  fieldEmpty:    { fontSize: 10.5, lineHeight: 1.55, color: C.muted, fontStyle: 'italic' },
  fieldListItem: { fontSize: 10.5, lineHeight: 1.6, color: C.ink, marginBottom: 1 },

  // ── Impact page ──
  impactGrid:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  impactCard: {
    flex: 1, borderWidth: 1, borderColor: C.rule, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 11,
    backgroundColor: C.paper, position: 'relative', overflow: 'hidden',
  },
  impactCardAccent: {
    position: 'absolute', top: 0, left: 0,
    width: 26, height: 3, borderBottomRightRadius: 3,
  },
  impactCardN:   { fontFamily: 'JetBrainsMono', fontSize: 7.5, color: C.muted, marginBottom: 5, marginTop: 6 },
  impactCardLbl: {
    fontSize: 7, letterSpacing: 1.2, color: C.muted, fontWeight: 700,
    marginBottom: 6, lineHeight: 1.3, textTransform: 'uppercase',
  },
  impactCardVal: { fontSize: 11.5, fontWeight: 700, color: C.ink, lineHeight: 1.2 },
  impactDesc: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.purpleSoft, borderRadius: 8,
    marginBottom: 10, position: 'relative',
  },
  impactDescAccent: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3,
    backgroundColor: C.purple,
  },
  impactDescLbl: { fontSize: 9, fontWeight: 700, color: C.purple, marginBottom: 4, letterSpacing: 0.4 },
  impactDescVal: { fontSize: 10.5, lineHeight: 1.55, color: C.ink },

  // ── Annex page ──
  annexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  annexCard: {
    width: '47.5%', borderWidth: 1, borderColor: C.rule, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.paper,
  },
  annexThumb: {
    width: 48, height: 48, borderRadius: 7, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
    backgroundColor: C.coralSoft,
  },
  annexThumbAlt: { backgroundColor: C.tealSoft },
  annexThumbText: { fontSize: 8.5, fontWeight: 700, color: C.coral, letterSpacing: 0.5 },
  annexThumbTextAlt: { color: C.teal },
  annexCardBody: { flex: 1 },
  annexName: { fontSize: 10.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 },
  annexMeta: { fontFamily: 'JetBrainsMono', fontSize: 8, color: C.muted, marginTop: 3 },

  // ── Closing page ──
  closing: { flexDirection: 'column', height: '100%', backgroundColor: C.paper },
  closingBody: {
    flex: 1, paddingHorizontal: 66, paddingTop: 64, paddingBottom: 32,
    alignItems: 'center',
  },
  ppgsmiLogoWrap: { marginBottom: 32, alignItems: 'center' },
  ppgsmiLogo:     { width: 130, height: 175, objectFit: 'contain' },

  quoteWrap:  { maxWidth: 430, marginBottom: 36, alignItems: 'center' },
  quoteMark: {
    fontFamily: 'SourceSerif4', fontSize: 80, lineHeight: 0.7,
    color: C.rose, fontWeight: 700, opacity: 0.35, marginBottom: -14, alignSelf: 'flex-start',
  },
  quoteText: {
    fontFamily: 'SourceSerif4', fontSize: 15, lineHeight: 1.5,
    color: C.ink, fontStyle: 'italic', fontWeight: 400, textAlign: 'center',
  },

  creditsWrap: { marginBottom: 32, maxWidth: 400, alignItems: 'center' },
  crLabel: {
    fontSize: 8, letterSpacing: 2, color: C.muted, fontWeight: 600,
    marginBottom: 8, textAlign: 'center',
  },
  crName: {
    fontSize: 14, fontWeight: 700, color: C.rose, textAlign: 'center',
    marginBottom: 4, lineHeight: 1.25,
  },
  crSub: { fontSize: 10, color: C.inkSoft, textAlign: 'center' },

  sealWrap:   { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 340, width: '100%', marginBottom: 28 },
  sealLine:   { flex: 1, height: 1, backgroundColor: C.rose, opacity: 0.35 },
  sealText:   {
    fontSize: 7.5, letterSpacing: 1.5, color: C.inkSoft, fontWeight: 600,
    textAlign: 'center', lineHeight: 1.6,
  },

  toolsRow:   {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, borderColor: C.rule, borderRadius: 999,
  },
  toolsLabel: { fontSize: 7.5, letterSpacing: 1.5, color: C.muted, fontWeight: 600 },
  toolLogo:   { width: 60, height: 15, objectFit: 'contain' },

  closingFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 52, paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: C.rule,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  closingFootText: { fontFamily: 'JetBrainsMono', fontSize: 8, color: C.muted },
})

// ─── Arc SVG (cover + closing) ────────────────────────────────────────────
function CoverArc() {
  const dots = Array.from({ length: 36 }).map((_, i) => {
    const t = i / 35
    const angle = Math.PI * (0.15 + t * 0.85)
    const cx = 260, cy = 260, r = 220
    const x = cx + r * Math.cos(angle + Math.PI)
    const y = cy + r * Math.sin(angle + Math.PI)
    const color = t < 0.35 ? '#6BB49D' : t < 0.85 ? '#E89A5C' : '#D43E5C'
    const size = (3 + t * 4)
    return { x, y, color, size, key: i }
  })
  return (
    <Svg viewBox="0 0 520 520" style={{ position: 'absolute', top: 140, right: -100, width: 400, height: 400, opacity: 0.85 }}>
      {dots.map(d => <Circle key={d.key} cx={d.x} cy={d.y} r={d.size} fill={d.color} opacity={0.9} />)}
    </Svg>
  )
}

function ClosingArc() {
  const dots = Array.from({ length: 40 }).map((_, i) => {
    const t = i / 39
    const angle = Math.PI * (0.1 + t * 1.0)
    const cx = 300, cy = 300, r = 260
    const x = cx + r * Math.cos(angle + Math.PI)
    const y = cy + r * Math.sin(angle + Math.PI)
    const color = t < 0.25 ? '#6BB49D' : t < 0.55 ? '#D43E5C' : t < 0.8 ? '#6B5EA0' : '#E89A5C'
    const size = 3 + t * 4
    return { x, y, color, size, key: i }
  })
  return (
    <Svg viewBox="0 0 600 600" style={{ position: 'absolute', top: '50%', left: '50%', width: 500, height: 500, marginTop: -300, marginLeft: -270, opacity: 0.55 }}>
      {dots.map(d => <Circle key={d.key} cx={d.x} cy={d.y} r={d.size} fill={d.color} opacity={0.85} />)}
    </Svg>
  )
}

// ─── Shared chrome ────────────────────────────────────────────────────────
function Head({ section, docId, origin }: { section: string; docId: string; origin: string }) {
  return (
    <View style={s.head}>
      <Image src={`${origin}/ninmahub-logo.png`} style={s.headLogo} />
      <Text style={s.headSection}><Text style={s.headPurple}>·</Text> {section.toUpperCase()}</Text>
      <Text style={s.headDocId}>{docId}</Text>
    </View>
  )
}

function Foot({ page, total, date }: { page: number; total: number; date: string }) {
  return (
    <View style={s.foot}>
      <Text style={s.footLeft}>NinMaHub · PPGSMI · UFN</Text>
      <View style={s.footPageWrap}>
        <Text style={s.footPage}>{String(page).padStart(2, '0')}<Text style={s.footTotal}> / {String(total).padStart(2, '0')}</Text></Text>
      </View>
      <Text style={s.footRight}>{date}</Text>
    </View>
  )
}

// ─── Field component ──────────────────────────────────────────────────────
interface FieldItem {
  n: number
  label: string
  value: string | string[]
  sub?: boolean
  list?: boolean
  empty?: boolean
}

function Field({ item }: { item: FieldItem }) {
  const isEmpty = !item.value || item.value === '—' || (Array.isArray(item.value) && item.value.length === 0)
  if (item.sub) {
    return (
      <View style={s.fieldSub}>
        <View style={s.fieldSubArrow}><Text style={s.fieldSubArrowText}>↳</Text></View>
        <View style={s.fieldBody}>
          <Text style={s.fieldSubLabel}>{item.label}</Text>
          <Text style={isEmpty ? s.fieldEmpty : s.fieldValue}>
            {isEmpty ? '—' : String(item.value)}
          </Text>
        </View>
      </View>
    )
  }
  return (
    <View style={s.field}>
      <View style={s.fieldNBox}>
        <Text style={s.fieldNText}>{String(item.n).padStart(2, '0')}</Text>
      </View>
      <View style={s.fieldBody}>
        <Text style={s.fieldLabel}>{item.label.toUpperCase()}</Text>
        {item.list && Array.isArray(item.value) ? (
          <View>
            {item.value.map((v, i) => (
              <Text key={i} style={s.fieldListItem}>• {v}</Text>
            ))}
          </View>
        ) : (
          <Text style={isEmpty ? s.fieldEmpty : s.fieldValue}>
            {isEmpty ? '—' : String(item.value)}
          </Text>
        )}
      </View>
    </View>
  )
}

// ─── Data mapping (Template → Layout D format) ────────────────────────────
interface DocData {
  meta:    { date: string; docId: string; dateShort: string }
  cover:   { aluno: string; orientador: string; banca: string[]; data: string }
  prodP1:  FieldItem[]
  prodP2:  FieldItem[]
  impact:  { cards: FieldItem[]; descs: FieldItem[] }
  charP1:  FieldItem[]
  charP2:  FieldItem[]
  annexes: { name: string; ext: string; meta: string; isEven: boolean }[]
}

function buildDocData(template: Template, attachments: Attachment[]): DocData {
  const areas = parseJSON(template.impactoArea).map(k => areaLabels[k] || k)
  const setores = parseJSON(template.setorBeneficiado)
  const isoDate = template.data || new Date().toISOString().split('T')[0]

  // All field items
  const prodFields: FieldItem[] = [
    { n: 1, label: 'Título do Produto (Português)', value: val(template.tituloPt) },
    { n: 1, label: 'Título do Produto (Inglês)',    value: val(template.tituloEn), sub: true },
    { n: 2, label: 'Linha de Pesquisa',             value: look(linhaLabels, template.linhaPesquisa) },
    { n: 3, label: 'Participação de discente/egresso/docente e participante externo', value: val(template.participantes) },
    { n: 4, label: 'Objetivo do Produto Técnico-Tecnológico', value: val(template.objetivo) },
    { n: 5, label: 'Finalidade do Produto Técnico-Tecnológico', value: val(template.finalidade) },
    { n: 6, label: 'Referencial teórico e metodológico', value: val(template.referencialTeorico) },
    { n: 7, label: 'Descrição do Produto Técnico-Tecnológico', value: val(template.descricaoProduto) },
    { n: 8, label: 'Relevância científica, tecnológica, social e de inovação', value: val(template.relevancia) },
    { n: 9, label: 'Observações', value: val(template.observacoes) },
  ]
  const prodP1 = prodFields.filter(f => f.n <= 5)
  const prodP2 = prodFields.filter(f => f.n >= 6 && f.n <= 9)

  // Impact
  const impactCards: FieldItem[] = [
    { n: 10, label: 'Nível',          value: look(nivelLabels, template.impactoNivel) },
    { n: 11, label: 'Demanda',        value: look(demandaLabels, template.impactoDemanda) },
    { n: 12, label: 'Objetivo',       value: look(objetivoLabels, template.impactoObjetivo) },
    { n: 13, label: 'Área Impactada', value: areas.length > 0 ? areas.join(', ') : '—' },
    { n: 14, label: 'Tipo',           value: look(tipoLabels, template.impactoTipo) },
  ]
  const impactDescs: FieldItem[] = []
  if (template.impactoTipoDesc) {
    impactDescs.push({ n: 14, label: 'Descrição do Tipo de Impacto', value: val(template.impactoTipoDesc), sub: true })
  }

  // Characteristics P1: 15-19
  const charP1: FieldItem[] = [
    { n: 15, label: 'Replicabilidade',        value: look(boolLabels, template.replicabilidade) },
    ...(template.replicabilidadeDesc ? [{ n: 15, label: 'Descrição da Replicabilidade', value: val(template.replicabilidadeDesc), sub: true }] : []),
    { n: 16, label: 'Abrangência territorial', value: look(abrangLabels, template.abrangencia) },
    { n: 17, label: 'Complexidade',           value: look(complexLabels, template.complexidade) },
    ...(template.complexidadeDesc ? [{ n: 17, label: 'Descrição da Complexidade', value: val(template.complexidadeDesc), sub: true }] : []),
    { n: 18, label: 'Inovação',               value: look(inovacaoLabels, template.inovacao) },
    ...(template.inovacaoDesc ? [{ n: 18, label: 'Descrição da Inovação', value: val(template.inovacaoDesc), sub: true }] : []),
    { n: 19, label: 'Setor da sociedade beneficiado', value: setores.length > 0 ? setores : ['—'], list: setores.length > 0 },
  ]

  // Characteristics P2: 20-26
  const charP2: FieldItem[] = [
    { n: 20, label: 'Vínculo com o PDI',      value: look(boolLabels, template.vinculoPDI) },
    { n: 21, label: 'Fomento',                value: look(fomentosLabels, template.fomento) },
    ...(template.fomentoCodigo ? [{ n: 21, label: 'Código do projeto', value: val(template.fomentoCodigo), sub: true }] : []),
    { n: 22, label: 'Registro/depósito de propriedade intelectual', value: val(template.propriedadeIntelectual) },
    { n: 23, label: 'Estágio da tecnologia',  value: look({ PILOTO:'Piloto/Protótipo', FINALIZADO:'Finalizado e implantado', TESTE:'Em teste' }, template.estagioTecnologia) },
    { n: 24, label: 'Transferência de tecnologia/conhecimento', value: look(boolLabels, template.transferenciaConhecimento) },
    { n: 25, label: 'URL do Produto',         value: val(template.urlProduto) },
    { n: 26, label: 'Divulgação',             value: val(template.divulgacao) },
  ]

  // Annexes (all attachments)
  const annexes = attachments.map((a, i) => ({
    name: a.originalName,
    ext:  fileExt(a.originalName),
    meta: `${a.mimeType.split('/')[1]?.toUpperCase() || fileExt(a.originalName)} · ${fmtSize(a.size)}`,
    isEven: i % 2 === 1,
  }))

  // Banca
  const bancaRaw = template.bancaAvaliadora || ''
  const banca = bancaRaw.trim() ? bancaRaw.split('\n').map(l => l.trim()).filter(Boolean) : ['—']

  return {
    meta:   { date: fmtDateLong(isoDate), docId: makeDocId(isoDate), dateShort: fmtDateShort(isoDate) },
    cover:  { aluno: val(template.aluno), orientador: val(template.orientador), banca, data: isoDate },
    prodP1, prodP2,
    impact: { cards: impactCards, descs: impactDescs },
    charP1, charP2,
    annexes,
  }
}

// ─── PDF Document (8 pages) ───────────────────────────────────────────────
function LayoutDDocument({ doc, origin }: { doc: DocData; origin: string }) {
  const TOTAL = 8
  const { meta, cover } = doc

  return (
    <Document title="Produto Técnico-Tecnológico — PPGSMI" author="NinMaHub">

      {/* ── 01 CAPA ── */}
      <Page size="A4" style={s.coverPageStyle}>
        <View style={s.cover}>
          {/* Decorative arc */}
          <CoverArc />

          {/* Top row: logo + chip */}
          <View style={s.coverTop}>
            <Image src={`${origin}/ninmahub-logo.png`} style={s.ninmaLogo} />
            <Text style={s.chip}>PRODUTO TÉCNICO-TECNOLÓGICO</Text>
          </View>

          {/* Body */}
          <View style={s.coverBody}>
            <Text style={s.eyebrow}>PPGSMI · DOCUMENTO OFICIAL / {cover.data.split('-')[0]}</Text>
            <Text style={s.h1}>
              Programa de Pós-Graduação em{'\n'}
              <Text style={s.h1Accent}>Saúde Materno Infantil</Text>
            </Text>
            <Text style={s.coverSub}>Universidade Franciscana</Text>

            <View style={s.coverFields}>
              <View style={s.coverField}>
                <Text style={s.coverFieldLabel}>Aluno</Text>
                <Text style={s.coverFieldValue}>{cover.aluno}</Text>
              </View>
              <View style={s.coverField}>
                <Text style={s.coverFieldLabel}>Orientador</Text>
                <Text style={s.coverFieldValue}>{cover.orientador}</Text>
              </View>
              <View style={[s.coverField, { width: '100%', marginBottom: 0 }]}>
                <Text style={s.coverFieldLabel}>Banca Avaliadora</Text>
                {cover.banca.map((b, i) => (
                  <Text key={i} style={s.coverFieldValueList}>{b}</Text>
                ))}
              </View>
              <View style={[s.coverField, { width: '100%', marginBottom: 0, marginTop: 10 }]}>
                <Text style={s.coverFieldLabel}>Data de submissão</Text>
                <Text style={s.coverFieldValue}>{fmtDateLong(cover.data)}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={s.coverFoot}>
            <Text style={s.coverFootText}> </Text>
            <View style={s.dotBar}>
              {['#6BB49D','#E89A5C','#D43E5C','#6B5EA0'].map((c, i) => (
                <View key={i} style={[s.dot, { backgroundColor: c }]} />
              ))}
            </View>
            <Text style={s.coverFootText}>{meta.docId}</Text>
          </View>
        </View>
      </Page>

      {/* ── 02 PRODUTO PARTE 1 (campos 1–5) ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Produto Técnico-Tecnológico" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 01 · IDENTIFICAÇÃO</Text>
            <Text style={s.secH2}>Identificação e objetivos do produto</Text>
          </View>
          <View style={s.fields}>
            {doc.prodP1.map((item, i) => <Field key={i} item={item} />)}
          </View>
          <Foot page={2} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 03 PRODUTO PARTE 2 (campos 6–9) ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Produto Técnico-Tecnológico" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 02 · DESCRIÇÃO</Text>
            <Text style={s.secH2}>Fundamentação e descrição do produto</Text>
          </View>
          <View style={s.fields}>
            {doc.prodP2.map((item, i) => <Field key={i} item={item} />)}
          </View>
          <Foot page={3} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 04 IMPACTO (campos 10–14) ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Impacto" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 03 · IMPACTO</Text>
            <Text style={s.secH2}>Análise de impacto do produto</Text>
          </View>

          {/* Impact cards grid */}
          <View style={s.impactGrid}>
            {doc.impact.cards.map((card, i) => {
              const accentColors = [C.purple, C.coral, C.teal, C.rose, C.purple]
              return (
                <View key={i} style={s.impactCard}>
                  <View style={[s.impactCardAccent, { backgroundColor: accentColors[i] }]} />
                  <Text style={s.impactCardN}>#{String(card.n).padStart(2, '0')}</Text>
                  <Text style={s.impactCardLbl}>{card.label.replace('Impacto – ', '').toUpperCase()}</Text>
                  <Text style={s.impactCardVal}>{String(card.value)}</Text>
                </View>
              )
            })}
          </View>

          {/* Sub-field descriptions */}
          {doc.impact.descs.map((desc, i) => (
            <View key={i} style={s.impactDesc}>
              <View style={s.impactDescAccent} />
              <Text style={s.impactDescLbl}>{desc.label}</Text>
              <Text style={s.impactDescVal}>{String(desc.value)}</Text>
            </View>
          ))}

          <Foot page={4} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 05 CARACTERÍSTICAS PARTE 1 (campos 15–19) ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Características" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 04 · CARACTERÍSTICAS</Text>
            <Text style={s.secH2}>Características operacionais</Text>
          </View>
          <View style={s.fields}>
            {doc.charP1.map((item, i) => <Field key={i} item={item} />)}
          </View>
          <Foot page={5} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 06 CARACTERÍSTICAS PARTE 2 (campos 20–26) ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Características" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 05 · VÍNCULOS</Text>
            <Text style={s.secH2}>Vínculos, fomento e divulgação</Text>
          </View>
          <View style={s.fields}>
            {doc.charP2.map((item, i) => <Field key={i} item={item} />)}
          </View>
          <Foot page={6} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 07 ANEXOS ── */}
      <Page size="A4" style={s.contentPageStyle}>
        <View style={s.pg}>
          <Head section="Anexos" docId={meta.docId} origin={origin} />
          <View style={s.secTitle}>
            <Text style={s.badge}>ANEXOS</Text>
            <Text style={s.secH2}>Documentos e arquivos vinculados</Text>
          </View>

          {doc.annexes.length === 0 ? (
            <Text style={s.fieldEmpty}>Nenhum arquivo anexado.</Text>
          ) : (
            <View style={s.annexGrid}>
              {doc.annexes.map((a, i) => (
                <View key={i} style={s.annexCard}>
                  <View style={[s.annexThumb, a.isEven ? s.annexThumbAlt : {}]}>
                    <Text style={[s.annexThumbText, a.isEven ? s.annexThumbTextAlt : {}]}>{a.ext}</Text>
                  </View>
                  <View style={s.annexCardBody}>
                    <Text style={s.annexName}>{a.name}</Text>
                    <Text style={s.annexMeta}>{a.meta}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Foot page={7} total={TOTAL} date={meta.dateShort} />
        </View>
      </Page>

      {/* ── 08 ENCERRAMENTO ── */}
      <Page size="A4" style={s.closingPageStyle}>
        <View style={s.closing}>
          <ClosingArc />

          <View style={s.closingBody}>
            {/* PPGSMI official logo */}
            <View style={s.ppgsmiLogoWrap}>
              <Image src={`${origin}/ppgsmi-logo.png`} style={s.ppgsmiLogo} />
            </View>

            {/* Quote */}
            <View style={s.quoteWrap}>
              <Text style={s.quoteMark}>"</Text>
              <Text style={s.quoteText}>
                Cuidar da mãe e da criança é cuidar do futuro. Cada produto técnico-tecnológico nasce da pesquisa, mas se realiza quando chega à vida real de quem precisa.
              </Text>
            </View>

            {/* Credits */}
            <View style={s.creditsWrap}>
              <Text style={s.crLabel}>ESTE DOCUMENTO FOI PRODUZIDO NO ÂMBITO DO</Text>
              <Text style={s.crName}>Programa de Pós-Graduação em Saúde Materno Infantil</Text>
              <Text style={s.crSub}>Mestrado e Doutorado · Universidade Franciscana</Text>
            </View>

            {/* Seal */}
            <View style={s.sealWrap}>
              <View style={s.sealLine} />
              <View style={{ alignItems: 'center' }}>
                <Text style={s.sealText}>Em conformidade com as diretrizes</Text>
                <Text style={s.sealText}>do PPGSMI · UFN</Text>
              </View>
              <View style={s.sealLine} />
            </View>

            {/* "Gerado por NinMaHub" pill */}
            <View style={s.toolsRow}>
              <Text style={s.toolsLabel}>GERADO POR</Text>
              <Image src={`${origin}/ninmahub-logo.png`} style={s.toolLogo} />
            </View>
          </View>

          {/* Footer */}
          <View style={s.closingFoot}>
            <Text style={s.closingFootText}>{meta.docId}</Text>
            <Text style={s.closingFootText}>Página 08 / 08 · {meta.dateShort}</Text>
          </View>
        </View>
      </Page>

    </Document>
  )
}

// ─── Public entry point ───────────────────────────────────────────────────
export async function generateTemplatePDF(template: Template, attachments: Attachment[] = []) {
  ensureFonts()

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const doc = buildDocData(template, attachments)

  const element = <LayoutDDocument doc={doc} origin={origin} />
  const blob = await pdf(element).toBlob()

  const safeName = (template.tituloPt || 'template').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)
  const filename = `PTT_PPGSMI_${safeName}_${doc.meta.docId}.pdf`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
