const { ApiClient, buildQuery } = require('./api-client');

class ProductsApi extends ApiClient {
  list(filters = {}) {
    return this.request.get(this.url(`/produtos${buildQuery(filters)}`));
  }

  getById(productId) {
    return this.request.get(this.url(`/produtos/${productId}`));
  }

  create(product, token) {
    return this.request.post(
      this.url('/produtos'),
      this.withAuthorization(token, { data: product }),
    );
  }

  update(productId, product, token) {
    return this.request.put(
      this.url(`/produtos/${productId}`),
      this.withAuthorization(token, { data: product }),
    );
  }

  delete(productId, token) {
    return this.request.delete(
      this.url(`/produtos/${productId}`),
      this.withAuthorization(token),
    );
  }
}

module.exports = { ProductsApi };