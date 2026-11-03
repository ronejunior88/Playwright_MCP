# Plano de testes da API ServeRest

## Application Overview

Plano de qualidade para a API pública ServeRest, tomando como referência a documentação em português https://serverest.dev/?lang=pt-BR e a suíte existente no repositório. O repositório contém 26 testes (Login 2, Usuários 6, Produtos 8, Carrinhos 10); a inspeção identificou lacunas de validação e isolamento. O repositório não contém testes de interface; o alvo é a API REST. Os casos devem seguir os contratos e status/mensagens descritos na documentação oficial vigente.

## Ajustes já aplicados

- `playwright.config.js` limita a descoberta aos specs JavaScript dentro de `tests/`; o helper foi renomeado de `library.spec.js` para `library.js` e o seed vazio foi removido.
- Os testes de login criam credenciais exclusivas e removem o usuário criado, sem depender de contas públicas fixas.
- Os testes de usuários removem os registros criados mesmo quando uma asserção falha, verificam a resposta de exclusão e cobrem a consulta de ID inexistente.
- O helper de criação de sessão remove o usuário se a autenticação falhar.

Os cenários abaixo marcados como novos continuam sendo recomendações futuras, salvo quando descritos entre os ajustes já aplicados.

## Test Scenarios

### 1. Login e autenticação

#### 1.1. Autenticar com credenciais válidas (existente)

**File:** `tests/Login/login.spec.js`

**Steps:**
  1. Preparar um usuário válido em estado independente ou utilizar credenciais públicas válidas explicitamente documentadas; enviar POST /login com email e password válidos.
    - expect: A API responde HTTP 200.
    - expect: O corpo contém mensagem de sucesso e authorization não vazia no formato Bearer.
    - expect: O token pode ser usado em uma operação protegida quando esse comportamento fizer parte do contrato.
  2. Limpar qualquer usuário criado pelo cenário.
    - expect: Nenhum dado persistente criado pelo teste permanece na API compartilhada.

#### 1.2. Rejeitar senha inválida (existente)

**File:** `tests/Login/login.spec.js`

**Steps:**
  1. Enviar POST /login com e-mail existente e senha incorreta.
    - expect: A API responde com o status de autenticação inválida documentado (401).
    - expect: O corpo informa a falha e não entrega token de autorização.

#### 1.3. Rejeitar e-mail inexistente e credenciais obrigatórias ausentes (novo)

**File:** `tests/Login/login.spec.js`

**Steps:**
  1. Enviar tentativas independentes ao POST /login: e-mail não cadastrado, e-mail ausente e senha ausente.
    - expect: Cada solicitação é rejeitada com status e mensagem de validação documentados.
    - expect: Nenhuma tentativa inválida retorna authorization.

### 2. Usuários

#### 2.1. Cadastrar usuário válido e limpar o registro (existente com correção de isolamento)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Enviar POST /usuarios com nome, email exclusivo, password e administrador válidos.
    - expect: A API responde HTTP 201 com mensagem de sucesso e _id.
    - expect: GET /usuarios/{_id} retorna os dados cadastrados.
  2. Excluir o usuário criado, mesmo se uma asserção falhar, e confirmar a remoção pela API.
    - expect: A API confirma a exclusão.
    - expect: O usuário não permanece no ambiente compartilhado.

#### 2.2. Rejeitar e-mail duplicado (existente)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Cadastrar usuário com email exclusivo e enviar novamente o mesmo cadastro.
    - expect: A primeira chamada responde HTTP 201.
    - expect: A segunda é rejeitada com HTTP 400 e mensagem de conflito documentada.
    - expect: O usuário criado é removido ao final do teste.

#### 2.3. Listar e filtrar usuários (listagem existente; filtros novos)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Criar usuário com atributos identificáveis; consultar GET /usuarios sem filtros e com filtros documentados (por exemplo nome e email).
    - expect: As respostas são HTTP 200 e incluem usuarios e quantidade nos formatos documentados.
    - expect: Os filtros retornam o registro correspondente e não incluem registros que não atendem ao filtro.
    - expect: O usuário criado é removido ao final.

#### 2.4. Consultar usuário por ID e rejeitar ID inexistente (consulta existente; negativo novo)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Criar usuário exclusivo, consultar GET /usuarios/{_id} e consultar um ID inexistente em chamada independente.
    - expect: A consulta válida retorna HTTP 200 e o mesmo _id/email criado.
    - expect: A consulta inexistente retorna o erro documentado, sem simular sucesso.
    - expect: O usuário criado é removido ao final.

