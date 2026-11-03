const { expect } = require('@playwright/test');

const BASE_URL = 'https://serverest.dev';

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

async function loginUser(request, email = 'fulano@qa.com', password = 'teste') {
  const response = await request.post(`${BASE_URL}/login`, {
    data: { email, password },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty('authorization');

  return body;
}

module.exports = {
  BASE_URL,
  uniqueEmail,
  buildUser,
  loginUser,
};
