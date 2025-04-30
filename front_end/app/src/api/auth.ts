let refreshInProgress = false;
let refreshPromise: Promise<void> | null = null;

export const refreshToken = async (): Promise<void> => {
  if (refreshInProgress) {
    return refreshPromise!;
  }

  refreshInProgress = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refresh_token="))
        ?.split("=")[1];

      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const formData = new FormData();
      formData.append("refresh_token", refreshToken);

      const res = await fetch("/api/jwt/refresh", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to refresh token");
      }
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (response.status === 401) {
    await refreshToken();
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  return response;
};
