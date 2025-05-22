import { userStore } from '~/app-state';
import { navigateTo } from '~/components/app-router';

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const response = await fetch(url, options);

  if (response.status === 401) {
    userStore.set(null);
    navigateTo('/signin');
  }

  return response;
};