#### 2.5. Atualizar usuário e validar persistência (existente com assertions adicionais)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Criar usuário, enviar PUT /usuarios/{_id} com dados válidos e depois consultar o mesmo ID.
    - expect: A atualização retorna o status e mensagem de sucesso documentados.
    - expect: A consulta posterior contém os campos atualizados e o ID permanece estável.
    - expect: O usuário é removido ao final.

#### 2.6. Rejeitar cadastro e atualização com dados obrigatórios inválidos (novo)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Executar solicitações independentes para POST /usuarios com campos obrigatórios ausentes ou tipos inválidos e PUT em ID inexistente.
    - expect: Cada entrada inválida é rejeitada com status e mensagem documentados.
    - expect: Nenhum registro parcial ou sucesso falso é criado.
    - expect: Qualquer registro de preparação é removido.

#### 2.7. Excluir usuário sem carrinho e verificar remoção (existente com assertions adicionais)

**File:** `tests/Usuario/usuario.spec.js`

**Steps:**
  1. Criar usuário sem carrinho, excluí-lo e consultar novamente o ID.
    - expect: A exclusão retorna o status e mensagem de sucesso documentados.
    - expect: A consulta posterior informa que o usuário não existe.

### 3. Produtos

#### 3.1. Listar e filtrar produtos (listagem existente; filtros novos)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Consultar GET /produtos sem filtros e com filtros documentados usando um produto exclusivo criado para o teste.
    - expect: As respostas são HTTP 200 e apresentam produtos no formato documentado.
    - expect: O filtro retorna o produto correspondente e exclui resultados incompatíveis.
    - expect: O produto e o usuário administrador de preparação são removidos ao final.

#### 3.2. Cadastrar produto como administrador (existente)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Criar usuário administrador exclusivo, autenticar e enviar POST /produtos com nome exclusivo, preco, descricao e quantidade válidos.
    - expect: A API retorna HTTP 201, mensagem de sucesso e _id.
    - expect: GET /produtos/{_id} confirma os dados cadastrados.
    - expect: O produto e o usuário administrador são removidos ao final.

#### 3.3. Rejeitar produto duplicado e campos inválidos (duplicidade existente; validação nova)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Como administrador, cadastrar produto e repetir o mesmo nome; em solicitações independentes, omitir campos obrigatórios ou enviar tipos/valores inválidos.
    - expect: O nome repetido é rejeitado com HTTP 400 e mensagem documentada.
    - expect: Dados inválidos são rejeitados conforme o contrato e não geram produto parcial.
    - expect: Os produtos e usuário de preparação são removidos.

#### 3.4. Consultar produto por ID e rejeitar ID inexistente (consulta existente; negativo novo)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Criar produto exclusivo, buscar o ID existente e um ID inexistente.
    - expect: ID existente retorna HTTP 200 com os campos esperados.
    - expect: ID inexistente retorna o erro documentado.
    - expect: Produto e administrador são removidos ao final.

#### 3.5. Atualizar produto e verificar persistência (existente)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Criar produto e atualizá-lo via PUT /produtos/{_id} com token de administrador; consultar novamente.
    - expect: A atualização retorna sucesso documentado.
    - expect: A consulta posterior reflete os novos campos sem alterar o ID.
    - expect: Produto e administrador são removidos ao final.

#### 3.6. Excluir produto e verificar remoção (existente com assertions adicionais)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Criar produto, excluí-lo e consultar o ID após a exclusão.
    - expect: A exclusão retorna sucesso conforme documentação.
    - expect: A consulta posterior informa produto inexistente.

#### 3.7. Exigir autorização de administrador para operações protegidas (parte existente)

**File:** `tests/Produtos/produtos.spec.js`

**Steps:**
  1. Tentar cadastrar, atualizar e excluir produto com requisições sem token, token inválido e token de usuário comum; executar com administrador válido como controle.
    - expect: Requisições sem token ou token inválido recebem status de não autorizado documentado.
    - expect: Usuário comum recebe status de proibido documentado nas operações restritas.
    - expect: Administrador consegue executar a operação permitida.
    - expect: Nenhum recurso de teste fica sem limpeza.

### 4. Carrinhos e estoque

