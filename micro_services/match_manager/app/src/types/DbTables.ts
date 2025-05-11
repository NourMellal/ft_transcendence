export const matchs_table_name = "matchs";

export enum matchType {
  Single1v1 = 1,
  Single2v2,
  Tournament,
  AI
};

export type MatchModel = {
  match_UID: string;
  UID: string;
  match_type: matchType;
  started: number;
  state: number;
};
