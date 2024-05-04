import { PackSender } from "./PackSender.js";
import { Client } from "../models/Client.js";
import { Web3Service } from "./Web3Service.js";
import { PackTitle } from "../data/Types.js";

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

    private onSignRecv(aClient: Client, aSignature: string, aDisplayName = '') {
        const walletId = Web3Service.getInstance().getWalletId(aSignature);

        // check the player in connections
        this._clients.forEach((client) => {
            if (client.walletId === walletId) {
                aClient.signReject('Sign failed, client with this key is already online');
                return;
            }
        });

        // update client
        aClient.sign(walletId, aDisplayName);
        aClient.signSuccess(walletId);
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.connectionId, aClient);
        const socket = aClient.socket;
        // init listeners
        socket.on(PackTitle.sign, (aSignature: string, aDisplayName = '') => {
            this.onSignRecv(aClient, aSignature, aDisplayName);
        });
    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }

    sendRequest(aClient: Client) {
        aClient.signRequest();
    }


}