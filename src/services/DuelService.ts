import { Client } from "../models/Client.js";
import { DuelInfo, PackTitle } from "../data/Types.js";
import { GetUserLastDuel } from "../blockchain/duel.js";
import { BC_DuelInfo } from "../blockchain/types.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Signal } from "../utils/events/Signal.js";

/**
 * Duel Service for checking duels
 * Class type: Singleton
 */
export class DuelService implements ILogger {
    private static _instance: DuelService;
    private _className = 'DuelService';
    private _clients: Map<string, Client>;
    onDuelFound = new Signal();

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

    // private getCurrentDuelForNick(aUserNick: string):  {
        
    // }

    private onPackRecv(aClient: Client, aData: DuelInfo) {
        
        switch (aData.cmd) {
            case 'check':
                this.logDebug(`onPackRecv(): check pack: call GetUserLastDuel() for userNick: ${aData.userNick}`);

                // this.getCurrentDuelForNick(aData.userNick)

                GetUserLastDuel(aData.userNick).then((aInfo: BC_DuelInfo) => {
                    
                    if (!aInfo || !aInfo.duel_id) {
                        this.logDebug(`duel not found...`);
                        aClient.sendDuelNotFound();    
                        return;
                    }

                    this.logDebug(`GetUserLastDuel info: `, aInfo);

                    let enemyNick = '';
                    if (aClient.getPlayerData().name) {
                        enemyNick = aClient.getPlayerData().name == aInfo.login1 ? aInfo.login2 : aInfo.login1;
                    }
                    
                    aClient.sendDuelFound(aInfo.duel_id, enemyNick);
                    this.onDuelFound.dispatch(aClient, aInfo);
                }, (reason) => {
                    this.logDebug(`GetUserLastDuel Reject: `, reason);
                    aClient.sendDuelNotFound();
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