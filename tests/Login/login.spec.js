const { test, expect } = require('@playwright/test');
const { LoginApi } = require('../api/login-api');
const { UsersApi } = require('../api/users-api');
const { buildUser } = require('../library');

test.describe('ServeRest - Login', () => {
  let credentials;
  let userId;
  let usersApi;

  test.beforeEach(async ({ request }) => {
    usersApi = new UsersApi(request);
    const user = buildUser();
    const response = await usersApi.create(user);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body._id).toBeTruthy();

    credentials = { email: user.email, password: user.password };
    userId = body._id;
  });

  test.afterEach(async () => {
    if (userId) {
      const response = await usersApi.delete(userId);
      expect(response.status()).toBe(200);
      userId = undefined;
    }
  });

  test('deve autenticar com credenciais válidas', async ({ request }) => {
    const loginApi = new LoginApi(request);
    const response = await loginApi.login(credentials);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Login realizado com sucesso');
    expect(body).toHaveProperty('authorization');
    expect(body.authorization).toContain('Bearer ');

  });

  test('não deve autenticar com senha inválida', async ({ request }) => {
    const loginApi = new LoginApi(request);
    const response = await loginApi.login({
      email: credentials.email,
      password: 'senha-errada',
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('message');
  });
});
