const { ApiClient } = require('./api-client');

class LoginApi extends ApiClient {
  login(credentials) {
    return this.request.post(this.url('/login'), { data: credentials });
  }
}

module.exports = { LoginApi };