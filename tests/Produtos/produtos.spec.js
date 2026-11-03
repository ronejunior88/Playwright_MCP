const { test, expect } = require('@playwright/test');
const { ProductsApi } = require('../api/products-api');
const { UsersApi } = require('../api/users-api');
const {
  buildProduct,
  buildUser,
  createAdminSession,
  loginUser,
} = require('../library.spec');

test.describe('ServeRest - Produtos', () => {
  let adminSession;
  let createdProductIds;
  let productsApi;
  let usersApi;

  test.beforeEach(async ({ request }) => {
    createdProductIds = [];
    productsApi = new ProductsApi(request);
    usersApi = new UsersApi(request);
    adminSession = await createAdminSession(request);
  });

  test.afterEach(async () => {
    for (const productId of createdProductIds) {
      await productsApi.delete(productId, adminSession.authorization);
    }

    await usersApi.delete(adminSession.userId);
  });

  async function createProduct(product = buildProduct()) {
    const response = await productsApi.create(product, adminSession.authorization);

    expect(response.status()).toBe(201);
    const body = await response.json();
    createdProductIds.push(body._id);

    return body;
  }

  test('deve listar produtos cadastrados', async () => {
    const response = await productsApi.list();

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('produtos');
    expect(Array.isArray(body.produtos)).toBeTruthy();
  });

  test('deve cadastrar um produto como administrador', async () => {
    const product = buildProduct();
    const body = await createProduct(product);

    expect(body).toHaveProperty('_id');
    expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
  });

  test('não deve cadastrar produto com nome duplicado', async () => {
    const product = buildProduct();
    await createProduct(product);

    const response = await productsApi.create(product, adminSession.authorization);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Já existe produto com esse nome');
  });

  test('deve buscar um produto por ID', async () => {
    const product = buildProduct();
    const createdProduct = await createProduct(product);

    const response = await productsApi.getById(createdProduct._id);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toBe(createdProduct._id);
    expect(body.nome).toBe(product.nome);
  });

  test('deve atualizar um produto existente', async () => {
    const createdProduct = await createProduct();
    const updatedProduct = buildProduct({ nome: `Produto atualizado ${Date.now()}` });

    const response = await productsApi.update(
      createdProduct._id,
      updatedProduct,
      adminSession.authorization,
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Registro alterado com sucesso');

    const getResponse = await productsApi.getById(createdProduct._id);
    const updatedBody = await getResponse.json();
    expect(updatedBody.nome).toBe(updatedProduct.nome);
  });

  test('deve excluir um produto existente', async () => {
    const createdProduct = await createProduct();

    const response = await productsApi.delete(createdProduct._id, adminSession.authorization);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toMatch(/Registro excluído com sucesso/);
  });

  test('não deve cadastrar produto sem token', async () => {
    const response = await productsApi.create(buildProduct());

    expect(response.status()).toBe(401);
  });

  test('não deve permitir cadastro por usuário comum', async ({ request }) => {
    const user = buildUser();
    const createUserResponse = await usersApi.create(user);

    expect(createUserResponse.status()).toBe(201);
    const userBody = await createUserResponse.json();

    try {
      const login = await loginUser(request, user.email, user.password);
      const response = await productsApi.create(buildProduct(), login.authorization);

      expect(response.status()).toBe(403);
    } finally {
      await usersApi.delete(userBody._id);
    }
  });
});