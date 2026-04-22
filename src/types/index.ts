export type UserRole = 'ALUNO' | 'ORIENTADOR' | 'COORDENACAO' | 'SUPERADMIN'
export type TemplateStatus = 'RASCUNHO' | 'ENVIADO' | 'AGUARDANDO_COORDENACAO' | 'APROVADO' | 'REVISAO'

export interface TemplateEvent {
  id: string
  templateId: string
  actorId: string | null
  actorName: string | null
  actorRole: string | null
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: Date | string
}

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Template {
  id: string
  status: TemplateStatus
  createdAt: Date
  updatedAt: Date
  aluno: string | null
  orientador: string | null
  coorientador: string | null
  bancaAvaliadora: string | null
  data: string | null
  tituloPt: string | null
  tituloEn: string | null
  linhaPesquisa: string | null
  participantes: string | null
  objetivo: string | null
  finalidade: string | null
  referencialTeorico: string | null
  descricaoProduto: string | null
  relevancia: string | null
  observacoes: string | null
  impactoNivel: string | null
  impactoDemanda: string | null
  impactoObjetivo: string | null
  impactoArea: string | null
  impactoTipo: string | null
  impactoTipoDesc: string | null
  replicabilidade: string | null
  replicabilidadeDesc: string | null
  abrangencia: string | null
  complexidade: string | null
  complexidadeDesc: string | null
  inovacao: string | null
  inovacaoDesc: string | null
  setorBeneficiado: string | null
  vinculoPDI: string | null
  fomento: string | null
  fomentoCodigo: string | null
  propriedadeIntelectual: string | null
  estagioTecnologia: string | null
  transferenciaConhecimento: string | null
  urlProduto: string | null
  divulgacao: string | null
  anexosDesc: string | null
  studentId: string
  advisorId: string | null
  student?: User
  advisor?: User | null
  comments?: Comment[]
}

export interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  section?: string | null
  createdAt: Date
  templateId: string
}

export interface Comment {
  id: string
  content: string
  fieldRef: string | null
  createdAt: Date
  authorId: string
  templateId: string
  author?: User
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    role: UserRole
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
