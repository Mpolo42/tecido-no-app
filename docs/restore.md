# Backup, restauração e incidentes

## Preparação e evidência

O responsável pela operação define e registra RPO (perda de dados tolerável), RTO (tempo de recuperação), frequência, prazo e local dos backups. Confirme no plano contratado a disponibilidade real de backup e recuperação pontual; o repositório não provisiona nem comprova esses serviços.

Banco e Storage precisam de recuperação conjunta. O backup do banco preserva referências e metadados, mas não substitui a cópia dos arquivos das lesões. Mantenha backup de objetos em armazenamento privado, criptografado e com acesso restrito. Não publique dumps, imagens, tokens ou links assinados em issues, logs ou artefatos GitHub.

Registre para cada cópia o identificador, horário, escopo, versão da aplicação, integridade e resultado do teste de restauração. Use credenciais do operador pelo mecanismo seguro do provedor, sem passá-las por argumentos de terminal ou incluí-las neste documento.

## Ensaio de recuperação

1. Selecione um backup e um commit compatíveis. Crie um destino isolado autorizado e bloqueie tráfego externo. Use dados sintéticos quando não houver necessidade de recuperar dados reais.
2. Restaure o banco pelo mecanismo documentado do provedor. Restaure os objetos privados correspondentes, preservando a associação com os registros.
3. Compare versões de migrações. Reaplique apenas alterações ausentes e revisadas; não execute reset remoto para sincronizar histórico.
4. Verifique RLS, grants, privacidade do bucket, funções, usuários administrativos e MFA. Execute a matriz de acesso sem registrar conteúdos de pacientes. Confirme que uma fotografia restaurada não possui URL pública.
5. Teste um fluxo sintético completo, exclusão e fila de limpeza. Registre duração e perda efetiva de dados. Ajuste o plano se RPO/RTO não forem alcançados.
6. Remova o ambiente de ensaio quando autorizado, incluindo cópias de dados reais e credenciais temporárias. Preserve somente a evidência operacional mínima.

O primeiro ensaio e a periodicidade devem ter responsável e data definidos antes de considerar a recuperação operacional validada.

## Recuperação de produção

Em incidente, suspenda novas gravações pelo controle de manutenção autorizado e preserve evidências mínimas. Identifique o último estado íntegro antes de restaurar: restaurar um backup pode reintroduzir permissões antigas, arquivos públicos ou registros que já deveriam ter sido excluídos.

Prepare e teste a restauração em destino isolado. Registre o intervalo de dados perdido e as decisões do responsável. Revalide as proteções e reaplique pedidos de exclusão posteriores ao backup antes de reabrir acesso.

Um rollback do frontend na Vercel não desfaz mudanças no banco nem nas Edge Functions. Antes de voltar um deployment, confirme compatibilidade com o schema atual. Prefira correção progressiva quando reverter permissões reabriria acesso indevido. Publique o frontend compatível somente depois da verificação das funções e dos dados.

Para suspeita de comprometimento, revogue acessos e sessões afetados e faça a rotação necessária diretamente no provedor; nunca transfira valores pelo chat ou pelos logs. O responsável pelo tratamento avalia comunicações e demais obrigações aplicáveis, com apoio adequado. Este documento não afirma conformidade jurídica.
