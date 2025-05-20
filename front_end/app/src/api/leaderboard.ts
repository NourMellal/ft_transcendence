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

type FetchUserRankResponse = {
  UID: string;
  wins: number;
  losses: number;
  rank: number;
};

export const fetchUserRank = async (uid: string) => {
  const response = await fetchWithAuth(`/api/leaderboard/rank?uid=${uid}`);
  if (response.ok) {
    try {
      const data = (await response.json()) as FetchUserRankResponse;
      return {
        success: true as const,
        data: data,
      };
    } catch (e) {
      // whatever ....
      return {
        success: true as const,
        data: null,
      };
    }
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};
