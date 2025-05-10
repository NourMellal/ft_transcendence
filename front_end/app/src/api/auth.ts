import { navigateTo } from '~/components/app-router';

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) {
    navigateTo('/signin');
  }

  return response;
};