#### 4.1. Listar carrinhos (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Consultar GET /carrinhos sem filtros e com filtros documentados, incluindo consulta sem resultados.
    - expect: A API responde HTTP 200 com carrinhos e quantidade nos formatos documentados.
    - expect: Filtro sem correspondência retorna lista vazia e quantidade zero, conforme contrato.

#### 4.2. Criar carrinho, consultar dados e conferir estoque (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Preparar produto exclusivo com estoque conhecido e usuário comprador; criar carrinho autenticado com quantidade menor que o estoque e consultar o carrinho.
    - expect: A criação retorna HTTP 201 e identificador do carrinho.
    - expect: A consulta confirma comprador, produtos e quantidade total.
    - expect: O estoque diminui exatamente pela quantidade adicionada.
    - expect: No cleanup, cancelar carrinho ativo antes de excluir produto e usuários.

#### 4.3. Rejeitar segundo carrinho e produto repetido (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Criar um carrinho e tentar criar outro para o mesmo usuário; em outro teste independente, enviar o mesmo produto duplicado no payload.
    - expect: A segunda compra é rejeitada com status/mensagem documentados.
    - expect: Produtos duplicados no mesmo carrinho são rejeitados sem alteração indevida de estoque.
    - expect: O carrinho ativo é cancelado antes da limpeza.

#### 4.4. Rejeitar produto inexistente e estoque insuficiente (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Criar solicitações independentes com ID de produto inexistente, quantidade acima do estoque e quantidade inválida.
    - expect: Cada solicitação é rejeitada com status e mensagem documentados.
    - expect: Estoque e carrinhos permanecem inalterados após falha.

#### 4.5. Cancelar compra e restaurar estoque (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Criar carrinho que consome quantidade conhecida e cancelar a compra autenticado.
    - expect: Cancelamento retorna sucesso conforme documentação.
    - expect: Carrinho é removido e estoque retorna exatamente ao valor inicial.

#### 4.6. Concluir compra e manter estoque consumido (existente)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Criar carrinho e concluir compra autenticado; consultar carrinho e produto após a conclusão.
    - expect: Conclusão retorna sucesso documentado.
    - expect: Carrinho deixa de estar disponível para o usuário.
    - expect: O estoque permanece reduzido pela quantidade comprada e não é restaurado no cleanup.

#### 4.7. Proteger operações de carrinho e rejeitar consulta inexistente (lacuna)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Tentar criar, cancelar e concluir carrinho sem token e com token inválido; buscar ID de carrinho inexistente; tentar excluir produto vinculado a carrinho ativo.
    - expect: Operações protegidas rejeitam autenticação ausente/inválida conforme a documentação.
    - expect: Consulta inexistente retorna erro documentado.
    - expect: Produto associado a carrinho ativo não é removido.
    - expect: Dados e estoque são restaurados por cancelamento antes da limpeza.

#### 4.8. Validar carrinho vazio, payload ausente e quantidades inválidas (lacuna)

**File:** `tests/Carrinhos/carrinhos.spec.js`

**Steps:**
  1. Enviar carrinho sem produtos, sem campo produtos e com quantidade zero, negativa ou tipo incompatível, em chamadas independentes.
    - expect: A API rejeita payloads inválidos com status e mensagem documentados.
    - expect: Não é criado carrinho nem há alteração de estoque.
    - expect: Toda preparação é cancelada e removida.

### 5. Qualidade, isolamento e execução

#### 5.1. Manter helpers fora da descoberta de testes e garantir limpeza/execução confiável

**File:** `tests/library.js`

**Steps:**
  1. Confirmar que a configuração executa somente specs reais, sem incluir helpers nem o seed vazio removido.
    - expect: npm test executa apenas testes intencionais e retorna status de falha quando algum teste falha.
    - expect: A suíte não tenta executar helper como spec e não exibe execução bem-sucedida sem testes.
    - expect: A contagem executada coincide com os specs reais selecionados.
  2. Executar cada spec de recurso isoladamente e a suíte completa, em ordem aleatória ou paralela suportada, verificando ambiente compartilhado após os testes.
    - expect: Os testes não dependem de ordem nem de dados criados por outros testes.
    - expect: Identificadores e nomes são exclusivos; cleanup roda inclusive após falhas, seguindo cancelamento de carrinho antes da remoção de produto/usuário.
    - expect: Nenhum dado de teste permanece na API compartilhada e todos os status, mensagens, payloads e efeitos de estoque são verificados.
