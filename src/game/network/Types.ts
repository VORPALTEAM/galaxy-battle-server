
// TYPES FOR PACKETS

export type TGAuthData = {
    id: number;
    auth_date: number;
    hash: string;
    first_name: string;
    last_name: string;
    username: string;
}

export type SignData = {
    fromServer?: 'request' | 'reject' | 'success',
    fromCli?: 'web3' | 'web2',
    signature?: string,
    message?: string,
    walletId?: string,
    tgAuthData?: TGAuthData
}