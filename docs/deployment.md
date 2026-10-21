# Implantação e administração

## Alvos e separação de ambientes

O alvo de produção indicado é o projeto Vercel `mpolo-42s-projects/tecido-no-app`, domínio `https://tecido-no-app-inky.vercel.app`, com Supabase `rmgjmyxazwzgfztastqx`. Uma preview que aponta para esse Supabase também acessa produção: use projeto Supabase separado e dados sintéticos para homologação. Revise o `connect-src` em `vercel.json` ao trocar de projeto.

Antes de executar desenvolvimento conectado, migrações ou releases, confira repositório, commit, equipe, projeto e ambiente. A CLI Vercel 64.7.0 foi consultada em 20/10/2026 e retornou `Logged out`. Não foi realizado login, vínculo nem deploy por essa CLI. A publicação do frontend pode usar a integração Git existente, após revisão e confirmação desses alvos no painel.

Não registre arquivos `.env`, `.vercel`, credenciais ou exports de pacientes no Git nem como artefatos da CI. Não imprima valores secretos para verificar configuração: confira os nomes das variáveis e o ambiente ao qual pertencem.

## Variáveis

| Nome | Local | Finalidade |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vercel / `.env.local` de teste | URL pública do Supabase do ambiente |
| `VITE_SUPABASE_ANON_KEY` | Vercel / `.env.local` de teste | Chave pública `anon` legada compatível com o gateway das funções |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Runtime padrão das Edge Functions | Acesso ao projeto e validação do usuário |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente runtime padrão das Edge Functions | Operações internas privilegiadas após validação no servidor |
| `ALLOWED_ORIGINS` | Runtime das Edge Functions, opcional | Origens adicionais explícitas, separadas por vírgula |

Todo nome iniciado por `VITE_` entra no JavaScript público. Não crie `VITE_SUPABASE_SERVICE_ROLE_KEY`. As funções mantêm `verify_jwt=true`; uma migração para chaves publishable novas exige revisar essa compatibilidade antes da troca. Não desative a verificação como correção de um erro de chave.

As origens padrão incluem o domínio oficial e loopback de desenvolvimento. CORS limita o navegador, mas não autentica clientes nem substitui as cotas e a autorização. Nunca use `*` para liberar previews; inclua somente a origem exata aprovada e remova-a ao encerrar o teste.

## Validação antes da publicação

```sh
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Use a CLI Supabase 2.121.0 e Docker para a matriz de autorização no banco local descartável. Não acrescente `--linked`, URL remota ou senha a estes comandos:

```sh
npx --yes supabase@2.121.0 db start
npx --yes supabase@2.121.0 db reset --local --no-seed
npx --yes supabase@2.121.0 test db --local
```

O reset apaga somente a base local indicada por `--local`. A CI executa esses comandos em runner descartável; não utiliza segredos de Supabase ou Vercel. Ela não publica código nem aplica migrações remotas. Os checks são `quality` e `database-security`.

## Ordem da publicação

1. Registre o commit revisado e um ponto de recuperação com backup verificado de banco e arquivos. Confirme o histórico remoto de migrações; em projeto existente, reconcilie a baseline antes de aplicar novas migrações. Não marque alterações desconhecidas como aplicadas.
2. Confirme RLS, grants e privacidade do bucket contra os testes. Aplique as migrações revisadas ao Supabase correto por uma sessão autorizada. Inspecione o plano antes de executá-lo; nunca use `db reset --linked` em produção.
3. Publique `patient-intake` e `patient-admin` com `verify_jwt=true`. Os segredos padrão ficam no runtime. Verifique o funcionamento das funções antes de liberar o frontend.
4. Configure as duas variáveis públicas no ambiente Vercel correspondente e publique o commit pela integração Git. O build é `npm run build`, instalação `npm ci --no-fund` e saída `dist`. Node.js deve usar 24.x.
5. No Auth do Supabase, confira Site URL, lista exata de redirecionamentos de recuperação e MFA TOTP. Cadastros públicos de contas administrativas devem permanecer desabilitados. Não envie emails de teste a terceiros.
6. Na homologação, execute um cadastro sintético com e sem imagem; teste erros, cotas e duplicação. Confirme que visitante, usuário comum e administrador sem MFA não conseguem ler, excluir ou obter fotos. Administrador com segundo fator deve conseguir apenas as ações previstas.
7. Confirme os headers HTTP, navegação direta nas rotas e ausência de erros de CSP. O rewrite SPA original para `/index.html` foi preservado. A CSP bloqueia scripts externos; recursos como toolbar de preview precisam de revisão específica, sem liberar curingas.

Não use dados clínicos reais nos testes. A publicação está concluída somente após essa verificação no ambiente publicado.

## Concessão e revogação de administração

Uma conta autenticada não recebe autorização por existir no Auth. O registro de autorização fica em `private.admin_users`, ligado ao `user_id` de `auth.users`; `public.admin_access()` permite consultar a própria autorização. O acesso aos dados exige MFA em nível `aal2` no servidor e nas políticas. Não use `user_metadata` editável pelo cliente para conceder papel.

Um operador autorizado deve conferir a identidade e o UUID do usuário no painel, conceder acesso pela tabela privada e registrar apenas referência interna, responsável e horário da decisão. Nunca inclua email real, senha ou UUID de administrador em seed público. O administrador cadastra TOTP e confirma um código antes de acessar dados.

Para revogar, remova a autorização da tabela privada e encerre as sessões no Auth. Confira a negação de uma sessão já emitida; o servidor deve consultar a autorização atual, sem depender de um papel antigo em JWT. Não conceda privilégios a contas de teste em produção.

## Proteção do repositório

Na inspeção de 19/10/2026, `main` apontava para `a77f40798b7feb5e0c0a4b88e060fd750940fe71`, estava com `protected=false` e sem rulesets. O endpoint detalhado de proteção retornou `403 Resource not accessible by integration`; esta integração não administra essas configurações.

Depois de a CI executar e seus nomes serem registrados no GitHub, o proprietário deve proteger `main`: exigir pull request, revisão independente, resolução de conversas e os checks `quality` e `database-security`; restringir force push e exclusão. Revise exceções de bypass. Dependabot abre atualizações semanais de npm e Actions, que continuam sujeitas à revisão. Essa configuração de conta não é aplicada pela presença dos arquivos no repositório.
