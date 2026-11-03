const { test, expect } = require('@playwright/test');
const { UsersApi } = require('../api/users-api');
const { buildUser, uniqueEmail } = require('../library');

test.describe('ServeRest - Usuários', () => {
  let usersApi;
  let createdUserIds;

  test.beforeEach(({ request }) => {
    usersApi = new UsersApi(request);
    createdUserIds = [];
  });

  test.afterEach(async () => {
    for (const userId of createdUserIds.reverse()) {
      const response = await usersApi.delete(userId);
      expect(response.status()).toBe(200);
    }
  });

  async function createUser(user) {
    const response = await usersApi.create(user);
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body._id).toBeTruthy();
    createdUserIds.push(body._id);
    return body;
  }

  test('deve cadastrar um usuário com dados válidos', async ({ request }) => {
    const payload = buildUser();
    const body = await createUser(payload);
    expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
  });

  test('não deve cadastrar um usuário com e-mail duplicado', async ({ request }) => {
    const payload = buildUser({ email: uniqueEmail('duplicado') });
    await createUser(payload);

    const duplicateResponse = await usersApi.create(payload);

    expect(duplicateResponse.status()).toBe(400);

    const body = await duplicateResponse.json();
    expect(body).toHaveProperty('message');
  });

  test('deve listar usuários cadastrados', async ({ request }) => {
    const response = await usersApi.list();

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('usuarios');
    expect(Array.isArray(body.usuarios)).toBeTruthy();
  });

  test('deve buscar um usuário por ID', async ({ request }) => {
    const createdUser = buildUser();
    const createdBody = await createUser(createdUser);

    const response = await usersApi.getById(createdBody._id);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toBe(createdBody._id);
    expect(body.email).toBe(createdUser.email);

    const missingResponse = await usersApi.getById('0000000000000000');
    expect(missingResponse.status()).toBe(400);
    expect(await missingResponse.json()).toHaveProperty('message');
  });

  test('deve atualizar um usuário existente', async ({ request }) => {
    const createdUser = buildUser();
    const createdBody = await createUser(createdUser);

    const updatedUser = {
      nome: 'Usuário Atualizado',
      email: uniqueEmail('atualizado'),
      password: 'novaSenha123',
      administrador: 'false',
    };

    const response = await usersApi.update(createdBody._id, updatedUser);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/alterado|alteração/i);
  });

  test('deve excluir um usuário cadastrado sem carrinho', async ({ request }) => {
    const createdUser = buildUser();
    const createdBody = await createUser(createdUser);

    const response = await usersApi.delete(createdBody._id);

    expect(response.status()).toBe(200);
    createdUserIds = createdUserIds.filter((userId) => userId !== createdBody._id);

    const body = await response.json();
    expect(body).toHaveProperty('message');

    const getResponse = await usersApi.getById(createdBody._id);
    expect(getResponse.status()).toBe(400);
  });
});
