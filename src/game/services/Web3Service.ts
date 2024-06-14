import { CheckTelegramAuth } from "../../blockchain/index.js";
import { ComplexAutData, TelegramAuthData } from "../../blockchain/types.js";
import Web3 from "web3";

export class Web3Service {
    private static _instance: Web3Service;
    private _web3: Web3;

    private constructor() {
        if (Web3Service._instance) throw new Error("Don't use Web3Service.constructor(), it's SINGLETON, use getInstance() method");
        this._web3 = new Web3(Web3.givenProvider);
    }

    static getInstance(): Web3Service {
        if (!Web3Service._instance) Web3Service._instance = new Web3Service();
        return Web3Service._instance;
    }

    private authMsg(): string {
        const dt = new Date().getTime();
        return 'auth_' + String(dt - (dt % 600000));
    }

    getWalletId(aSignature: string): string {
        const recoverMsg = this.authMsg();
        const publicKey: string = this._web3.eth.accounts.recover(recoverMsg, aSignature).toLowerCase();
        return publicKey;
    }

    getTelegramLogin (authData: TelegramAuthData): string | undefined {
        const checkData = CheckTelegramAuth( authData );
        if (checkData.success) {
            return `@${authData.username}`
        }
        return;
    }
 
    getLoginByComplexAuth(data: ComplexAutData): string | undefined {
        switch(data.authType) {
           case "telegram" :
               if(!data.telegramData) return;
              return this.getTelegramLogin(data.telegramData)
           case "web3" :
               if (!data.signature) return;
               return this.getWalletId(data.signature);
           default:
               return;
        }
     }
}