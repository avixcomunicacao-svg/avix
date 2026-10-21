# Avix — plataforma de mentoria

Área administrativa (mentor) + área de membros (alunos). Next.js 16 · Supabase · Drizzle · Bunny Stream · Resend.

## Fase 1 — o que está pronto

- Design system aplicado (tokens claro/escuro, degradês, tipografia Sora + IBM Plex).
- Banco completo (todas as tabelas das fases 1–6) com **RLS** testada: membro só vê trilhas dele, aulas publicadas e liberadas, e os próprios registros; `notes_private` nunca sai pela view de membro; membro não consegue alterar o próprio acesso.
- Autenticação: e-mail/senha, link mágico, recuperação, convite com criação de senha.
- Papéis `admin` / `membro`; redirecionamentos (admin → /admin, membro → /app, expirado/pausado → /app/renovar, sem onboarding → /app/boas-vindas).
- Admin: Dashboard (contadores), Membros (lista com filtros, cadastro, edição, convite/reenvio, pausar/reativar/expirar, notas privadas, perfil com progresso), Conteúdos (trilhas → módulos → aulas com arrastar e soltar, upload de vídeo retomável para o Bunny, materiais, publicação imediata/por data/por dias), prévia "ver como aluno", busca, configurações (status das integrações).
- Membro (celular primeiro): Início, Aulas (capas por trilha, progresso), Aula (player com retomada, concluir com desfazer, avaliação 1–5, materiais, anterior/próxima), Perfil (objetivo, disponibilidade, agenda do dia), onboarding com aceite LGPD, tela de renovação com WhatsApp do mentor, busca. Mentorias, Plano e Atas com estados vazios explicativos (fases 3–5).

## Setup

1. **Supabase**: crie o projeto (região São Paulo). Em *Authentication → URL Configuration*, coloque `Site URL = https://seu-dominio` e adicione `https://seu-dominio/auth/callback` em *Redirect URLs*. Em *Authentication → Providers → Email*, mantenha **Confirm email desligado** (o admin cria a conta já confirmada e envia o convite pela Avix).
2. Copie `.env.example` para `.env` e preencha Supabase, Resend e Bunny.
3. `npm install`
4. `npm run db:push` — aplica `supabase/migrations/*.sql` (esquema + RLS + triggers).
5. `npm run seed` — cria mentor, 3 trilhas com módulos, 2 aulas em rascunho e 3 membros de exemplo (credenciais impressas no terminal).
6. `npm run dev` → http://localhost:3000

Verificação sem banco: `npm run db:check` roda as migrations num Postgres em memória e executa os testes de isolamento (RLS).

## O que testar (fase 1)

**Como mentor** (`mentor@avix.local`)
1. Entrar → cai em `/admin`. Menu lateral recolhe. Busca global encontra "Carla" e "Oferta".
2. Membros → cadastrar um aluno novo com seu e-mail real, marcar "Enviar convite". Conferir que o e-mail chega (Resend) e que o link leva à tela "Crie sua senha".
3. No perfil do membro: pausar → o aluno vê a tela de renovação; reativar → volta. Editar WhatsApp com formato errado → validação em tempo real.
4. Conteúdos → arrastar trilhas/módulos/aulas; criar módulo; criar aula; enviar um MP4 (acompanhar "Enviando" → "Processando" → "Pronto"); publicar; "Ver como aluno".
5. Criar uma aula com liberação "10 dias após a entrada" e conferir que a Carla (entrou há 30 dias) vê e o Rafael (entrou há 10) só vê a partir de hoje.

**Como aluno** (`carla@exemplo.com.br`)
1. Entrar no celular → Início com saudação, próxima mentoria (vazio), progresso por trilha, aviso do mentor.
2. Aulas → abrir aula publicada → sair no meio → voltar: retoma de onde parou e aparece em "Continuar assistindo".
3. Marcar como concluída → Desfazer → marcar de novo. Avaliar com 4 estrelas e comentário.
4. Perfil → mudar dias e horas → salvar.
5. Tentar abrir pela URL uma aula de trilha que não é dela (pegue o id no admin): deve dar 404.

**Como aluno sem onboarding** (`rafael@exemplo.com.br`) → cai em "Oi, Rafael" (três perguntas + LGPD) e só depois entra.
**Como aluno expirado** (`juliana@exemplo.com.br`) → tela de renovação com botão do WhatsApp do mentor.

## Estrutura

```
src/app/(auth)        entrar, convite, recuperar
src/app/(admin)/admin dashboard, membros, conteudos, mentorias, atas, configuracoes, buscar
src/app/(membro)      (shell)/app = área do aluno · (gate)/app = renovar, boas-vindas
src/modules/*         auth, members, content, settings — queries + server actions
src/db                schema Drizzle · supabase/migrations = SQL + RLS
src/lib               supabase, email (Resend), video (Bunny), format
src/components        ui (design system), nav (shells), video (player)
```

## Próximas fases

2 Engajamento (dashboard, avaliações, perfil 360°) · 3 Mentorias ao vivo (Google Calendar/Meet/Drive, "publicar gravação como aula") · 4 IA e plano de ação · 5 WhatsApp via Made CRM · 6 Acabamento · 7 Integração Notion/CRM (eventos).
