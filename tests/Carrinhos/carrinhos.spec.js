const { test, expect } = require('@playwright/test');
const { CartsApi } = require('../api/carts-api');
const { ProductsApi } = require('../api/products-api');
const { UsersApi } = require('../api/users-api');
const {
  buildCart,
  buildProduct,
  createAdminSession,
  createUserSession,
} = require('../library');

test.describe('ServeRest - Carrinhos', () => {
  let adminSession;
  let buyerSession;
  let product;
  let productId;
  let cartsApi;
  let productsApi;
  let usersApi;

  test.beforeEach(async ({ request }) => {
    cartsApi = new CartsApi(request);
    productsApi = new ProductsApi(request);
    usersApi = new UsersApi(request);
    adminSession = undefined;
    buyerSession = undefined;
    product = buildProduct();
    productId = undefined;

    adminSession = await createAdminSession(request);
    buyerSession = await createUserSession(request);

    const response = await productsApi.create(product, adminSession.authorization);

    expect(response.status()).toBe(201);
    const body = await response.json();
    productId = body._id;
  });

  test.afterEach(async () => {
    if (buyerSession) {
      await cartsApi.cancelPurchase(buyerSession.authorization);
    }

    if (adminSession && productId) {
      await productsApi.delete(productId, adminSession.authorization);
    }

    if (buyerSession) {
      await usersApi.delete(buyerSession.userId);
    }

    if (adminSession) {
      await usersApi.delete(adminSession.userId);
    }
  });

  async function addProductToCart(quantity = 1, id = productId) {
    return cartsApi.create(
      buildCart([{ idProduto: id, quantidade: quantity }]),
      buyerSession.authorization,
    );
  }

  async function getProduct() {
    const response = await productsApi.getById(productId);
    expect(response.status()).toBe(200);
    return response.json();
  }

  test('deve listar carrinhos cadastrados', async ({ request }) => {
    const response = await cartsApi.list();

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('carrinhos');
    expect(Array.isArray(body.carrinhos)).toBeTruthy();
    expect(body).toHaveProperty('quantidade');
  });

  test('deve cadastrar e consultar o carrinho do usuário', async ({ request }) => {
    const response = await addProductToCart(2);

    expect(response.status()).toBe(201);

    const createdCart = await response.json();
    const getResponse = await cartsApi.getById(createdCart._id);

    expect(getResponse.status()).toBe(200);

    const cart = await getResponse.json();
    expect(cart._id).toBe(createdCart._id);
    expect(cart.idUsuario).toBe(buyerSession.userId);
    expect(cart.quantidadeTotal).toBe(2);
    expect(cart.produtos[0].idProduto).toBe(productId);
    expect((await getProduct()).quantidade).toBe(product.quantidade - 2);
  });

  test('não deve permitir mais de um carrinho por usuário', async ({ request }) => {
    const firstResponse = await addProductToCart();
    expect(firstResponse.status()).toBe(201);

    const secondResponse = await addProductToCart();

    expect(secondResponse.status()).toBe(400);

    const body = await secondResponse.json();
    expect(body.message).toMatch(/mais de 1 carrinho/i);
  });

  test('não deve permitir produtos duplicados no mesmo carrinho', async ({ request }) => {
    const response = await cartsApi.create(
      buildCart([
        { idProduto: productId, quantidade: 1 },
        { idProduto: productId, quantidade: 1 },
      ]),
      buyerSession.authorization,
    );

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/produto duplicado/i);
  });

  test('não deve adicionar produto inexistente', async ({ request }) => {
    const response = await addProductToCart(1, 'id-inexistente');

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/produto não encontrado/i);
  });

  test('não deve exceder o estoque disponível', async ({ request }) => {
    const response = await addProductToCart(product.quantidade + 1);

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toMatch(/quantidade suficiente/i);
  });

  test('deve restaurar o estoque ao cancelar a compra', async ({ request }) => {
    const createResponse = await addProductToCart(2);
    expect(createResponse.status()).toBe(201);

    const reducedProduct = await getProduct();
    expect(reducedProduct.quantidade).toBe(product.quantidade - 2);

    const cancelResponse = await cartsApi.cancelPurchase(buyerSession.authorization);

    expect(cancelResponse.status()).toBe(200);
    expect((await getProduct()).quantidade).toBe(product.quantidade);
  });

  test('deve remover o carrinho ao concluir a compra sem devolver o estoque', async ({ request }) => {
    const createResponse = await addProductToCart(2);
    expect(createResponse.status()).toBe(201);
    const createdCart = await createResponse.json();

    const finishResponse = await cartsApi.checkout(buyerSession.authorization);

    expect(finishResponse.status()).toBe(200);
    expect((await getProduct()).quantidade).toBe(product.quantidade - 2);

    const getCartResponse = await cartsApi.getById(createdCart._id);
    expect(getCartResponse.status()).toBe(400);
  });

  test('não deve excluir produto que pertence a carrinho ativo', async ({ request }) => {
    const cartResponse = await addProductToCart();
    expect(cartResponse.status()).toBe(201);

    const deleteResponse = await productsApi.delete(productId, adminSession.authorization);

    expect(deleteResponse.status()).toBe(400);

    const body = await deleteResponse.json();
    expect(body.message).toMatch(/faz parte de carrinho/i);
  });

  test('não deve cadastrar carrinho sem token', async ({ request }) => {
    const response = await cartsApi.create(buildCart([{ idProduto: productId, quantidade: 1 }]));

    expect(response.status()).toBe(401);
  });
});