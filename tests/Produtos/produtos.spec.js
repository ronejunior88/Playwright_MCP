const { test, expect } = require('@playwright/test');
const {
  BASE_URL,
  buildProduct,
  buildUser,
  createAdminSession,
  loginUser,
} = require('../library.spec');

test.describe('ServeRest - Produtos', () => {
  let adminSession;
  let createdProductIds;

  test.beforeEach(async ({ request }) => {
    createdProductIds = [];
    adminSession = await createAdminSession(request);
  });

  test.afterEach(async ({ request }) => {
    for (const productId of createdProductIds) {
      await request.delete(`${BASE_URL}/produtos/${productId}`, {
        headers: { Authorization: adminSession.authorization },
      });
    }

    await request.delete(`${BASE_URL}/usuarios/${adminSession.userId}`);
  });

  async function createProduct(request, product = buildProduct()) {
    const response = await request.post(`${BASE_URL}/produtos`, {
      headers: { Authorization: adminSession.authorization },
      data: product,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    createdProductIds.push(body._id);

    return body;
  }

  test('deve listar produtos cadastrados', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/produtos`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('produtos');
    expect(Array.isArray(body.produtos)).toBeTruthy();
  });

  test('deve cadastrar um produto como administrador', async ({ request }) => {
    const product = buildProduct();
    const body = await createProduct(request, product);

    expect(body).toHaveProperty('_id');
    expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
  });

  test('não deve cadastrar produto com nome duplicado', async ({ request }) => {
    const product = buildProduct();
    await createProduct(request, product);

    const response = await request.post(`${BASE_URL}/produtos`, {
      headers: { Authorization: adminSession.authorization },
      data: product,
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Já existe produto com esse nome');
  });

  test('deve buscar um produto por ID', async ({ request }) => {
    const product = buildProduct();
    const createdProduct = await createProduct(request, product);

    const response = await request.get(`${BASE_URL}/produtos/${createdProduct._id}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toBe(createdProduct._id);
    expect(body.nome).toBe(product.nome);
  });

  test('deve atualizar um produto existente', async ({ request }) => {
    const createdProduct = await createProduct(request);
    const updatedProduct = buildProduct({ nome: `Produto atualizado ${Date.now()}` });

    const response = await request.put(`${BASE_URL}/produtos/${createdProduct._id}`, {
      headers: { Authorization: adminSession.authorization },
      data: updatedProduct,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Registro alterado com sucesso');

    const getResponse = await request.get(`${BASE_URL}/produtos/${createdProduct._id}`);
    const updatedBody = await getResponse.json();
    expect(updatedBody.nome).toBe(updatedProduct.nome);
  });

  test('deve excluir um produto existente', async ({ request }) => {
    const createdProduct = await createProduct(request);

    const response = await request.delete(`${BASE_URL}/produtos/${createdProduct._id}`, {
      headers: { Authorization: adminSession.authorization },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toMatch(/Registro excluído com sucesso/);
  });

  test('não deve cadastrar produto sem token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/produtos`, {
      data: buildProduct(),
    });

    expect(response.status()).toBe(401);
  });

  test('não deve permitir cadastro por usuário comum', async ({ request }) => {
    const user = buildUser();
    const createUserResponse = await request.post(`${BASE_URL}/usuarios`, { data: user });

    expect(createUserResponse.status()).toBe(201);
    const userBody = await createUserResponse.json();

    try {
      const login = await loginUser(request, user.email, user.password);
      const response = await request.post(`${BASE_URL}/produtos`, {
        headers: { Authorization: login.authorization },
        data: buildProduct(),
      });

      expect(response.status()).toBe(403);
    } finally {
      await request.delete(`${BASE_URL}/usuarios/${userBody._id}`);
    }
  });
});