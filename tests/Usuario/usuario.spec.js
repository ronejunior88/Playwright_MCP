const { test, expect } = require('@playwright/test');
const { UsersApi } = require('../api/users-api');
const { buildUser, uniqueEmail } = require('../library.spec');

test.describe('ServeRest - Usuários', () => {
  let usersApi;

  test.beforeEach(({ request }) => {
    usersApi = new UsersApi(request);
  });

  test('deve cadastrar um usuário com dados válidos', async ({ request }) => {
    const payload = buildUser();
    const response = await usersApi.create(payload);

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
    expect(body).toHaveProperty('_id');
  });

  test('não deve cadastrar um usuário com e-mail duplicado', async ({ request }) => {
    const payload = buildUser({ email: uniqueEmail('duplicado') });

    const firstResponse = await usersApi.create(payload);

    expect(firstResponse.status()).toBe(201);

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
    const createResponse = await usersApi.create(createdUser);

    expect(createResponse.status()).toBe(201);
    const createdBody = await createResponse.json();

    const response = await usersApi.getById(createdBody._id);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toBe(createdBody._id);
    expect(body.email).toBe(createdUser.email);
  });

  test('deve atualizar um usuário existente', async ({ request }) => {
    const createdUser = buildUser();
    const createResponse = await usersApi.create(createdUser);

    expect(createResponse.status()).toBe(201);
    const createdBody = await createResponse.json();

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
    const createResponse = await usersApi.create(createdUser);

    expect(createResponse.status()).toBe(201);
    const createdBody = await createResponse.json();

    const response = await usersApi.delete(createdBody._id);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message');
  });
});
