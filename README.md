# Sabiá

Aplicação de pesquisa para aprendizagem de idiomas por conversas e atividades personalizadas. Desenvolvida com Next.js, React, Prisma e PostgreSQL (Neon).

## Executar localmente

1. Instale [Bun](https://bun.sh/) e copie `.env.example` para `.env`.
2. Defina `RESEARCHER_PIN` com um segredo longo e aleatório. Configure `GOOGLE_API_KEY` para Gemini (principal) e `GROQ_API_KEY` para Groq (fallback). Os modelos padrão são `gemini-2.5-flash` e `openai/gpt-oss-120b`; altere `GOOGLE_MODEL` ou `GROQ_MODEL` se necessário. Se ambas as APIs falharem, o app usa uma resposta local por regras. Não coloque chaves no repositório.
3. Execute `bun install --frozen-lockfile`, `bun run db:generate`, `bunx prisma migrate deploy`, `bun run db:seed` e `bun run dev`.
4. Abra `http://localhost:3000`.

O arquivo `.env` é local e não deve ser enviado ao Git. Use a URL com pool do Neon em `DATABASE_URL` e a URL direta em `DIRECT_URL`. A área da pesquisadora exporta dados pseudonimizados; proteja a implantação com HTTPS e controle de acesso.

## Verificação

Execute `bun run lint`, `bunx tsc --noEmit` e `bun run build`.

## Publicar na Vercel

Conecte o repositório com o preset Next.js e use a branch `Estudos`. Configure `DATABASE_URL` (Neon com pool), `DIRECT_URL` (Neon direta), `GOOGLE_API_KEY`, `GROQ_API_KEY` e `RESEARCHER_PIN` como variáveis de ambiente no projeto. Defina as mesmas variáveis para Preview se quiser testar os previews. Crie o esquema com `bunx prisma migrate deploy` e carregue as lições com `bun run db:seed` uma única vez, usando a URL direta para a migração. Não publique sem essas etapas: o app precisa das tabelas e das lições no Neon.

## Organização

- `src/`: aplicação e rotas de API.
- `prisma/`: esquema e dados iniciais.
- `apresentacao/`: materiais de apresentação, questionários e identidade visual.
- `public/marca/`: arquivos de marca usados pela aplicação.
- `scripts/`: scripts auxiliares.

Documentos acadêmicos de origem e dados da pesquisa ficam fora do repositório público.
