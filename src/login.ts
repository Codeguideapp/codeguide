import { backendApi } from './config';
import { fetchWithThrow } from './utils/fetchWithThrow';

export async function checkToken() {
  const token = localStorage.getItem('token');
  if (!token) return;

  // we asume the token is valid
  // ... but we check just to be sure
  return fetchWithThrow(`${backendApi}/github/oauth/token`, {
    jsonRes: false,
    headers: {
      authorization: `token ${token}`,
    },
  }).catch(logout);
}

export async function exchangeCodeForToken(code: string) {
  const response: any = await fetchWithThrow(
    `${backendApi}/github/oauth/token`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    }
  ).catch(console.error);

  if (response) {
    localStorage.setItem('token', response.token);
  }

  // remove ?code=... and &state=... from URL
  const path =
    document.location.pathname +
    document.location.search
      .replace(/\b(code|state)=\w+/g, '')
      .replace(/[?&]+$/, '');

  window.history.pushState({}, '', path);
}

export async function logout(options: any = {}) {
  const token = localStorage.getItem('token');

  if (options.invalidateToken) {
    await fetchWithThrow(`${backendApi}/github/oauth/token`, {
      method: 'DELETE',
      headers: {
        authorization: `token ${token}`,
      },
    }).catch(console.error);
  }

  localStorage.clear();
  document.location.reload();
}

export function login() {
  document.location = `${backendApi}/github/oauth/login?scopes=repo&redirectUrl=${document.location.href}`;
}
