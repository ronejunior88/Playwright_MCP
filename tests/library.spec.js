const { expect } = require('@playwright/test');
const { BASE_URL } = require('./api/api-client');
const { LoginApi } = require('./api/login-api');
const { UsersApi } = require('./api/users-api');

function uniqueEmail(prefix = 'qa') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}@qa.com`;
}

function buildUser(overrides = {}) {
  const defaultUser = {
    nome: 'Usuário QA',
    email: uniqueEmail('usuario'),
    password: 'teste123',
    administrador: 'false',
  };

  return { ...defaultUser, ...overrides };
}

function buildProduct(overrides = {}) {
  const defaultProduct = {
    nome: `Produto QA ${Date.now()}_${Math.random().toString(16).slice(2)}`,
    preco: 100,
    descricao: 'Produto para testes automatizados',
    quantidade: 10,
  };

  return { ...defaultProduct, ...overrides };
}

function buildCart(products) {
  return { produtos: products };
}

async function loginUser(request, email = 'fulano@qa.com', password = 'teste') {
  const loginApi = new LoginApi(request);
  const response = await loginApi.login({ email, password });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('authorization');

  return body;
}

async function createUserSession(request, overrides = {}) {
  const user = buildUser(overrides);
  const usersApi = new UsersApi(request);
  const response = await usersApi.create(user);

  expect(response.status()).toBe(201);
  const body = await response.json();
  const login = await loginUser(request, user.email, user.password);

  return {
    userId: body._id,
    authorization: login.authorization,
  };
}

async function createAdminSession(request) {
  return createUserSession(request, { administrador: 'true' });
}

module.exports = {
  BASE_URL,
  uniqueEmail,
  buildUser,
  buildProduct,
  buildCart,
  loginUser,
  createUserSession,
  createAdminSession,
};
