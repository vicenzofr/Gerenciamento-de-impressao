# Gerenciamento de impressão 3D

Projeto acadêmico com interface React + TypeScript, API Node.js e banco relacional **SQLite**, usando SQL explícito para criar tabelas e consultar, cadastrar e excluir dados.

## Como executar

Requisito: **Node.js 24 ou superior**, com npm. Execute na pasta do projeto:

```powershell
npm.cmd ci
npm.cmd run dev
```

No Windows, `npm.cmd` funciona mesmo quando o PowerShell bloqueia scripts `.ps1`. Em outros sistemas, use `npm`.

Abra o endereço exibido pelo Vite, normalmente **http://localhost:5173**. O comando inicia a interface e a API (porta 3001). Encerre ambos com Ctrl+C.

O banco **data/printing.sqlite** é criado automaticamente no primeiro início. A carga de exemplos ocorre somente nessa criação; reiniciar o sistema não recria registros excluídos. O banco de cada instalação fica fora do Git. Não é necessário instalar um servidor de banco separado.

Para executar a versão compilada:

```powershell
npm.cmd run build
npm.cmd start
```

Depois, acesse **http://localhost:3001**. A API também serve a interface compilada.

## O que está integrado nesta entrega

- Consulta no banco das três etapas: Na Fila, Em Produção e Verificar.
- Consulta das impressoras e dos blocos de horário da linha do tempo.
- Cadastro de nova impressão com impressora, nome do arquivo e duração.
- Agendamento calculado no servidor com os horários atuais do banco. Sem espaço no dia, o trabalho fica na fila sem reserva.
- Exclusão persistente em qualquer uma das três etapas, liberando a reserva vinculada.
- Mensagens de carregamento e falha; o cadastro só fecha depois de salvar com sucesso.
- Validação da entrada, consultas parametrizadas, chaves estrangeiras, índices e transações.

A entrega implementa a persistência das ações que já existiam na interface. O progresso, as temperaturas e o estado online são exemplos armazenados no banco: ainda não há comunicação com impressoras físicas nem atualização de telemetria. Também não há login, upload real do G-code, mudança de etapa pela tela ou calendário de vários dias. A linha do tempo representa um quadro de 24 horas, como na interface original. Os tempos e as reservas dos exemplos preservam as amostras do projeto; novos cadastros reservam exatamente a duração informada.

## Estrutura e SQL para apresentar

- **server/schema.sql**: tabelas, relacionamentos, índices e gatilhos contra sobreposição de horários.
- **server/seed.sql**: dados iniciais de demonstração.
- **server/database.mjs**: acesso ao SQLite, SELECT, INSERT, DELETE e transações.
- **server/app.mjs**: rotas HTTP e validação das requisições.
- **src/lib/api.ts**: chamadas da interface à API.
- **src/pages/Dashboard.tsx**: dados da tela carregados a partir do banco.

Modelo relacional:

- `printers`: uma impressora possui vários trabalhos e reservas.
- `print_jobs`: trabalho associado opcionalmente a uma impressora, com etapa, duração e informações de produção ou inspeção.
- `timeline_blocks`: reserva associada a uma impressora e opcionalmente a um trabalho. `ON DELETE CASCADE` libera a reserva quando o trabalho é excluído. Uma reserva independente pode representar uma calibração.

Durações e horários são armazenados como minutos inteiros. O cadastro do trabalho e da reserva é uma única transação: ambos são salvos juntos. Os parâmetros SQL usam `?`, sem concatenar dados do usuário na consulta.

Você pode abrir `data/printing.sqlite` em um visualizador de SQLite e demonstrar esta consulta:

```sql
SELECT j.file_name AS arquivo,
       p.name AS impressora,
       j.status AS etapa,
       j.duration_minutes AS duracao_minutos
FROM print_jobs AS j
LEFT JOIN printers AS p ON p.id = j.printer_id
ORDER BY j.created_at, j.id;
```

## API

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | /api/health | Confirma acesso ao banco |
| GET | /api/dashboard | Fila, produção, inspeção e linha do tempo |
| POST | /api/jobs | Cadastra e agenda uma impressão |
| DELETE | /api/jobs/:id | Remove o trabalho e sua reserva |

Corpo do cadastro:

```json
{ "fileName": "suporte_camera.gcode", "printer": "Ender 3 Pro", "hours": 1, "minutes": 30 }
```

A sugestão exibida na interface é uma prévia; o servidor recalcula o horário ao salvar, evitando conflito entre clientes. A API escuta apenas na máquina local. As variáveis de ambiente `PORT` e `DATABASE_PATH` permitem alterar a porta e o caminho do banco; não é necessário configurá-las para executar o projeto.

## Validação

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run lint
```

Os testes usam bancos temporários e verificam persistência após reabrir o arquivo, remoção das reservas, integridade relacional, validação, texto com SQL, agendamentos sem sobreposição e rotas HTTP. Eles não alteram o banco usado pelo aplicativo.

Para a apresentação: cadastre uma impressão, atualize a página, reinicie o servidor e mostre que o trabalho continua lá. Depois exclua o trabalho, atualize novamente e mostre que a reserva também desapareceu. Isso demonstra a integração real com o SQL. O percentual de conclusão depende dos requisitos definidos pelo professor.
