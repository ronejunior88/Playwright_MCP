const BASE_URL = 'https://serverest.dev';

function buildQuery(filters) {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== null);
  const query = new URLSearchParams(entries).toString();

  return query ? `?${query}` : '';
}

class ApiClient {
  constructor(request) {
    this.request = request;
  }

  url(path) {
    return `${BASE_URL}${path}`;
  }

  withAuthorization(token, options = {}) {
    const headers = { ...options.headers };

    if (token) {
      headers.Authorization = token;
    }

    return { ...options, headers };
  }
}

module.exports = { ApiClient, BASE_URL, buildQuery };