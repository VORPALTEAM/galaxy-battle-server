import { Server, Socket } from "socket.io";
import { Client } from "../models/Client.js";
import { PackTitle } from "../data/Packages.js";
import { LogMng } from "../utils/LogMng.js";
import { Matchmaker } from "./Matchmaker.js";
import { ILogger } from "src/interfaces/ILogger.js";
import { SignService } from "../services/SignService.js";

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

        socket.on(PackTitle.startSearchGame, () => {
            this.onStartSearchGame(client);
        });

        socket.on('disconnect', () => {
            this.onDisconnect(clientId);
        });

        this.logDebug(`Client connected: ${clientId}`);
    }

    private onStartSearchGame(aClient: Client) {
        this._matchmaker.addClient(aClient);
    }

    private onDisconnect(aClientId: string) {
        this._matchmaker.removeClient(aClientId);
        SignService.getInstance().removeClient(aClientId);
        this._clients.delete(aClientId);
        this.logDebug(`Client disconnected: ${aClientId}`);
    }

}