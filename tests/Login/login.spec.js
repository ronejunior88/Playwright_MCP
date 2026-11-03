const { test, expect } = require('@playwright/test');
const { BASE_URL, loginUser } = require('../library.spec');

test.describe('ServeRest - Login', () => {
  test('deve autenticar com credenciais válidas', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/login`, {
      data: {
        email: 'fulano@qa.com',
        password: 'teste',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Login realizado com sucesso');
    expect(body).toHaveProperty('authorization');
    expect(body.authorization).toContain('Bearer ');

    await loginUser(request, 'fulano@qa.com', 'teste');
  });

  test('não deve autenticar com senha inválida', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/login`, {
      data: {
        email: 'fulano@qa.com',
        password: 'senha-errada',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('message');
  });
});
