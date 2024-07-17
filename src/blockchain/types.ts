export interface TelegramAuthData {
  auth_date: number;
  first_name: string;
  hash: string;
  id: number;
  last_name: string;
  username: string;
}

export interface ComplexAutData {
  authType: "telegram" | "web3";
  signature?: string;
  telegramData?: TelegramAuthData;
}

export interface BC_DuelInfo {
  duel_id: string;
  id1: string;
  id2?: string;
  nickName1?: string;
  nickName2?: string;
  creation: number;
  isfinished?: string;
  isexpired?: string;
  winner?: string;
}

export type DuelInfoResponce = {
  data: BC_DuelInfo | null;
};

export type OpponentResponce = {
  opponent: string | null;
};

export interface PlayerSummaryStats {
  player: string;
  total_damage: number;
  total_experience: number;
  total_gold: number;
}

export interface DuelPlayerStats {
  id?: number;
  duel_id: string;
  player: string;
  damage_total: number;
  experience: number;
  gold: number;
}

export interface DuelStatsMessage {
  signature: string;
  stats: DuelPlayerStats[]
}