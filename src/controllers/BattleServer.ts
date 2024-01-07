import { Server, Socket } from "socket.io";
import { Client } from "../models/Client.js";
import { LogMng } from "../utils/LogMng.js";
import { Matchmaker } from "./Matchmaker.js";
import { ILogger } from "src/interfaces/ILogger.js";
import { SignService } from "../services/SignService.js";
import { PackTitle } from "../data/Types.js";

export class BattleServer implements ILogger {
    private _server: Server;
    private _clients: Map<string, Client>;
    private _matchmaker: Matchmaker;

    constructor(aServerIO: Server) {
        this._server = aServerIO;
        this._clients = new Map();
        this._matchmaker = new Matchmaker();
        this.initListeners();
        this.logDebug(`started...`);
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`BattleServer: ${aMsg}`, aData);
    }

    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`BattleServer: ${aMsg}`, aData);
    }

    logError(aMsg: string, aData?: any): void {
        LogMng.error(`BattleServer: ${aMsg}`, aData);
    }
    
    private initListeners() {
        this._server.on('connection', (socket: Socket) => {
            this.onConnect(socket);
        });
    }

    private onConnect(socket: Socket) {
        const clientId = socket.id;
        const client = new Client(socket);
        
        // add to hash table
        this._clients.set(clientId, client);

        // add to SignService
        SignService.getInstance().addClient(client);

        client.onStartSearchGame.add(this.onStartSearchGame, this);
        client.onStopSearchGame.add(this.onStopSearchGame, this);
        client.onDisconnect.add(this.onDisconnect, this);

        this.logDebug(`Client connected: ${clientId}`);
    }

    private onStartSearchGame(aClient: Client) {
        this._matchmaker.addClient(aClient);
    }

    private onStopSearchGame(aClient: Client) {
        this._matchmaker.removeClient(aClient);

    }

    private onDisconnect(aClient: Client) {
        const cid = aClient.id;
        this._matchmaker.onClientDisconnected(aClient);
        SignService.getInstance().removeClient(cid);
        this._clients.delete(cid);
        this.logDebug(`Client disconnected: ${cid}`);
    }

}