import { Client } from "../models/Client";
import { Game } from "./Game.js";
import { ILogger } from "../interfaces/ILogger";
import { LogMng } from "../utils/LogMng.js";
import { SignService } from "../services/SignService.js";
import { PackSender } from "../services/PackSender.js";
import { Config } from "../data/Config.js";
import { BotClient } from "../models/BotClient.js";

const TICK_RATE = 1000 / 1; // 1000 / t - it's t ticks per sec

export class Matchmaker implements ILogger {
    private _clients: Map<string, Client>;
    private _loopInterval: NodeJS.Timeout;
    private _games: Game[] = [];

    constructor() {
        this._clients = new Map();
        this._games = [];
        this.startLoop();

        // tests
        if (Config.TESTS) this.tests();

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

    private tests() {
        this.logDebug('game test...');
        let game = new Game(null, null);
        game.tests();
        this._games.push(game);
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
        let game = new Game(aClientA, aClientB);
        game.start();
        this._games.push(game);
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.id, aClient);

        // send game searching started
        aClient.startGameSearch();
        
        // check sign of this client
        if (!aClient.isSigned && !aClient.isSignPending) {
            SignService.getInstance().sendRequest(aClient);
        }

    }

    removeClient(aClientId: string) {
        this._clients.delete(aClientId);
    }

    onClientDisconnected(aClientId: string) {
        this.removeClient(aClientId);
        // check the games
        
    }

    /**
     * 
     * @param dt delta time in sec
     */
    update(dt: number) {

        // who ready start with bots
        let readyBotClientIds: string[] = [];
        // normal ready start
        let readyClientIds: string[] = [];

        // find ready clients
        this._clients.forEach(client => {
            if (client.isSigned) {
                if (client.withBot) {
                    readyBotClientIds.push(client.id);
                }
                else {
                    readyClientIds.push(client.id);
                }
            }
        });

        for (let i = 0; i < readyBotClientIds.length; i++) {
            const id = readyBotClientIds[i];
            let client = this._clients.get(id);
            let bot = new BotClient();
            this.removeClient(id);
            this.createGame(bot, client);
        }

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