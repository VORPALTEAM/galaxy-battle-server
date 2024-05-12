import { PackSender } from "./PackSender.js";
import { Client } from "../models/Client.js";
import { Web3Service } from "./Web3Service.js";
import { PackTitle, SignData } from "../data/Types.js";
import { LogMng } from "../utils/LogMng.js";

/**
 * Sign Service for signing clients
 * Class type: Singleton
 */
export class SignService {
    private static _instance: SignService;
    private _clients: Map<string, Client>;

    private constructor() {
        if (SignService._instance) throw new Error("Don't use SignService.constructor(), it's SINGLETON, use getInstance() method");
        this._clients = new Map();
    }

    static getInstance(): SignService {
        if (!SignService._instance) SignService._instance = new SignService();
        return SignService._instance;
    }

    private onSignRecv(aClient: Client, aData: SignData) {
        // const tgNick = aData.tgNick || '';
        let walletId: string;
        try {
            walletId = Web3Service.getInstance().getWalletId(aData.signature);
        } catch (error) {
            LogMng.warn(`onSignRecv Web3Service.getWalletId error: `, error);
        }

        // check the player in connections
        // this._clients.forEach((client) => {
        //     if (client.walletId === walletId) {
        //         aClient.onSignReject('Sign failed, client with this key is already online');
        //         return;
        //     }
        // });

        // update client
        aClient.sign(walletId, aData.tgAuthData);
        aClient.onSignSuccess(walletId);
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.connectionId, aClient);
        const socket = aClient.socket;
        // init listeners
        socket.on(PackTitle.sign, (aData: SignData) => {
            this.onSignRecv(aClient, aData);
        });
    }

    removeClient(aClientId: string) {
        let client = this._clients.get(aClientId);
        client.socket?.removeAllListeners(PackTitle.sign);
        this._clients.delete(aClientId);
    }

    sendRequest(aClient: Client) {
        aClient.sendSignRequest();
    }


}