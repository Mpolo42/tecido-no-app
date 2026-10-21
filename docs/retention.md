# Retenção, descarte e limpeza operacional

## Decisões do responsável

Não há prazo clínico definido pelo código. O responsável pelo tratamento deve documentar finalidade, base aplicável, necessidade de cada campo, prazo por categoria, início da contagem, exceções de preservação e quem autoriza o descarte. Registros ativos não são apagados automaticamente por idade.

| Categoria | Decisão pendente de registro operacional |
| --- | --- |
| Cadastro e acompanhamento | Finalidade, prazo e condição de encerramento |
| Fotografia de lesão | Necessidade, prazo, acesso e relação com o cadastro |
| Evidência de consentimento e versão do aviso | Finalidade e preservação necessária |
| Logs técnicos e auditoria | Campos mínimos, prazo e responsáveis pelo acesso |
| Backups | Prazo, acesso, descarte e tratamento de exclusões após recuperação |

Não adote um prazo genérico de dias como regra para dados de saúde. Revise o plano com o responsável antes de automatizar descarte. A página de privacidade deve refletir o processo real e um canal de contato em funcionamento.

## Exclusão e fotografias

A exclusão administrativa exige autorização atual e MFA. A remoção de uma linha deve acionar a limpeza do objeto correspondente. Falhas de Storage entram em fila para nova tentativa; a exclusão de um registro não comprova, por si só, que todos os arquivos e backups foram descartados.

Uploads pendentes sem cadastro têm uma carência operacional de uma hora antes de se tornarem elegíveis à limpeza. Essa carência evita apagar uma imagem durante um envio em andamento; não é prazo de retenção clínica. A ação administrativa `cleanup` tenta novamente a fila. Monitore falhas e idade do item mais antigo; o mecanismo não cria um agendamento automático.

Revise objetos legados sem vínculo antes de removê-los, com inventário por identificador e sem publicar nomes ou fotos. Não exclua arquivos ativos por semelhança de nome. Registre o resultado por contagem e referência interna, sem conteúdo clínico.

## Metadados de prevenção de abuso

O cadastro usa cotas por identidade derivada em hash, limite de cinco envios por hora e limite global de cem envios por dia. Um desafio de prova de trabalho de 14 bits, honeypot e nonce assinado de uso único dificultam automação sem fornecedor externo. Esses controles reduzem abuso, mas não garantem identificar uma pessoa: infraestrutura compartilhada pode agregar usuários e gerar bloqueios legítimos.

Contadores de limitação expirados são elegíveis à limpeza após um dia e nonces após sete dias, conforme a migração. São prazos técnicos para esse mecanismo, independentes da retenção dos cadastros. Não registre IP bruto, payload clínico ou imagem em mensagens de erro. A revisão operacional deve confirmar que a rotina de limpeza é executada e que o volume desses metadados permanece limitado.

## Pedido de titular e recuperação

O responsável valida a identidade sem coletar dados desnecessários, localiza o registro pelo fluxo restrito, decide o pedido e registra o atendimento. Cópias operacionais devem seguir a decisão de descarte; backups permanecem sujeitos ao ciclo definido e ao controle de acesso. Antes de restaurar um backup, reaplique exclusões posteriores para evitar reintroduzir dados descartados.
