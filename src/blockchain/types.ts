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

export interface DuelInfo {
  duel_id: string;
  login1: string;
  login2?: string;
  creation: number;
  isfinished?: string;
  isexpired?: string;
  winner?: string;
}

export type DuelInfoResponce = {
  data: DuelInfo | null;
};

export type OpponentResponce = {
  opponent: string | null;
};
