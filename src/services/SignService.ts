import { PackSender } from "./PackSender.js";
import { PackTitle } from "../data/Packages.js";
import { Client } from "../models/Client.js";
import { Web3Service } from "./Web3Service.js";

/**
 * Sign Service for signing clients
 * Class type: Singleton
 */
export class SignService {
    private static _instance: SignService;
    private _clients: Map<string, Client>;

    private constructor() {
        if (SignService._instance) throw new Error("Don't use SignMng.constructor(), it's SINGLETON, use getInstance() method");
        this._clients = new Map();
    }

    static getInstance(): SignService {
        if (!SignService._instance) SignService._instance = new SignService();
        return SignService._instance;
    }

    private onSignRecv(aClient: Client, aSignature: string) {
        const walletId = Web3Service.getInstance().getWalletId(aSignature);
        const socket = aClient.socket;

        // check the player in connections
        this._clients.forEach((client) => {
            if (client.walletId === walletId) {
                PackSender.getInstance().signReject(socket, 'Sign failed, client with this key is already online');
                return;
            }
        });

        // update client
        aClient.sign(walletId);

        PackSender.getInstance().signSuccess(socket, walletId);
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.id, aClient);
        const socket = aClient.socket;
        // init listeners
        socket.on(PackTitle.sign, (aSignature: string) => {
            this.onSignRecv(aClient, aSignature);
        });
    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }

    sendRequest(aClient: Client) {
        PackSender.getInstance().signRequest(aClient.socket);
    }


}