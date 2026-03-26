const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const TOKEN_STORAGE_KEY = 'stripe-aula1-token';

async function request(path, { body, method = 'GET', token } = {}) {
  const headers = new Headers();

  if (body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao comunicar com a API.');
  }

  return data;
}

export function listPlans() {
  return request('/planos');
}

export function login(email) {
  return request('/usuarios/login', {
    method: 'POST',
    body: { email }
  });
}

export function getUser(token) {
  return request('/usuarios/me', { token });
}

export function getSubscription(token) {
  return request('/assinaturas/me', { token });
}

export function getPaymentLink(token, planCode) {
  return request('/assinaturas/payment-link', {
    method: 'POST',
    token,
    body: { planCode }
  });
}

export function getPremiumResource(token) {
  return request('/assinaturas/recurso-premium', {
    token
  });
}

export function createCustomerPortalSession(token) {
  return request('/stripe/customer-portal', {
    method: 'POST',
    token
  });
}
