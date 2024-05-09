import { Client } from "../models/Client.js";
import { DuelInfo, PackTitle } from "../data/Types.js";
import { GetUserLastDuel } from "src/blockchain/duel.js";
import { BC_DuelInfo } from "src/blockchain/types.js";
import { ILogger } from "src/interfaces/ILogger.js";
import { LogMng } from "src/utils/LogMng.js";

/**
 * Duel Service for checking duels
 * Class type: Singleton
 */
export class DuelService implements ILogger {
    private static _instance: DuelService;
    private _className = 'DuelService';
    private _clients: Map<string, Client>;

    private constructor() {
        if (DuelService._instance) throw new Error("Don't use SignService.constructor(), it's SINGLETON, use getInstance() method");
        this._clients = new Map();
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

    static getInstance(): DuelService {
        if (!DuelService._instance) DuelService._instance = new DuelService();
        return DuelService._instance;
    }

    private onPackRecv(aClient: Client, aData: DuelInfo) {
        
        switch (aData.cmd) {
            case 'check':
                GetUserLastDuel(aData.userNick).then((info: BC_DuelInfo) => {
                    this.logDebug(`GetUserLastDuel info: `, info);
                }, (reason) => {
                    this.logDebug(`GetUserLastDuel Reject: `, reason);
                })
                break;
        
            default:
                break;
        }

        // check the player in connections
        this._clients.forEach((client) => {
            
        });

        // update client
        // aClient.sign(walletId, displayName);
        // aClient.onSignSuccess(walletId);
        
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.connectionId, aClient);
        const socket = aClient.socket;
        // init listeners
        socket.on(PackTitle.duel, (aData: DuelInfo) => {
            this.onPackRecv(aClient, aData);
        });
    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }

    sendRequest(aClient: Client) {
        aClient.sendSignRequest();
    }


}