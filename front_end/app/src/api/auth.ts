import { userState } from '~/app-state';
import { navigateTo } from '~/components/app-router';

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401) {
    userState.set(null);
    navigateTo('/signin');
  }

  return response;
};
