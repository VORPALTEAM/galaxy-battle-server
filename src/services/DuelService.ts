import { Client } from "../models/Client.js";
import { DuelInfo, PackTitle } from "../data/Types.js";
import { FinishDuel, GetUserLastDuel } from "../blockchain/duel.js";
import { BC_DuelInfo } from "../blockchain/types.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { Signal } from "../utils/events/Signal.js";
import { DeleteDuel } from "../blockchain/functions.js";

/**
 * Duel Service for checking duels
 * Class type: Singleton
 */
export class DuelService implements ILogger {
    private static _instance: DuelService;
    private _className = 'DuelService';
    private _clients: Map<string, Client>;
    onDuelFound = new Signal();
    onDuelCancel = new Signal();

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

                let userNick = aData.userNick.toLowerCase();

                this.logDebug(`'check' pack: call GetUserLastDuel() for userNick: ${userNick}`);

                GetUserLastDuel(userNick).then((aInfo: BC_DuelInfo) => {
                    
                    this.logDebug(`GetUserLastDuel info: `, aInfo);

                    let isCreationCorrect = true;
                    if (aInfo?.creation) {
                        // check creation time
                        const limitMins = 15;
                        const limitSec = limitMins * 60;
                        const duelDateSec = aInfo.creation;
                        const dateSec = Date.now() / 1000;
                        const dtTimeSec = dateSec - duelDateSec;
                        isCreationCorrect = dtTimeSec < limitSec;
                        if (!isCreationCorrect) {
                            this.logDebug(`duel creation time is too old:`, {
                                limitSec: limitSec,
                                dateSec: dateSec,
                                dtTimeSec: dtTimeSec
                            });
                        }
                    }
                    else {
                        this.logDebug(`duel creation time check: ainfo.creation == null`);
                    }

                    if (!aInfo || !aInfo.duel_id || aInfo.isexpired || aInfo.isfinished || !isCreationCorrect) {
                        this.logDebug(`duel not found...`);
                        aClient.sendDuelNotFound();    
                        return;
                    }

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
            
            case 'cancel': {
                let userNick = aData.userNick.toLowerCase();
                this.logDebug(`onPackRecv(): cancel: call GetUserLastDuel() for userNick: ${userNick}`);

                GetUserLastDuel(userNick).then((aInfo: BC_DuelInfo) => {

                    this.logDebug(`onPackRecv(): cancel: call FinishDuel for duel: ${aInfo}`);
                    this.logDebug(`CALL FinishDuel`);

                    // finish duel
                    try {
                        FinishDuel(aInfo.duel_id);
                    } catch (error) {
                        this.logError(`FinishDuel ERROR:`, error);
                    }

                    // remove duel record
                    try {
                        DeleteDuel(aInfo.duel_id);
                    } catch (error) {
                        this.logError(`DeleteDuel ERROR:`, error);
                    }

                }, (reason) => {
                    this.logDebug(`GetUserLastDuel Reject: `, reason);
                })
                aClient.sendDuelCancel();
                this.onDuelCancel.dispatch(aClient);
            } break;
        
            default:
                break;
        }

        // check the player in connections
        // this._clients.forEach((client) => {
            
        // });

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