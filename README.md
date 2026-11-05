# Sabiá

Aplicação de pesquisa para aprendizagem de idiomas por conversas e atividades personalizadas. Desenvolvida com Next.js, React, Prisma e SQLite.

## Executar localmente

1. Instale [Bun](https://bun.sh/) e copie `.env.example` para `.env`.
2. Defina `RESEARCHER_PIN` com um segredo longo e aleatório. Configure `GOOGLE_API_KEY` para usar o provedor Gemini; sem ela, o aplicativo usa o modo alternativo previsto no código.
3. Execute `bun install --frozen-lockfile`, `bun run db:generate`, `bun run db:push` e `bun run dev`.
4. Abra `http://localhost:3000`.

O banco SQLite e o arquivo `.env` são locais e não devem ser enviados ao Git. A área da pesquisadora exporta dados pseudonimizados; proteja a implantação com HTTPS e controle de acesso.

## Verificação

Execute `bun run lint` e `bun run build`.

## Organização

- `src/`: aplicação e rotas de API.
- `prisma/`: esquema e dados iniciais.
- `apresentacao/`: materiais de apresentação e identidade visual.
- `public/marca/`: arquivos de marca usados pela aplicação.
- `scripts/`: scripts auxiliares.

Documentos acadêmicos de origem e dados da pesquisa ficam fora do repositório público.
