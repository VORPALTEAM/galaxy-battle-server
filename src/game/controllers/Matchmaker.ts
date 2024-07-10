import { Client } from "../models/Client.js";
import { Game } from "./Game.js";
import { ILogger } from "../../interfaces/ILogger.js";
import { LogMng } from "../../monax/LogMng.js";
import { SignService } from "../services/SignService.js";
import { Config } from "../data/Config.js";
import { BotClient } from "../models/BotClient.js";
import { ClientPair } from "../models/ClientPair.js";
import { IdGenerator } from "../../monax/game/IdGenerator.js";
import { BC_DuelInfo } from "../../blockchain/types.js";
import { MyMath } from "../../monax/MyMath.js";

const TICK_RATE = 1000 / 1; // 1000 / t - it's t ticks per sec

export class Matchmaker implements ILogger {
    protected _className: string;
    protected _loopInterval: NodeJS.Timeout;
    protected _clients: Map<string, Client>;
    protected _pairs: Map<number, ClientPair>;
    protected _games: Map<number, Game>;
    protected _gameIdGen: IdGenerator;
    protected _pairIdGen: IdGenerator;
    protected _duels: Map<string, {
        clients: Client[],
        info: BC_DuelInfo
    }>;

    constructor() {
        this._className = 'Matchmaker';
        this._gameIdGen = new IdGenerator();
        this._pairIdGen = new IdGenerator();
        this._clients = new Map();
        this._pairs = new Map();
        this._games = new Map();
        this._duels = new Map();
        this.startLoop();

        // tests
        if (Config.tests) this.tests();

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

    private getNewPairId(): number {
        return this._pairIdGen.nextId();
    }

    private getNewGameId(): number {
        return this._gameIdGen.nextId();
    }

    private tests() {
        this.logDebug('game test...');
        let game = new Game({
            gameId: this.getNewGameId(),
            clientA: null,
            clientB: null,
            duelData: null
        });
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

    private createPair(aClientA: Client, aClientB: Client, aDuelInfo?: BC_DuelInfo) {
        this.logDebug('createPair: aDuelInfo: ', aDuelInfo);
        let pair = new ClientPair(this.getNewPairId(), aClientA, aClientB, aDuelInfo);
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

    private onPairReady(aPair: ClientPair, aDuelInfo: BC_DuelInfo) {
        this.logDebug(`onPairReady: duelInfo:`, aDuelInfo);
        const pId = aPair.id;
        let pair = this._pairs.get(pId);
        let clients: Client[] = [];
        pair.clients.forEach((client) => {
            clients.push(client);
        });
        this.createGame(clients[0], clients[1], aDuelInfo);
        this._pairs.delete(pId);
        pair.free();
    }

    private createGame(aClientA: Client, aClientB: Client, aDuelInfo: BC_DuelInfo) {
        this.logDebug('game creation...');
        let game = new Game({
            gameId: this.getNewGameId(),
            clientA: aClientA,
            clientB: aClientB,
            duelData: aDuelInfo
        });
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

    private removeDuel(aDuelId: string) {
        this._duels.delete(aDuelId);
    }

    addClient(aClient: Client) {

        // send game searching started
        aClient.sendStartGameSearch();

        // if (aClient.isDuelMode) {
            // this.addDuelClient(aClient);
        // }
        // else {
            this.logDebug(`addClient...`);
            this._clients.set(aClient.connectionId, aClient);
        // }

        // check sign of this client
        if (!aClient.isFreeConnection && !aClient.isSigned && !aClient.isSignPending) {
            SignService.getInstance().sendRequest(aClient);
        }

    }

    addDuelClient(aClient: Client, aInfo: BC_DuelInfo) {

        this.logDebug(`addDuelClient...`);

        aClient.sendStartGameSearch();

        const id = String(aInfo.creation) || String(MyMath.randomIntInRange(0, Number.MAX_SAFE_INTEGER));
        let duelRecord = this._duels.get(id);
        if (duelRecord) {
            duelRecord.clients.push(aClient);
        }
        else {
            this.logDebug(`addDuelClient: new challenge detected`);
            // create duel
            this._duels.set(id, {
                clients: [aClient],
                info: aInfo
            });
        }

        // check sign of this client
        if (!aClient.isFreeConnection && !aClient.isSigned && !aClient.isSignPending) {
            SignService.getInstance().sendRequest(aClient);
        }

    }

    removeClient(aClient: Client) {
        aClient.sendStopGameSearch();
        this._clients.delete(aClient.connectionId);

        // TODO: check it and test
        // check challenges
        this._duels.forEach((aData, key: string) => {
            let clients = aData.clients;
            for (let i = 0; i < clients.length; i++) {
                const cli = clients[i];
                if (cli.connectionId == aClient.connectionId) {
                    // PackSender.getInstance().sendDuelStopped
                    this._duels.delete(key);
                }
            }
        });

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

        this._duels.forEach((data, key) => {
            let clients = data.clients;
            if (clients.length >= 2) {
                const client1 = clients[0];
                const client2 = clients[1];
                if (
                    (client1.isSigned || client1.isFreeConnection) && 
                    (client2.isSigned || client2.isFreeConnection)
                ) {
                // if (client1 && client2) {
                    this.removeDuel(key);
                    this.createPair(client1, client2, data.info);
                }
            }
            
        });

    }
    

}