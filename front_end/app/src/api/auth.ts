import { navigateTo } from '~/components/app-router';

async function refreshToken() {
  return await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshRes = await refreshToken();
    if (refreshRes.status === 401) {
      await fetch('/api/user/logout', {
        method: 'POST',
      });
      navigateTo('/signin');
    } else {
      return fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
  }

  return response;
};
