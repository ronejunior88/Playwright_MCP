const { ApiClient, buildQuery } = require('./api-client');

class CartsApi extends ApiClient {
  list(filters = {}) {
    return this.request.get(this.url(`/carrinhos${buildQuery(filters)}`));
  }

  getById(cartId) {
    return this.request.get(this.url(`/carrinhos/${cartId}`));
  }

  create(cart, token) {
    return this.request.post(
      this.url('/carrinhos'),
      this.withAuthorization(token, { data: cart }),
    );
  }

  checkout(token) {
    return this.request.delete(
      this.url('/carrinhos/concluir-compra'),
      this.withAuthorization(token),
    );
  }

  cancelPurchase(token) {
    return this.request.delete(
      this.url('/carrinhos/cancelar-compra'),
      this.withAuthorization(token),
    );
  }
}

module.exports = { CartsApi };