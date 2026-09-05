# NinMaHub · PPGSMI

Sistema de elaboração, revisão e aprovação de templates de **Produto Técnico-Tecnológico (PTT)** do Programa de Pós-Graduação em Saúde Materno Infantil da **Universidade Franciscana (UFN)**.

A plataforma reúne alunos, orientadores e coordenação em um fluxo de acompanhamento dos documentos, com comentários, anexos, histórico de tramitação e exportação em PDF.

## Funcionalidades

- Acesso por código de seis dígitos enviado por e-mail, com validade de dez minutos.
- Cadastro e preenchimento de templates com capa e 27 campos sobre o produto, incluindo objetivos, impacto, inovação, replicabilidade e divulgação.
- Vinculação entre aluno e orientador.
- Revisão por orientadores e aprovação final pela coordenação.
- Solicitação de ajustes e comentários vinculados aos campos do documento.
- Linha do tempo das mudanças de status.
- Upload de anexos no Supabase Storage.
- Geração de PDF com `@react-pdf/renderer`.
- Notificações por e-mail sobre etapas do fluxo, comentários e cadastros.
- Gestão de usuários e perfis de acesso.

## Perfis e fluxo de trabalho

| Perfil | Finalidade |
| --- | --- |
| `ALUNO` | Preencher seus templates e encaminhá-los para revisão. |
| `ORIENTADOR` | Revisar os documentos de seus orientandos e encaminhá-los à coordenação. |
| `COORDENACAO` | Avaliar documentos, solicitar ajustes, aprovar a versão final e gerenciar usuários. |
| `SUPERADMIN` | Administrar o sistema, incluindo a criação de outros superadministradores. |

O fluxo principal utiliza os estados:

```text
RASCUNHO → ENVIADO → AGUARDANDO_COORDENACAO → APROVADO
```

O estado `REVISAO` identifica documentos devolvidos para ajustes.

Por padrão, e-mails do domínio `ufn.edu.br` e seus subdomínios podem realizar o primeiro acesso. Usuários externos precisam estar previamente cadastrados. Novas contas criadas pelo primeiro acesso recebem o perfil `ALUNO`.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicação web e API | Next.js 16, React 19 e TypeScript |
| Interface | Tailwind CSS e Lucide |
| Formulários e validação | React Hook Form e Zod |
| Banco de dados | PostgreSQL e Prisma 6 |
| Arquivos | Supabase Storage |
| Autenticação | OTP por e-mail e sessões JWT com `jose` |
| E-mail | Nodemailer via SMTP |
| Documentos | `@react-pdf/renderer` |

## Executar localmente

### 1. Preparar o projeto

Tenha Git, Node.js compatível com o Next.js 16 e npm instalados, além de um banco PostgreSQL e um projeto Supabase para os anexos.

```bash
git clone https://github.com/luizfr-jr/ppgsmi-ptt.git
cd ppgsmi-ptt
npm install
```

### 2. Configurar o ambiente

Copie [`.env.example`](.env.example) para `.env` na raiz do projeto e preencha os valores.

No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS:

```bash
cp .env.example .env
```

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL utilizada pela aplicação. |
| `DIRECT_URL` | Conexão direta utilizada pelo Prisma nas operações de banco. |
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Credencial de serviço utilizada pelo servidor para o Storage. |
| `JWT_SECRET` | Segredo forte para assinatura das sessões. |
| `EMAIL_HOST` | Servidor SMTP. |
| `EMAIL_PORT` | Porta SMTP; o padrão no código é `587`. |
| `EMAIL_USER` | Usuário de autenticação SMTP. |
| `EMAIL_PASS` | Senha de autenticação SMTP. |
| `EMAIL_FROM` | Endereço remetente dos e-mails. |
| `APP_BASE_URL` | URL base utilizada nos links de notificação; em desenvolvimento, use `http://localhost:3000`. |
| `ALLOWED_EMAIL_DOMAINS` | Opcional: domínios autorizados para cadastro, separados por vírgula. Padrão: `ufn.edu.br`. Adicione ao `.env` se necessário. |

Mantenha `.env` e as credenciais fora do controle de versão. A chave de serviço do Supabase deve permanecer no servidor.

### 3. Preparar o banco e iniciar

Com as conexões configuradas, execute em um **banco destinado ao desenvolvimento**:

```bash
npx prisma generate
npm run db:push
npm run dev
```

O comando `db:push` sincroniza o banco com [`prisma/schema.prisma`](prisma/schema.prisma); revise as alterações antes de utilizá-lo em um banco com dados existentes.

Abra [http://localhost:3000](http://localhost:3000).

Em modo de desenvolvimento, se `EMAIL_USER` ou `EMAIL_PASS` não estiver configurado, o código de acesso aparece na tela e no terminal. Em produção, o envio SMTP precisa estar configurado para o login funcionar.

### 4. Preparar os perfis iniciais

Em um banco novo, faça o primeiro acesso com um e-mail autorizado. Para administrar essa instalação, um responsável pelo banco pode usar `npm run db:studio` e alterar o campo `role` dessa conta na tabela `User` para `SUPERADMIN`. Saia e entre novamente para atualizar a sessão.

Depois, utilize a gestão de usuários para cadastrar orientadores, coordenação e colaboradores externos.

### Anexos

A implementação utiliza o bucket `attachments` e tenta criá-lo automaticamente no upload. O código atual cria esse bucket como **público** e armazena URLs públicas dos arquivos; quem tiver a URL poderá acessá-los. Considere esse comportamento ao escolher os materiais enviados.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera o cliente Prisma e compila a aplicação. |
| `npm start` | Inicia a aplicação compilada. |
| `npm run db:push` | Sincroniza o schema Prisma com o banco configurado. |
| `npm run db:studio` | Abre a interface de administração do Prisma. |
| `npm run icons` | Executa o script de geração de ícones. |

Para executar a versão de produção:

```bash
npm run build
npm start
```

Configure as variáveis de ambiente no servidor de destino, incluindo SMTP e uma `APP_BASE_URL` correspondente ao endereço publicado.

## Estrutura

```text
prisma/
  schema.prisma        Modelos e relações do banco
public/                Recursos estáticos e fontes
scripts/               Scripts auxiliares
src/
  app/
    api/               Rotas de autenticação, usuários, templates e anexos
    dashboard/         Área do aluno
    orientador/        Área do orientador
    coordenacao/       Área da coordenação e gestão de usuários
  components/          Componentes de interface e formulário
  lib/                 Autenticação, banco, e-mail, PDF e Storage
  types/               Tipos compartilhados
.env.example           Modelo de configuração
```

## Desenvolvimento

Os scripts atuais não incluem uma suíte automatizada de testes. Ao alterar o projeto, execute `npm run build` e valide os fluxos afetados com os perfis correspondentes.
