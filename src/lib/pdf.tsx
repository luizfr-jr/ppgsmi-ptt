// Layout D — Dossiê Científico PPGSMI
// Implementado seguindo o RECIPES.md do handoff (nova versão com PNG backgrounds)
// @react-pdf/renderer — client-side only (import dynamicamente)
import {
  Document, Page, Text, View, StyleSheet, Image, Font, Link,
  Svg, Circle, Defs, LinearGradient, Stop, Rect,
  pdf,
} from '@react-pdf/renderer'
import { Template, Attachment } from '@/types'

// ─── Font registration (lazy, runs once in browser) ───────────────────────
let fontsRegistered = false
function ensureFonts() {
  if (fontsRegistered) return
  try {
    const o = typeof window !== 'undefined' ? window.location.origin : ''
    Font.register({
      family: 'Inter',
      fonts: [
        { src: `${o}/fonts/inter-400.ttf`, fontWeight: 400 },
        { src: `${o}/fonts/inter-400-italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
        { src: `${o}/fonts/inter-500.ttf`, fontWeight: 500 },
        { src: `${o}/fonts/inter-500-italic.ttf`, fontWeight: 500, fontStyle: 'italic' },
        { src: `${o}/fonts/inter-600.ttf`, fontWeight: 600 },
        { src: `${o}/fonts/inter-600.ttf`, fontWeight: 600, fontStyle: 'italic' },
        { src: `${o}/fonts/inter-700.ttf`, fontWeight: 700 },
        { src: `${o}/fonts/inter-700.ttf`, fontWeight: 700, fontStyle: 'italic' },
      ],
    })
    Font.register({
      family: 'SourceSerif4',
      fonts: [
        { src: `${o}/fonts/sourceserif4-400.ttf`,        fontWeight: 400 },
        { src: `${o}/fonts/sourceserif4-400-italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
        { src: `${o}/fonts/sourceserif4-600.ttf`,        fontWeight: 600 },
        { src: `${o}/fonts/sourceserif4-700.ttf`,        fontWeight: 700 },
      ],
    })
    Font.register({
      family: 'JetBrainsMono',
      fonts: [
        { src: `${o}/fonts/jetbrainsmono-400.ttf`, fontWeight: 400 },
        { src: `${o}/fonts/jetbrainsmono-600.ttf`, fontWeight: 600 },
        { src: `${o}/fonts/jetbrainsmono-700.ttf`, fontWeight: 700 },
      ],
    })
    Font.registerHyphenationCallback(w => [w])
    fontsRegistered = true
  } catch (err) {
    console.warn('[pdf] Font registration failed, using built-in fonts', err)
    fontsRegistered = true
  }
}

// ─── Pre-fetch image as data URL ──────────────────────────────────────────
async function fetchDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// ─── Brand colours ────────────────────────────────────────────────────────
const C = {
  rose:       '#D43E5C',
  purple:     '#6B5EA0',
  teal:       '#6BB49D',
  coral:      '#E89A5C',
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
const linhaLabels:    Record<string,string> = { SAUDE_MATERNA:'Atenção integral à saúde materna, neonatal e infantil', GESTAO_REDE:'Organização e gestão da rede de atenção à saúde materno infantil' }
const nivelLabels:    Record<string,string> = { ALTO:'Alto', MEDIO:'Médio', BAIXO:'Baixo' }
const demandaLabels:  Record<string,string> = { ESPONTANEO:'Espontânea', CONCORRENCIA:'Por concorrência', CONTRATADA:'Contratada' }
const objetivoLabels: Record<string,string> = { EXPERIMENTAL:'Experimental', SOLUCAO_PROBLEMA:'Solução de um problema previamente identificado', SEM_FOCO:'Sem um foco de aplicação inicialmente definido' }
const tipoLabels:     Record<string,string> = { REAL:'Real', POTENCIAL:'Potencial' }
const boolLabels:     Record<string,string> = { SIM:'Sim', NAO:'Não' }
const abrangLabels:   Record<string,string> = { INTERNACIONAL:'Internacional', NACIONAL:'Nacional', REGIONAL:'Regional', LOCAL:'Local' }
const complexLabels:  Record<string,string> = { ALTA:'Alta', MEDIA:'Média', BAIXA:'Baixa' }
const inovacaoLabels: Record<string,string> = { ALTO:'Alto teor inovativo', MEDIO:'Médio teor inovativo', BAIXO:'Baixo teor inovativo', SEM:'Sem Inovação' }
const fomentosLabels: Record<string,string> = { FINANCIAMENTO:'Financiamento', COOPERACAO:'Cooperação' }
const areaLabels:     Record<string,string> = { ECONOMICO:'Econômico', SAUDE:'Saúde', ENSINO:'Ensino', SOCIAL:'Social', AMBIENTAL:'Ambiental', CIENTIFICO:'Científico', APRENDIZAGEM:'Aprendizagem', CULTURAL:'Cultural' }
// Setor da sociedade — espelha exatamente o SECTOR_OPTIONS do formulário
const setorLabels:    Record<string,string> = {
  AGRICULTURA:      'Agricultura, pecuária, prod. florestal, pesca e aquicultura',
  INDUSTRIA:        'Indústria de transformação',
  AGUA_ESGOTO:      'Água, esgoto, atividades de gestão de resíduos e descontaminação',
  CONSTRUCAO:       'Construção',
  COMERCIO:         'Comércio, reparação e veículos automotores e motocicletas',
  TRANSPORTE:       'Transporte, armazenagem e correio',
  ALOJAMENTO:       'Alojamento e alimentação',
  INFORMACAO:       'Informação e comunicação',
  FINANCEIRO:       'Atividades financeiras, de seguros e serviços relacionados',
  IMOBILIARIO:      'Atividades imobiliárias',
  PROFISSIONAL:     'Atividades profissionais, científicas e técnicas',
  ADMINISTRATIVO:   'Atividades administrativas e serviços complementares',
  ADM_PUBLICA:      'Administração pública, defesa e seguridade social',
  EDUCACAO:         'Educação',
  SAUDE:            'Saúde humana e serviços sociais',
  ARTES:            'Artes, cultura, esporte e recreação',
  OUTROS_SERVICOS:  'Outras atividades de serviços',
  SERVICOS_DOM:     'Serviços domésticos',
  ORGANISMOS_INTL:  'Organismos internacionais e outras instituições extraterritoriais',
}

// ─── Helpers ──────────────────────────────────────────────────────────────
const val      = (v: string|null|undefined) => v?.trim() || '—'
const look     = (map: Record<string,string>, k: string|null|undefined) => (k && map[k]) ? map[k] : '—'
const parseJSON = (s: string|null|undefined): string[] => { try { return JSON.parse(s||'[]') } catch { return [] } }
const fmtLong  = (iso: string|null|undefined) => {
  if (!iso) return '—'
  const [y,m,d] = iso.split('-')
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${parseInt(d)} de ${months[parseInt(m)-1]} de ${y}`
}
const fmtShort = (iso: string|null|undefined) => { if (!iso) return '—'; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}` }
const makeDocId = (iso: string|null|undefined) => { if (!iso) return 'DOC-PTT'; const [y,m,d]=iso.split('-'); return `DOC-${y}-${m}${d}-PTT` }
const fmtSize  = (b: number) => b<1024 ? `${b} B` : b<1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`
const fileExt  = (n: string) => n.split('.').pop()?.toUpperCase() || 'ARQ'

// ─── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Page bases ──
  coverPage:   { fontFamily: 'Inter', fontSize: 10, backgroundColor: C.paper },
  // paddingTop: 44 (top margin) + paddingBottom: 62 (footer reserve)
  contentPage: { fontFamily: 'Inter', fontSize: 10, backgroundColor: C.paper, paddingTop: 44, paddingBottom: 62 },
  closingPage: { fontFamily: 'Inter', fontSize: 10, backgroundColor: C.paper },

  // ── Full-page background (Recipe 1 & 2) ──
  fullBg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },

  // ── Cover ──
  cover: { flexDirection: 'column', height: '100%', position: 'relative' },
  coverTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 52, paddingTop: 44, paddingBottom: 0, position: 'relative',
  },
  ninmaLogo: { width: 165, height: 83, objectFit: 'contain' },  // 520x260 = 2:1
  chip: {
    fontSize: 7.5, letterSpacing: 1.5, fontWeight: 600, color: C.purple,
    borderWidth: 1.5, borderColor: C.purple, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 8,
  },

  coverBody: { flex: 1, paddingHorizontal: 52, justifyContent: 'center', position: 'relative' },
  eyebrow: { fontSize: 8.5, letterSpacing: 2.4, fontWeight: 700, color: C.coral, marginBottom: 20 },
  h1: {
    fontFamily: 'SourceSerif4', fontSize: 42, lineHeight: 1.0, fontWeight: 700,
    color: C.ink, marginBottom: 16, maxWidth: 460,
  },
  h1Accent: { color: C.purple },
  coverSub: { fontSize: 13, color: C.inkSoft, marginBottom: 40, lineHeight: 1.5 },

  coverFields: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderWidth: 1, borderColor: C.rule, borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 24,
    backgroundColor: C.paper, maxWidth: 520,
    gap: 18,
  },
  coverField:     { width: '46%', paddingRight: 8 },
  coverFieldFull: { width: '100%' },
  coverFieldLbl:  { fontSize: 8, letterSpacing: 1.8, fontWeight: 700, color: C.muted, marginBottom: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  coverDot:       { width: 4, height: 4, borderRadius: 99 },
  coverFieldVal:  { fontSize: 11.5, fontWeight: 600, color: C.ink, lineHeight: 1.35 },
  coverFieldValList: { fontSize: 11, fontWeight: 500, color: C.ink, lineHeight: 1.5 },

  coverFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 52, paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: C.rule, position: 'relative',
  },
  coverFootText: { fontSize: 8, letterSpacing: 1, color: C.muted },
  dotBar: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 99 },

  // ── Content page ──
  // pg is now a plain content wrapper — no fixed height.
  // Page itself carries paddingTop/Bottom; fixed Head/Foot handle header+footer on every overflow page.
  pg: { flexDirection: 'column', paddingHorizontal: 52 },
  // Wrapper for fixed in-flow header (horizontal padding matches pg)
  headPad: { paddingHorizontal: 52 },
  // Wrapper for absolutely-positioned fixed footer
  footAbs: { position: 'absolute', bottom: 20, left: 52, right: 52 },
  head: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.rule,
    marginBottom: 28,
  },
  headLogo: { width: 74, height: 37, objectFit: 'contain' },  // 2:1
  headSection: {
    flex: 1, textAlign: 'center', fontSize: 8, letterSpacing: 1.8,
    color: C.muted, fontWeight: 600,
  },
  headPurple: { color: C.purple },
  headDocId:  { fontSize: 7.5, color: C.muted },

  foot: {
    paddingTop: 14, borderTopWidth: 1, borderTopColor: C.rule,
    flexDirection: 'row', alignItems: 'center',
  },
  footLeft:     { flex: 1, fontSize: 7.5, color: C.muted },
  footPageWrap: { alignItems: 'center' },
  footPage:     { fontWeight: 700, fontSize: 9.5, color: C.purple },
  footTotal:    { fontSize: 9.5, color: C.muted },
  footRight:    { flex: 1, textAlign: 'right', fontSize: 7.5, color: C.muted },

  // ── Section title ──
  secTitle: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 24, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.purple,
  },
  badge: {
    fontSize: 7.5, letterSpacing: 1.2, fontWeight: 700, color: C.purple,
    backgroundColor: C.purpleSoft, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 4,
  },
  secH2: { fontFamily: 'SourceSerif4', fontSize: 17, fontWeight: 700, color: C.ink },

  // ── Fields ──
  fields: { gap: 14 },
  field:    { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  fieldSub: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  fieldNBox: {
    width: 30, height: 30, backgroundColor: C.purpleSoft, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fieldNText:    { fontSize: 9.5, fontWeight: 700, color: C.purple },
  fieldSubArrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldSubArrowText: { fontSize: 12, color: C.muted },
  fieldBody:     { flex: 1 },
  fieldLabel:    { fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, color: C.purple, marginBottom: 4 },
  fieldSubLabel: { fontSize: 9.5, fontStyle: 'italic', fontWeight: 500, color: C.inkSoft, marginBottom: 3 },
  fieldValue:    { fontSize: 11, lineHeight: 1.6, color: C.ink },
  fieldEmpty:    { fontSize: 11, lineHeight: 1.6, color: C.muted, fontStyle: 'italic' },
  fieldListItem: { fontSize: 11, lineHeight: 1.6, color: C.ink, marginBottom: 1 },

  // ── Impact ──
  impactGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  impactCard: {
    flex: 1, borderWidth: 1, borderColor: C.rule, borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 11, backgroundColor: C.paper,
  },
  impactAccentBar: { height: 3, borderRadius: 2, marginBottom: 8 },
  impactCardN:     { fontSize: 7.5, color: C.muted, marginBottom: 5 },
  impactCardLbl:   { fontSize: 7, letterSpacing: 1.2, color: C.muted, fontWeight: 700, marginBottom: 7, lineHeight: 1.3 },
  impactCardVal:   { fontSize: 12, fontWeight: 700, color: C.ink, lineHeight: 1.2 },
  impactDesc: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.purpleSoft, borderRadius: 9,
    marginBottom: 10, borderLeftWidth: 3, borderLeftColor: C.purple,
  },
  impactDescLbl: { fontSize: 9, fontWeight: 700, color: C.purple, marginBottom: 5, letterSpacing: 0.4 },
  impactDescVal: { fontSize: 11, lineHeight: 1.55, color: C.ink },

  // ── Annex ──
  annexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  annexCard: {
    width: '47.5%', borderWidth: 1, borderColor: C.rule, borderRadius: 11,
    paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.paper,
  },
  annexThumb:      { width: 52, height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: C.coralSoft },
  annexThumbAlt:   { backgroundColor: C.tealSoft },
  annexThumbText:  { fontSize: 9, fontWeight: 700, color: C.coral, letterSpacing: 0.5 },
  annexThumbTextAlt: { color: C.teal },
  annexCardBody:   { flex: 1 },
  annexName:       { fontSize: 10.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 },
  annexMeta:       { fontSize: 8, color: C.muted, marginTop: 3 },
  // Embedded image styles
  annexImgWrap: {
    width: '100%', marginBottom: 18,
    borderWidth: 1, borderColor: C.rule, borderRadius: 11, overflow: 'hidden',
  },
  annexImg:     { width: '100%', objectFit: 'contain', maxHeight: 380 },
  annexImgCap:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: C.rule, backgroundColor: C.paper,
  },
  annexImgName: { fontSize: 9.5, fontWeight: 600, color: C.ink, flex: 1 },
  annexImgMeta: { fontSize: 8, color: C.muted },

  // ── Closing ──
  closing: { flexDirection: 'column', height: '100%', position: 'relative' },
  closingBody: {
    flex: 1, paddingHorizontal: 66, paddingTop: 72, paddingBottom: 32,
    alignItems: 'center', position: 'relative',
  },
  ppgsmiLogoWrap: { marginBottom: 36, alignItems: 'center' },
  ppgsmiLogo:     { width: 140, height: 189, objectFit: 'contain' },  // 518x698 = 0.742 → 140x189

  quoteWrap: { maxWidth: 440, marginBottom: 40, position: 'relative' },
  quoteMark: {
    position: 'absolute', top: -20, left: -30,
    fontFamily: 'SourceSerif4', fontSize: 100, lineHeight: 0.85,
    color: C.rose, fontWeight: 700, opacity: 0.4,
  },
  quoteText: {
    fontFamily: 'SourceSerif4', fontSize: 15, lineHeight: 1.45,
    color: C.ink, fontStyle: 'italic', fontWeight: 400, textAlign: 'center',
  },

  creditsWrap: { marginBottom: 36, maxWidth: 460, alignItems: 'center' },
  crLabel: { fontSize: 8, letterSpacing: 2.2, color: C.muted, fontWeight: 600, marginBottom: 10, textAlign: 'center' },
  crName:  { fontSize: 15, fontWeight: 700, color: C.rose, textAlign: 'center', marginBottom: 4, lineHeight: 1.25 },
  crSub:   { fontSize: 11, color: C.inkSoft, textAlign: 'center', letterSpacing: 0.4 },

  sealWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 380, width: '100%', marginBottom: 28 },
  sealText: { fontSize: 8, letterSpacing: 1.8, color: C.inkSoft, fontWeight: 600, textAlign: 'center', lineHeight: 1.6 },

  toolsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: C.paper, borderWidth: 1, borderColor: C.rule, borderRadius: 99,
  },
  toolsLabel: { fontSize: 7.5, letterSpacing: 1.5, color: C.muted, fontWeight: 600 },
  toolLogo:   { width: 64, height: 32, objectFit: 'contain' },  // 2:1

  closingFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 52, paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: C.rule,
    position: 'relative',
  },
  closingFootText: { fontSize: 8, color: C.muted },
})

// ─── Recipe 5 — Seal line with SVG LinearGradient ─────────────────────────
function SealLine({ width = 130 }: { width?: number }) {
  return (
    <Svg width={width} height={2} viewBox={`0 0 ${width} 2`}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"   stopColor={C.rose} stopOpacity="0" />
          <Stop offset="50%"  stopColor={C.rose} stopOpacity="1" />
          <Stop offset="100%" stopColor={C.rose} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height="2" fill="url(#sg)" />
    </Svg>
  )
}

// ─── RichText — detects URLs and renders as clickable Link ───────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RichText({ text, style }: { text: string; style: any }) {
  const URL_RE = /https?:\/\/[^\s]+/g
  const parts: { txt: string; isUrl: boolean }[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ txt: text.slice(last, m.index), isUrl: false })
    // strip trailing punctuation that isn't part of the URL itself
    const clean = m[0].replace(/[.,;:!?)]+$/, '')
    const tail  = m[0].slice(clean.length)
    parts.push({ txt: clean, isUrl: true })
    if (tail) parts.push({ txt: tail, isUrl: false })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ txt: text.slice(last), isUrl: false })
  if (!parts.some(p => p.isUrl)) return <Text style={style}>{text}</Text>
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.isUrl
          ? <Link key={i} src={p.txt}><Text style={{ color: C.purple, textDecoration: 'underline' }}>{p.txt}</Text></Link>
          : <Text key={i}>{p.txt}</Text>
      )}
    </Text>
  )
}

// ─── Shared chrome ────────────────────────────────────────────────────────
interface Images {
  ninma: string | null
  ppgsmi: string | null
  coverBg: string | null
  closingBg: string | null
  arcCover: string | null
  arcClosing: string | null
}

function Head({ section, docId, images }: { section: string; docId: string; images: Images }) {
  return (
    <View style={s.head}>
      {images.ninma
        ? <Image src={images.ninma} style={s.headLogo} />
        : <Text style={{ fontSize: 9, fontWeight: 700, color: C.purple, width: 74 }}>NinMaHub</Text>
      }
      <Text style={s.headSection}>
        <Text style={s.headPurple}>· </Text>{section.toUpperCase()}
      </Text>
      <Text style={s.headDocId}>{docId}</Text>
    </View>
  )
}

// Fixed head — repeats at the top of every overflow page (in-flow, not absolute)
function FixedHead({ section, docId, images }: { section: string; docId: string; images: Images }) {
  return (
    <View fixed style={s.headPad}>
      <Head section={section} docId={docId} images={images} />
    </View>
  )
}

// Fixed foot — absolutely positioned at bottom of every page via render prop
// IMPORTANT: position:absolute must be on the OUTER fixed View, not inside render()
// Note: @react-pdf v4 render prop only exposes { pageNumber, subPageNumber }; totalPages unavailable
function FixedFoot({ date }: { date: string }) {
  return (
    <View fixed style={s.footAbs} render={({ pageNumber }) => (
      <View style={s.foot}>
        <Text style={s.footLeft}>NinMaHub · PPGSMI · UFN</Text>
        <View style={s.footPageWrap}>
          <Text style={s.footPage}>{String(pageNumber - 1).padStart(2, '0')}</Text>
        </View>
        <Text style={s.footRight}>{date}</Text>
      </View>
    )} />
  )
}

function Foot({ page, total, date }: { page: number; total: number; date: string }) {
  return (
    <View style={s.foot}>
      <Text style={s.footLeft}>NinMaHub · PPGSMI · UFN</Text>
      <View style={s.footPageWrap}>
        <Text style={s.footPage}>
          {String(page).padStart(2,'0')}
          <Text style={s.footTotal}> / {String(total).padStart(2,'0')}</Text>
        </Text>
      </View>
      <Text style={s.footRight}>{date}</Text>
    </View>
  )
}

// ─── Field component ──────────────────────────────────────────────────────
interface FieldItem { n: number; label: string; value: string|string[]; sub?: boolean; list?: boolean }

function Field({ item }: { item: FieldItem }) {
  const empty = !item.value || item.value === '—' || (Array.isArray(item.value) && item.value.length === 0)
  if (item.sub) return (
    <View style={s.fieldSub}>
      <View style={s.fieldSubArrow}><Text style={s.fieldSubArrowText}>↳</Text></View>
      <View style={s.fieldBody}>
        <Text style={s.fieldSubLabel}>{item.label}</Text>
        {empty
          ? <Text style={s.fieldEmpty}>—</Text>
          : <RichText text={String(item.value)} style={s.fieldValue} />
        }
      </View>
    </View>
  )
  return (
    <View style={s.field}>
      <View style={s.fieldNBox}><Text style={s.fieldNText}>{String(item.n).padStart(2,'0')}</Text></View>
      <View style={s.fieldBody}>
        <Text style={s.fieldLabel}>{item.label.toUpperCase()}</Text>
        {item.list && Array.isArray(item.value)
          ? <View>{item.value.map((v,i) => <Text key={i} style={s.fieldListItem}>{v}</Text>)}</View>
          : empty
            ? <Text style={s.fieldEmpty}>—</Text>
            : <RichText text={String(item.value)} style={s.fieldValue} />
        }
      </View>
    </View>
  )
}

// ─── Data mapping ─────────────────────────────────────────────────────────
interface DocData {
  meta:   { date: string; docId: string; dateShort: string; year: string }
  cover:  { aluno: string; orientador: string; banca: string[]; data: string }
  prodP1: FieldItem[]; prodP2: FieldItem[]
  impact: { cards: FieldItem[]; descs: FieldItem[] }
  charP1: FieldItem[]; charP2: FieldItem[]
  annexes: { name: string; ext: string; meta: string; isEven: boolean; url: string; isImage: boolean; dataUrl: string | null }[]
}

function buildDocData(template: Template, attachments: Attachment[]): DocData {
  const areas   = parseJSON(template.impactoArea).map(k => areaLabels[k]||k)
  const setores = parseJSON(template.setorBeneficiado).map(k => setorLabels[k]||k)
  const isoDate = template.data || new Date().toISOString().split('T')[0]

  const prodFields: FieldItem[] = [
    { n:1, label:'Título do Produto (Português)', value: val(template.tituloPt) },
    { n:1, label:'Título do Produto (Inglês)',    value: val(template.tituloEn), sub:true },
    { n:2, label:'Linha de Pesquisa',             value: look(linhaLabels, template.linhaPesquisa) },
    { n:3, label:'Participação de discente/egresso/docente e participante externo', value: val(template.participantes) },
    { n:4, label:'Objetivo do Produto Técnico-Tecnológico', value: val(template.objetivo) },
    { n:5, label:'Finalidade do Produto Técnico-Tecnológico', value: val(template.finalidade) },
    { n:6, label:'Referencial teórico e metodológico', value: val(template.referencialTeorico) },
    { n:7, label:'Descrição do Produto Técnico-Tecnológico', value: val(template.descricaoProduto) },
    { n:8, label:'Relevância científica, tecnológica, social e de inovação', value: val(template.relevancia) },
    { n:9, label:'Observações', value: val(template.observacoes) },
  ]

  const impactCards: FieldItem[] = [
    { n:10, label:'Nível',          value: look(nivelLabels,    template.impactoNivel) },
    { n:11, label:'Demanda',        value: look(demandaLabels,  template.impactoDemanda) },
    { n:12, label:'Objetivo',       value: look(objetivoLabels, template.impactoObjetivo) },
    { n:13, label:'Área Impactada', value: areas.length ? areas.join(', ') : '—' },
    { n:14, label:'Tipo',           value: look(tipoLabels,     template.impactoTipo) },
  ]
  const impactDescs: FieldItem[] = template.impactoTipoDesc
    ? [{ n:14, label:'Descrição do Tipo de Impacto', value: val(template.impactoTipoDesc), sub:true }]
    : []

  const charP1: FieldItem[] = [
    { n:15, label:'Replicabilidade',          value: look(boolLabels,    template.replicabilidade) },
    ...(template.replicabilidadeDesc ? [{ n:15, label:'Descrição da Replicabilidade', value: val(template.replicabilidadeDesc), sub:true }] : []),
    { n:16, label:'Abrangência territorial',  value: look(abrangLabels,  template.abrangencia) },
    { n:17, label:'Complexidade',             value: look(complexLabels, template.complexidade) },
    ...(template.complexidadeDesc ? [{ n:17, label:'Descrição da Complexidade', value: val(template.complexidadeDesc), sub:true }] : []),
    { n:18, label:'Inovação',                 value: look(inovacaoLabels, template.inovacao) },
    ...(template.inovacaoDesc ? [{ n:18, label:'Descrição da Inovação', value: val(template.inovacaoDesc), sub:true }] : []),
    { n:19, label:'Setor da sociedade beneficiado', value: setores.length ? setores : ['—'], list: setores.length > 0 },
  ]

  const charP2: FieldItem[] = [
    { n:20, label:'Vínculo com o PDI',  value: look(boolLabels,    template.vinculoPDI) },
    { n:21, label:'Fomento',            value: look(fomentosLabels, template.fomento) },
    ...(template.fomentoCodigo ? [{ n:21, label:'Código do projeto', value: val(template.fomentoCodigo), sub:true }] : []),
    { n:22, label:'Registro/depósito de propriedade intelectual', value: val(template.propriedadeIntelectual) },
    { n:23, label:'Estágio da tecnologia', value: look({ PILOTO:'Piloto/Protótipo', FINALIZADO:'Finalizado e implantado', TESTE:'Em teste' }, template.estagioTecnologia) },
    { n:24, label:'Transferência de tecnologia/conhecimento', value: look(boolLabels, template.transferenciaConhecimento) },
    { n:25, label:'URL do Produto',     value: val(template.urlProduto) },
    { n:26, label:'Divulgação',         value: val(template.divulgacao) },
  ]

  const annexes = attachments.map((a,i) => ({
    name:    a.originalName,
    ext:     fileExt(a.originalName),
    meta:    `${a.mimeType.split('/')[1]?.toUpperCase()||fileExt(a.originalName)} · ${fmtSize(a.size)}`,
    isEven:  i%2===1,
    url:     a.url,
    isImage: a.mimeType.startsWith('image/'),
    dataUrl: null as string | null,
  }))

  const bancaRaw = template.bancaAvaliadora || ''
  const banca = bancaRaw.trim() ? bancaRaw.split('\n').map(l=>l.trim()).filter(Boolean) : ['—']
  const year = isoDate.split('-')[0] || '2026'

  return {
    meta:   { date: fmtLong(isoDate), docId: makeDocId(isoDate), dateShort: fmtShort(isoDate), year },
    cover:  { aluno: val(template.aluno), orientador: val(template.orientador), banca, data: isoDate },
    prodP1: prodFields.filter(f=>f.n<=5),
    prodP2: prodFields.filter(f=>f.n>=6&&f.n<=9),
    impact: { cards: impactCards, descs: impactDescs },
    charP1, charP2, annexes,
  }
}

// ─── PDF Document (8 pages) ───────────────────────────────────────────────
const accentColors = [C.purple, C.coral, C.teal, C.rose, C.purple]
const dotColors    = [C.coral,  C.teal,  C.purple, C.rose]

function LayoutDDocument({ doc, images }: { doc: DocData; images: Images }) {
  const TOTAL = 8
  const { meta, cover } = doc

  return (
    <Document title="Produto Técnico-Tecnológico — PPGSMI" author="NinMaHub">

      {/* ── 01 CAPA ── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.cover}>
          {/* Recipe 2: cover background PNG (radial-gradient pre-rendered) */}
          {images.coverBg && <Image src={images.coverBg} style={s.fullBg} />}

          {/* Recipe 3 Opção B: arc-cover.png (1000x1000, positioned top-right) */}
          {images.arcCover && (
            <Image src={images.arcCover} style={{
              position: 'absolute', top: 140, left: 260,
              width: 380, height: 380,
            }} />
          )}

          {/* Top row */}
          <View style={s.coverTop}>
            {images.ninma
              ? <Image src={images.ninma} style={s.ninmaLogo} />
              : <Text style={{ fontSize: 10, fontWeight: 700, color: C.purple }}>NinMaHub</Text>
            }
            <Text style={s.chip}>PRODUTO TÉCNICO-TECNOLÓGICO</Text>
          </View>

          {/* Body */}
          <View style={s.coverBody}>
            <Text style={s.eyebrow}>PPGSMI · DOCUMENTO OFICIAL / {meta.year}</Text>
            <Text style={s.h1}>
              {'Programa de Pós-Graduação em\n'}
              <Text style={s.h1Accent}>Saúde Materno Infantil</Text>
            </Text>
            <Text style={s.coverSub}>Universidade Franciscana</Text>

            <View style={s.coverFields}>
              {/* Aluno */}
              <View style={s.coverField}>
                <View style={s.coverFieldLbl}>
                  <View style={[s.coverDot, { backgroundColor: C.coral }]} />
                  <Text>ALUNO</Text>
                </View>
                <Text style={s.coverFieldVal}>{cover.aluno}</Text>
              </View>
              {/* Orientador */}
              <View style={s.coverField}>
                <View style={s.coverFieldLbl}>
                  <View style={[s.coverDot, { backgroundColor: C.teal }]} />
                  <Text>ORIENTADOR</Text>
                </View>
                <Text style={s.coverFieldVal}>{cover.orientador}</Text>
              </View>
              {/* Banca */}
              <View style={s.coverFieldFull}>
                <View style={s.coverFieldLbl}>
                  <View style={[s.coverDot, { backgroundColor: C.purple }]} />
                  <Text>BANCA AVALIADORA</Text>
                </View>
                {cover.banca.map((b,i) => <Text key={i} style={s.coverFieldValList}>{b}</Text>)}
              </View>
              {/* Data */}
              <View style={s.coverFieldFull}>
                <View style={s.coverFieldLbl}>
                  <View style={[s.coverDot, { backgroundColor: C.rose }]} />
                  <Text>DATA DE SUBMISSÃO</Text>
                </View>
                <Text style={s.coverFieldVal}>{fmtLong(cover.data)}</Text>
              </View>
            </View>
          </View>

        </View>
      </Page>

      {/* ── 02 PRODUTO P1 (campos 1–5) ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 01 · IDENTIFICAÇÃO</Text>
            <Text style={s.secH2}>Identificação e objetivos do produto</Text>
          </View>
          <View style={s.fields}>{doc.prodP1.map((item,i) => <Field key={i} item={item} />)}</View>
        </View>
      </Page>

      {/* ── 03 PRODUTO P2 (campos 6–9) ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 02 · DESCRIÇÃO</Text>
            <Text style={s.secH2}>Fundamentação e descrição do produto</Text>
          </View>
          <View style={s.fields}>{doc.prodP2.map((item,i) => <Field key={i} item={item} />)}</View>
        </View>
      </Page>

      {/* ── 04 IMPACTO (campos 10–14) ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 03 · IMPACTO</Text>
            <Text style={s.secH2}>Análise de impacto do produto</Text>
          </View>
          <View style={s.impactGrid}>
            {doc.impact.cards.map((card,i) => (
              <View key={i} style={s.impactCard}>
                <View style={[s.impactAccentBar, { backgroundColor: accentColors[i] }]} />
                <Text style={s.impactCardN}>#{String(card.n).padStart(2,'0')}</Text>
                <Text style={s.impactCardLbl}>{card.label.toUpperCase()}</Text>
                <Text style={s.impactCardVal}>{String(card.value)}</Text>
              </View>
            ))}
          </View>
          {doc.impact.descs.map((desc,i) => (
            <View key={i} style={s.impactDesc}>
              <Text style={s.impactDescLbl}>{desc.label}</Text>
              <Text style={s.impactDescVal}>{String(desc.value)}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* ── 05 CARACTERÍSTICAS P1 (campos 15–19) ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 04 · CARACTERÍSTICAS</Text>
            <Text style={s.secH2}>Características operacionais</Text>
          </View>
          <View style={s.fields}>{doc.charP1.map((item,i) => <Field key={i} item={item} />)}</View>
        </View>
      </Page>

      {/* ── 06 CARACTERÍSTICAS P2 (campos 20–26) ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>SEÇÃO 05 · VÍNCULOS</Text>
            <Text style={s.secH2}>Vínculos, fomento e divulgação</Text>
          </View>
          <View style={s.fields}>{doc.charP2.map((item,i) => <Field key={i} item={item} />)}</View>
        </View>
      </Page>

      {/* ── 07 ANEXOS ── */}
      <Page size="A4" style={s.contentPage}>
        <FixedHead section="Produto Técnico-Tecnológico" docId={meta.docId} images={images} />
        <FixedFoot date={meta.dateShort} />
        <View style={s.pg}>
          <View style={s.secTitle}>
            <Text style={s.badge}>ANEXOS</Text>
            <Text style={s.secH2}>Documentos e arquivos vinculados</Text>
          </View>
          {doc.annexes.length === 0
            ? <Text style={s.fieldEmpty}>Nenhum arquivo anexado.</Text>
            : (
              <View>
                {/* Embedded images — full width with caption */}
                {doc.annexes.filter(a => a.isImage && a.dataUrl).map((a, i) => (
                  <View key={`img-${i}`} style={s.annexImgWrap}>
                    <Image src={a.dataUrl!} style={s.annexImg} />
                    <View style={s.annexImgCap}>
                      <Text style={s.annexImgName}>{a.name}</Text>
                      <Text style={s.annexImgMeta}>{a.meta}</Text>
                    </View>
                  </View>
                ))}
                {/* Non-image files — metadata cards in 2-column grid */}
                {doc.annexes.filter(a => !a.isImage || !a.dataUrl).length > 0 && (
                  <View style={s.annexGrid}>
                    {doc.annexes.filter(a => !a.isImage || !a.dataUrl).map((a, i) => (
                      <View key={`file-${i}`} style={s.annexCard}>
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
              </View>
            )
          }
        </View>
      </Page>

      {/* ── 08 ENCERRAMENTO ── */}
      <Page size="A4" style={s.closingPage}>
        <View style={s.closing}>
          {/* Recipe 1: closing background PNG */}
          {images.closingBg && <Image src={images.closingBg} style={s.fullBg} />}

          {/* Recipe 3 Opção B: arc-closing.png (1200x1200, centered) */}
          {images.arcClosing && (
            <Image src={images.arcClosing} style={{
              position: 'absolute',
              top: 160, left: 58,
              width: 480, height: 480,
              opacity: 0.55,
            }} />
          )}

          <View style={s.closingBody}>
            {/* PPGSMI logo */}
            <View style={s.ppgsmiLogoWrap}>
              {images.ppgsmi
                ? <Image src={images.ppgsmi} style={s.ppgsmiLogo} />
                : <Text style={{ fontSize: 14, fontWeight: 700, color: C.rose }}>PPGSMI</Text>
              }
            </View>

            {/* Quote — Recipe 6 */}
            <View style={s.quoteWrap}>
              <Text style={s.quoteMark}>{'"'}</Text>
              <Text style={s.quoteText}>
                Cuidar da mãe e da criança é cuidar do futuro. Cada produto técnico-tecnológico nasce da pesquisa, mas se realiza quando chega à vida real de quem precisa.
              </Text>
            </View>

            {/* Credits */}
            <View style={s.creditsWrap}>
              <Text style={s.crLabel}>ESTE DOCUMENTO FOI PRODUZIDO NO ÂMBITO DO</Text>
              <Text style={s.crName}>{'Programa de Pós-Graduação em\nSaúde Materno Infantil'}</Text>
              <Text style={s.crSub}>Mestrado e Doutorado · Universidade Franciscana</Text>
            </View>

            {/* Seal — Recipe 5 */}
            <View style={s.sealWrap}>
              <SealLine width={120} />
              <View style={{ alignItems: 'center' }}>
                <Text style={s.sealText}>Em conformidade com as diretrizes</Text>
                <Text style={s.sealText}>do PPGSMI · UFN</Text>
              </View>
              <SealLine width={120} />
            </View>

            {/* "Gerado por" pill — Recipe 4 */}
            <View style={s.toolsRow}>
              <Text style={s.toolsLabel}>GERADO POR</Text>
              {images.ninma
                ? <Image src={images.ninma} style={s.toolLogo} />
                : <Text style={[s.toolsLabel, { color: C.purple }]}>NinMaHub</Text>
              }
            </View>
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

  // Pre-fetch all image assets as data URLs
  const [ninma, ppgsmi, coverBg, closingBg, arcCover, arcClosing] = await Promise.all([
    fetchDataURL(`${origin}/ninmahub-logo.png`),
    fetchDataURL(`${origin}/ppgsmi-logo.png`),
    fetchDataURL(`${origin}/cover-bg.png`),
    fetchDataURL(`${origin}/closing-bg.png`),
    fetchDataURL(`${origin}/arc-cover.png`),
    fetchDataURL(`${origin}/arc-closing.png`),
  ])
  const images: Images = { ninma, ppgsmi, coverBg, closingBg, arcCover, arcClosing }

  const doc = buildDocData(template, attachments)

  // Pre-fetch image attachments as data URLs so they render embedded in the PDF
  const annexImageDataUrls = await Promise.all(
    doc.annexes.map(a => a.isImage && a.url ? fetchDataURL(a.url) : Promise.resolve(null))
  )
  doc.annexes = doc.annexes.map((a, i) => ({ ...a, dataUrl: annexImageDataUrls[i] }))

  const blob = await pdf(<LayoutDDocument doc={doc} images={images} />).toBlob()

  const safeName = (template.tituloPt||'template').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `PTT_PPGSMI_${safeName}_${doc.meta.docId}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
