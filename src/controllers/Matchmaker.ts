import { Client } from "../models/Client";
import { Game } from "./Game";
import { PackTitle } from "../data/Packages.js";
import { ILogger } from "../interfaces/ILogger";
import { LogMng } from "../utils/LogMng.js";

const TICK_RATE = 1000 / 1; // 1000 / t - it's t ticks per sec

export class Matchmaker implements ILogger {
    private _clients: Map<string, Client>;
    private _loopInterval: NodeJS.Timeout;
    private _games: Game[] = [];

    constructor() {
        this._clients = new Map();
        this._games = [];
        this.startLoop();
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`Matchmaker: ${aMsg}`, aData);
    }

    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`Matchmaker: ${aMsg}`, aData);
    }

    logError(aMsg: string, aData?: any): void {
        LogMng.error(`Matchmaker: ${aMsg}`, aData);
    }

    private startLoop() {
        this._loopInterval = setInterval(() => {
            this.update(TICK_RATE / 1000);
        }, TICK_RATE);
    }

    private stopLoop() {
        if (this._loopInterval) {
            clearInterval(this._loopInterval);
            this._loopInterval = null;
        }
    }

    private createGame(aClientA: Client, aClientB: Client) {
        this.logDebug('game creation...');
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.id, aClient);

        // send game searching started
        aClient.socket.emit(PackTitle.gameSearching, {
            status: 'started'
        });

        // check sign of this client
        if (!aClient.isSigned && !aClient.isSignPending) {
            // request sign
            aClient.socket.emit(PackTitle.sign, {
                status: 'request'
            });
        }

    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }

    /**
     * 
     * @param dt delta time in sec
     */
    update(dt: number) {

        let readyClientIds: string[] = [];

        // find ready clients
        this._clients.forEach(client => {
            if (client.isSigned) {
                readyClientIds.push(client.id);
            }
        });

        if (readyClientIds.length >= 2) {
            // match the game with first 2 players
            const id1 = readyClientIds[0];
            const id2 = readyClientIds[1];
            let client1 = this._clients.get(id1);
            let client2 = this._clients.get(id2);
            this.removeClient(id1);
            this.removeClient(id2);
            this.createGame(client1, client2);
        }

    }
    

}