const { test, expect } = require('@playwright/test');
const { LoginApi } = require('../api/login-api');

test.describe('ServeRest - Login', () => {
  test('deve autenticar com credenciais válidas', async ({ request }) => {
    const loginApi = new LoginApi(request);
    const response = await loginApi.login({
      email: 'fulano@qa.com',
      password: 'teste',
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Login realizado com sucesso');
    expect(body).toHaveProperty('authorization');
    expect(body.authorization).toContain('Bearer ');

  });

  test('não deve autenticar com senha inválida', async ({ request }) => {
    const loginApi = new LoginApi(request);
    const response = await loginApi.login({
      email: 'fulano@qa.com',
      password: 'senha-errada',
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('message');
  });
});
