import { Client } from "../models/Client";
import { Game } from "./Game.js";
import { ILogger } from "../interfaces/ILogger";
import { LogMng } from "../utils/LogMng.js";
import { SignService } from "../services/SignService.js";
import { Config } from "../data/Config.js";
import { BotClient } from "../models/BotClient.js";

const TICK_RATE = 1000 / 1; // 1000 / t - it's t ticks per sec

class ClientPair {

    constructor(aClientA: Client, aClientB: Client) {
        
    }

}

export class Matchmaker implements ILogger {
    private _loopInterval: NodeJS.Timeout;
    private _clients: Map<string, Client>;
    private _pairs: ClientPair[];
    private _games: Map<number, Game>;
    private _gameIdCounter = 0;

    constructor() {
        this._clients = new Map();
        this._pairs = [];
        this._games = new Map();
        this.startLoop();

        // tests
        if (Config.tests) this.tests();

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

    private generateNewGameId(): number {
        return this._gameIdCounter++;
    }

    private tests() {
        this.logDebug('game test...');
        let game = new Game(this.generateNewGameId(), null, null);
        game.tests();
        this._games.set(game.id, game);
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

    private createPair(aClientA: Client, aClientB: Client) {
        this.logDebug('pair creation...');
        let pair = new ClientPair(aClientA, aClientB);
        // pair.onGameComplete.addOnce(this.onGameComplete, this);
        // pair.start();
        // this._games.set(game.id, game);
    }

    private createGame(aClientA: Client, aClientB: Client) {
        this.logDebug('game creation...');
        let game = new Game(this.generateNewGameId(), aClientA, aClientB);
        game.onGameComplete.addOnce(this.onGameComplete, this);
        game.start();
        this._games.set(game.id, game);
    }

    private onGameComplete(aGame: Game) {
        this.logDebug(`onGameComplete -> delete the game id = (${aGame.id})`);
        this._games.delete(aGame.id);
        aGame.free();
    }

    addClient(aClient: Client) {
        this._clients.set(aClient.connectionId, aClient);

        // send game searching started
        aClient.sendStartGameSearch();
        
        // check sign of this client
        if (!aClient.isFreeConnection && !aClient.isSigned && !aClient.isSignPending) {
            SignService.getInstance().sendRequest(aClient);
        }

    }

    removeClient(aClient: Client) {
        aClient.sendStopGameSearch();
        this._clients.delete(aClient.connectionId);
    }

    onClientDisconnected(aClient: Client) {
        this.removeClient(aClient);
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
            if (client.isSigned || client.isFreeConnection) {
                if (client.isWithBot) {
                    readyBotClientIds.push(client.connectionId);
                }
                else {
                    readyClientIds.push(client.connectionId);
                }
            }
        });

        for (let i = 0; i < readyBotClientIds.length; i++) {
            const id = readyBotClientIds[i];
            let client = this._clients.get(id);
            let bot = new BotClient();
            this.removeClient(client);
            this.createGame(bot, client);
        }

        while (readyClientIds.length >= 2) {
            // match the game with first 2 players
            const id1 = readyClientIds.shift();
            const id2 = readyClientIds.shift();
            let client1 = this._clients.get(id1);
            let client2 = this._clients.get(id2);
            this.removeClient(client1);
            this.removeClient(client2);
            this.createGame(client1, client2);
            // this.createPair(client1, client2);
        }

    }
    

}