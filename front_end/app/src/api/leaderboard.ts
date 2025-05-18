import { fetchWithAuth } from './auth';

export type LeaderBoardEntry = {
  UID: string;
  wins: number;
  losses: number;
  rank: number;
  username: string;
};

export const fetchAllRanks = async (page: number) => {
  const response = await fetchWithAuth(`/api/leaderboard/list?page=${page}`);

  if (response.ok) {
    return {
      success: true as const,
      data: (await response.json()) as LeaderBoardEntry[],
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};

export const fetchUserRank = async () => {
  const response = await fetchWithAuth('/api/leaderboard/myrank');

  if (response.ok) {
    return {
      success: true as const,
      data: (await response.json()) as LeaderBoardEntry,
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};
