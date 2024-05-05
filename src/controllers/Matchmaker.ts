import { Client } from "../models/Client.js";
import { Game } from "./Game.js";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { SignService } from "../services/SignService.js";
import { Config } from "../data/Config.js";
import { BotClient } from "../models/BotClient.js";
import { ClientPair } from "../models/ClientPair.js";
import { IdGenerator } from "../utils/game/IdGenerator.js";

const TICK_RATE = 1000 / 1; // 1000 / t - it's t ticks per sec



export class Matchmaker implements ILogger {
    private _loopInterval: NodeJS.Timeout;
    private _clients: Map<string, Client>;
    private _pairs: Map<number, ClientPair>;
    private _games: Map<number, Game>;
    // private _gameIdCounter = 0;
    private _gameIdGen: IdGenerator;
    private _pairIdGen: IdGenerator;

    private _challenges: Map<number, Client[]>;


    constructor() {
        this._gameIdGen = new IdGenerator();
        this._pairIdGen = new IdGenerator();
        this._clients = new Map();
        this._pairs = new Map();
        this._games = new Map();
        this._challenges = new Map();
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

    private getNewPairId(): number {
        return this._pairIdGen.nextId();
    }

    private getNewGameId(): number {
        return this._gameIdGen.nextId();
    }

    private tests() {
        this.logDebug('game test...');
        let game = new Game(this.getNewGameId(), null, null);
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
        let pair = new ClientPair(this.getNewPairId(), aClientA, aClientB);
        this._pairs.set(pair.id, pair);
        pair.onBreak.add(this.onPairBreak, this);
        pair.onAllReady.add(this.onPairReady, this);
    }

    private onPairBreak(aPair: ClientPair) {
        this.logDebug(`onPairBreak...`);
        const pId = aPair.id;
        let pair = this._pairs.get(pId);
        let clients = pair.clients;
        clients.forEach((client) => {
            this.removeClient(client);
        });
        this._pairs.delete(pId);
        pair.free();
    }

    private onPairReady(aPair: ClientPair) {
        this.logDebug(`onPairReady...`);
        const pId = aPair.id;
        let pair = this._pairs.get(pId);
        let clients: Client[] = [];
        pair.clients.forEach((client) => {
            clients.push(client);
        });
        this.createGame(clients[0], clients[1]);
        this._pairs.delete(pId);
        pair.free();
    }

    private createGame(aClientA: Client, aClientB: Client) {
        this.logDebug('game creation...');
        let game = new Game(this.getNewGameId(), aClientA, aClientB);
        game.onGameComplete.addOnce(this.onGameComplete, this);
        game.start();
        this._games.set(game.id, game);
    }

    private onGameComplete(aGame: Game) {
        this.logDebug(`onGameComplete -> delete the game id = (${aGame.id})`);
        this._games.delete(aGame.id);
        try {
            aGame.free();
        } catch (error) {
            
        }
    }

    private addChallengeClient(aClient: Client) {
        this.logDebug(`addChallengeClient...`);

        const id = aClient.challengeNumber;
        let ch = this._challenges.get(id);
        if (!ch) {
            this.logDebug(`addChallengeClient: new challenge detected`);
            if (!aClient.isChallengeCreator) {
                this.logDebug(`addChallengeClient: connect request to challenge num: ${aClient.challengeNumber}`);
                // message challenge not found
                aClient.sendChallengeNotFound();
                return;
            }
            else {
                this.logDebug(`addChallengeClient: new challenge creator detected`);
                // create challenge
                this._challenges.set(id, [aClient]);
            }
        }
        else {
            ch.push(aClient);
        }
    }

    addClient(aClient: Client) {

        // send game searching started
        aClient.sendStartGameSearch();

        if (aClient.isChallengeMode) {
            this.addChallengeClient(aClient);
        }
        else {
            this.logDebug(`addClient...`);
            this._clients.set(aClient.connectionId, aClient);
        }

        // check sign of this client
        if (!aClient.isFreeConnection && !aClient.isSigned && !aClient.isSignPending) {
            SignService.getInstance().sendRequest(aClient);
        }

    }

    removeClient(aClient: Client) {
        aClient.sendStopGameSearch();
        this._clients.delete(aClient.connectionId);
        // check challenges
        if (aClient.isChallengeMode) {
            const id = aClient.challengeNumber;
            if (aClient.isChallengeCreator) {
                // remove challenge record
                this._challenges.delete(id);
                return;
            }
            else {
                let ch = this._challenges.get(id);
                if (ch && ch.length > 0) {
                    for (let i = ch.length - 1; i >= 0; i--) {
                        let cli = ch[i];
                        if (cli.connectionId == aClient.connectionId) {
                            ch.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
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
            // this.createGame(bot, client);
            this.createPair(bot, client);
        }

        while (readyClientIds.length >= 2) {
            // match the game with first 2 players
            const id1 = readyClientIds.shift();
            const id2 = readyClientIds.shift();
            let client1 = this._clients.get(id1);
            let client2 = this._clients.get(id2);
            this.removeClient(client1);
            this.removeClient(client2);
            // this.createGame(client1, client2);
            this.createPair(client1, client2);
        }

        // check challenge clients

        this._challenges.forEach(ch => {

            if (ch.length >= 2) {
                const client1 = ch[0];
                const client2 = ch[1];
                if (
                    (client1.isSigned || client1.isFreeConnection) &&
                    (client2.isSigned || client2.isFreeConnection)
                ) {
                    this.removeClient(client2);
                    this.removeClient(client1);
                    this.createPair(client1, client2);
                }
            }
            
        });

    }
    

}