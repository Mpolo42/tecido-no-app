# Tecido Nô

Aplicação React/Vite de orientação sobre o pé diabético, cadastro de interessados e atendimento administrativo. Dados pessoais passam por Supabase Edge Functions; a autorização administrativa também é conferida no servidor e no banco.

## Preparação

Use Node.js 24.16.0 e npm 11.17.0. As dependências diretas e o lockfile têm versões fixadas.

```sh
npm ci
```

Copie `.env.example` para `.env.local` e configure somente a URL e a chave pública `anon` do projeto de teste. Variáveis `VITE_*` são públicas. A chave `service_role` permanece exclusivamente no runtime das Edge Functions.

Antes de iniciar desenvolvimento conectado, confirme o projeto e o ambiente descritos em [implantação](docs/deployment.md). Não use a base de produção para testes de formulário.

```sh
npm run lint
npm test
npm run build
npm run dev
```

Os testes SQL ficam em `supabase/tests` e usam pgTAP em banco local descartável. A CI executa lint, testes Node, auditoria das dependências de runtime, build e testes de autorização do banco sem segredos de produção. Avisos de ferramentas de build são relatados separadamente para análise de alcance.

## Operação

- [Implantação, ambientes e administração](docs/deployment.md)
- [Backup, restauração e resposta a incidentes](docs/restore.md)
- [Retenção e descarte](docs/retention.md)

O código de segurança só protege produção depois que migrações, funções e frontend forem publicados e verificados no mesmo ambiente. A existência deste repositório não comprova que essa publicação foi realizada.
