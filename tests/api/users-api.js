const { ApiClient, buildQuery } = require('./api-client');

class UsersApi extends ApiClient {
  list(filters = {}) {
    return this.request.get(this.url(`/usuarios${buildQuery(filters)}`));
  }

  getById(userId) {
    return this.request.get(this.url(`/usuarios/${userId}`));
  }

  create(user) {
    return this.request.post(this.url('/usuarios'), { data: user });
  }

  update(userId, user) {
    return this.request.put(this.url(`/usuarios/${userId}`), { data: user });
  }

  delete(userId) {
    return this.request.delete(this.url(`/usuarios/${userId}`));
  }
}

module.exports = { UsersApi };