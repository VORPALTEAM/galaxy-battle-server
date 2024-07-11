import { PackSender } from "./PackSender.js";
import { Client } from "../models/Client.js";
import { Web3Service } from "./Web3Service.js";
import { PackTitle, SignData } from "../data/Types.js";
import { LogMng } from "../../monax/LogMng.js";
import { ILogger } from "src/interfaces/ILogger.js";

/**
 * Sign Service for signing clients
 * Class type: Singleton
 */
export class SignService implements ILogger {
    private static _instance: SignService;
    private _className = `SignService`;
    private _clients: Map<string, Client>;

    private constructor() {
        if (SignService._instance) throw new Error("Don't use SignService.constructor(), it's SINGLETON, use getInstance() method");
        this._clients = new Map();
    }
    
    static getInstance(): SignService {
        if (!SignService._instance) SignService._instance = new SignService();
        return SignService._instance;
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`${this._className}: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`${this._className}: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`${this._className}: ${aMsg}`, aData);
    }

    private onSignRecv(aClient: Client, aData: SignData) {
        // const tgNick = aData.tgNick || '';
        let walletId: string;
        this.logDebug("onSignRecv: aData: ", aData);

        if (aData.tgInitString && aData.tgAuthData) {
            // telegram
            this.logDebug("onSignRecv: TG detected");
            aClient.sign({
                tgInitStr: aData.tgInitString,
                tgAuthData: aData.tgAuthData
            });
            aClient.onSignSuccess(walletId);
        }
        else {
            // for web3
            this.logDebug("onSignRecv: Web3 detected");
            try {
                walletId = Web3Service.getInstance().getWalletId(aData.signature);
                aClient.sign({
                    walletId: walletId
                });
            } catch (error) {
                this.logWarn(`onSignRecv: Web3Service.getWalletId() error: `, error);
            }
        }
        
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