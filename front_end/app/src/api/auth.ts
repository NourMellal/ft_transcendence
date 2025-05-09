import { navigateTo } from '~/components/app-router';

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    navigateTo('/signin');
  }

  return response;
};

export const fetchActiveSessions = async () => {
  const res = await fetch('/api/jwt/list');
  if (res.ok) {
    return (await res.json()) || [];
  }

  return [];
};
