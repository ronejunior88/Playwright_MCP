# Playwright MCP

Automacao de testes da API publica ServeRest com Node.js e Playwright Test.

## Escopo

A suite valida as regras de negocio de Login, Usuarios, Produtos e Carrinhos em `https://serverest.dev`. Os testes sao de API: usam o fixture `request` do Playwright e verificam respostas HTTP e estado dos recursos. Nao ha testes de navegador ou interface neste repositorio.

## Estrutura

```text
tests/
|-- api/
|   |-- api-client.js
|   |-- login-api.js
|   |-- users-api.js
|   |-- products-api.js
|   `-- carts-api.js
|-- Login/login.spec.js
|-- Usuario/usuario.spec.js
|-- Produtos/produtos.spec.js
|-- Carrinhos/carrinhos.spec.js
`-- library.js
scripts/run-tests.js
playwright.config.js
```

### Clientes API

Cada classe em `tests/api` encapsula as operacoes HTTP de um recurso:

- `ApiClient`: URL base, query strings e header de autorizacao.
- `LoginApi`: autenticacao.
- `UsersApi`: listagem, busca, cadastro, edicao e exclusao de usuarios.
- `ProductsApi`: listagem, busca e CRUD de produtos, com token nas operacoes protegidas.
- `CartsApi`: listagem, busca, cadastro, conclusao e cancelamento de carrinhos.

Os clientes retornam a resposta HTTP. Os specs mantem os asserts de status, mensagem, payload e regras de negocio. Como a suite testa API, esse padrao de clientes por recurso e o adequado aqui; Page Object Model (POM) e destinado a paginas e elementos de interface. Caso testes de UI sejam adicionados, devem ter uma camada de Page Objects separada.

`tests/library.js` contem dados e helpers compartilhados, como geracao de e-mail unico, builders de usuario/produto/carrinho e criacao de sessoes comum e administradora. A configuracao do Playwright limita a descoberta aos specs JavaScript dentro de `tests/`.

## Cobertura Atual

### Login - 2 testes

- Autenticacao com credenciais validas e verificacao do token.
- Rejeicao de senha invalida.

### Usuarios - 6 testes

- Cadastro valido e bloqueio de e-mail duplicado.
- Listagem, busca por ID e resposta para ID inexistente.
- Edicao de usuario.
- Exclusao de usuario sem carrinho e verificacao da remocao.
- Os usuarios criados sao removidos ao final de cada teste.

### Produtos - 8 testes

- Listagem, cadastro, busca por ID, edicao e exclusao.
- Bloqueio de nome duplicado.
- Bloqueio de cadastro sem token.
- Bloqueio de cadastro por usuario comum.

### Carrinhos - 10 testes

- Listagem, cadastro e consulta de carrinho vinculado ao usuario autenticado.
- Limite de um carrinho por usuario e bloqueio de produtos duplicados.
- Bloqueio de produto inexistente e de quantidade acima do estoque.
- Restauracao do estoque ao cancelar e manutencao do estoque consumido ao concluir.
- Bloqueio de exclusao de produto associado a carrinho ativo.
- Bloqueio de cadastro sem token.

Os testes de Carrinhos preparam usuarios, sessoes e produtos exclusivos. O cleanup cancela o carrinho antes de remover produto e usuarios, evitando deixar estoque ou dados de teste pendentes.

## Executar

Requisitos: Node.js, npm e acesso de rede ao ServeRest.

Instale as dependencias:

```bash
npm install
```

Execute todos os specs atuais:

```bash
npm test
```

Execute apenas um recurso, por exemplo:

```bash
npx playwright test tests/Carrinhos/carrinhos.spec.js --reporter=line
```

O login cria um usuario exclusivo para cada teste e remove esse usuario ao final, evitando dependencia de contas compartilhadas na API publica.

## Padroes para Novos Testes

1. Mantenha cada spec em uma pasta com o nome do recurso e use nomes descritivos terminados em `.spec.js`.
2. Adicione chamadas HTTP novas no cliente do recurso em `tests/api`; nao monte URLs nem headers diretamente no spec.
3. Use o fluxo Arrange, Act, Assert: preparar os dados, executar uma acao e verificar resposta e efeito de negocio.
4. Mantenha os testes independentes e executaveis em qualquer ordem; nao dependa de dados criados por outro teste.
5. Gere e-mails e nomes de recursos unicos para evitar colisao com dados compartilhados da API publica.
6. Crie sessoes com o perfil necessario e envie o token apenas para rotas protegidas.
7. Limpe os recursos criados. Para carrinhos, cancele a compra antes da remocao de usuario ou produto para restaurar o estoque.
8. Verifique status HTTP, campos relevantes do payload e estado resultante quando a regra envolver estoque, autorizacao ou persistencia.
9. Ao alterar um recurso, execute primeiro seu spec e depois todos os specs listados no comando acima.
