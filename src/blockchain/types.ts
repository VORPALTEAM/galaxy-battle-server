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
  telegramData?: TelegramAuthData
}