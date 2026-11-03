const { test, expect } = require('@playwright/test');
const {
  BASE_URL,
  buildCart,
  buildProduct,
  createAdminSession,
  createUserSession,
} = require('../library.spec');

test.describe('ServeRest - Carrinhos', () => {
  let adminSession;
  let buyerSession;
  let product;
  let productId;

  test.beforeEach(async ({ request }) => {
    adminSession = undefined;
    buyerSession = undefined;
    product = buildProduct();
    productId = undefined;

    adminSession = await createAdminSession(request);
    buyerSession = await createUserSession(request);

    const response = await request.post(`${BASE_URL}/produtos`, {
      headers: { Authorization: adminSession.authorization },
      data: product,
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    productId = body._id;
  });

  test.afterEach(async ({ request }) => {
    if (buyerSession) {
      await request.delete(`${BASE_URL}/carrinhos/cancelar-compra`, {
        headers: { Authorization: buyerSession.authorization },
      });
    }

    if (adminSession && productId) {
      await request.delete(`${BASE_URL}/produtos/${productId}`, {
        headers: { Authorization: adminSession.authorization },
      });
    }

    if (buyerSession) {
      await request.delete(`${BASE_URL}/usuarios/${buyerSession.userId}`);
    }

    if (adminSession) {
      await request.delete(`${BASE_URL}/usuarios/${adminSession.userId}`);
    }
  });

  async function addProductToCart(request, quantity = 1, id = productId) {
    return request.post(`${BASE_URL}/carrinhos`, {
      headers: { Authorization: buyerSession.authorization },
      data: buildCart([{ idProduto: id, quantidade: quantity }]),
    });
  }

  async function getProduct(request) {
    const response = await request.get(`${BASE_URL}/produtos/${productId}`);
    expect(response.status()).toBe(200);
    return response.json();
  }

  test('deve listar carrinhos cadastrados', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/carrinhos`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('carrinhos');
    expect(Array.isArray(body.carrinhos)).toBeTruthy();
    expect(body).toHaveProperty('quantidade');
  });

  test('deve cadastrar e consultar o carrinho do usuário', async ({ request }) => {
    const response = await addProductToCart(request, 2);

    expect(response.status()).toBe(201);

    const createdCart = await response.json();
    const getResponse = await request.get(`${BASE_URL}/carrinhos/${createdCart._id}`);

    expect(getResponse.status()).toBe(200);

    const cart = await getResponse.json();
    expect(cart._id).toBe(createdCart._id);
    expect(cart.idUsuario).toBe(buyerSession.userId);
    expect(cart.quantidadeTotal).toBe(2);
    expect(cart.produtos[0].idProduto).toBe(productId);
    expect((await getProduct(request)).quantidade).toBe(product.quantidade - 2);
  });

  test('não deve permitir mais de um carrinho por usuário', async ({ request }) => {
    const firstResponse = await addProductToCart(request);
    expect(firstResponse.status()).toBe(201);

    const secondResponse = await addProductToCart(request);

    expect(secondResponse.status()).toBe(400);

    const body = await secondResponse.json();
    expect(body.message).toMatch(/mais de 1 carrinho/i);
  });

  test('não deve permitir produtos duplicados no mesmo carrinho', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/carrinhos`, {
      headers: { Authorization: buyerSession.authorization },
      data: buildCart([
        { idProduto: productId, quantidade: 1 },
        { idProduto: productId, quantidade: 1 },
      ]),
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/produto duplicado/i);
  });

  test('não deve adicionar produto inexistente', async ({ request }) => {
    const response = await addProductToCart(request, 1, 'id-inexistente');

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/produto não encontrado/i);
  });

  test('não deve exceder o estoque disponível', async ({ request }) => {
    const response = await addProductToCart(request, product.quantidade + 1);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/quantidade suficiente/i);
  });

  test('deve restaurar o estoque ao cancelar a compra', async ({ request }) => {
    const createResponse = await addProductToCart(request, 2);
    expect(createResponse.status()).toBe(201);

    const reducedProduct = await getProduct(request);
    expect(reducedProduct.quantidade).toBe(product.quantidade - 2);

    const cancelResponse = await request.delete(`${BASE_URL}/carrinhos/cancelar-compra`, {
      headers: { Authorization: buyerSession.authorization },
    });

    expect(cancelResponse.status()).toBe(200);
    expect((await getProduct(request)).quantidade).toBe(product.quantidade);
  });

  test('deve remover o carrinho ao concluir a compra sem devolver o estoque', async ({ request }) => {
    const createResponse = await addProductToCart(request, 2);
    expect(createResponse.status()).toBe(201);
    const createdCart = await createResponse.json();

    const finishResponse = await request.delete(`${BASE_URL}/carrinhos/concluir-compra`, {
      headers: { Authorization: buyerSession.authorization },
    });

    expect(finishResponse.status()).toBe(200);
    expect((await getProduct(request)).quantidade).toBe(product.quantidade - 2);

    const getCartResponse = await request.get(`${BASE_URL}/carrinhos/${createdCart._id}`);
    expect(getCartResponse.status()).toBe(400);
  });

  test('não deve excluir produto que pertence a carrinho ativo', async ({ request }) => {
    const cartResponse = await addProductToCart(request);
    expect(cartResponse.status()).toBe(201);

    const deleteResponse = await request.delete(`${BASE_URL}/produtos/${productId}`, {
      headers: { Authorization: adminSession.authorization },
    });

    expect(deleteResponse.status()).toBe(400);

    const body = await deleteResponse.json();
    expect(body.message).toMatch(/faz parte de carrinho/i);
  });

  test('não deve cadastrar carrinho sem token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/carrinhos`, {
      data: buildCart([{ idProduto: productId, quantidade: 1 }]),
    });

    expect(response.status()).toBe(401);
  });
});