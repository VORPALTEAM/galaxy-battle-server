import EventEmitter from "events";
import { Socket } from "socket.io";
import { PackTitle, Packet } from "./Packets";
import { ILogger } from "src/interfaces/ILogger";
import { LogMng } from "src/monax/LogMng";

export enum NetworkEvents {
    Connect = 'Connect',
    Disconnect = 'Disconnect',
    Packet = 'Packet'
}

export class NetworkManager implements ILogger {
    private static _instance: NetworkManager;
    private _className = 'NetworkManager';
    private _io: Socket;
    private _events: EventEmitter;

    constructor(io: Socket) {
        this._io = io;
        this._events = new EventEmitter();
        this.initSocketEvents();
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

    private initSocketEvents() {
        this._io.on('connection', (socket: Socket) => {
            this.onConnect(socket);
        });
        this._io.on('packet', (aPacket: Packet) => {
            this.onPacket(aPacket);
        });
    }

    static getInstance(io?: Socket): NetworkManager {
        if (!this._instance) {
            if (!io) throw new Error(`NetworkManager: getInstance: io is not defined!`);
            this._instance = new NetworkManager(io);
        }
        return this._instance;
    }

    private onConnect(aSocket: Socket) {
        aSocket.on
        this._events.emit(NetworkEvents.Connect, aSocket);
    }

    private onDisconnect() {

    }

    private onPacket(aPacket: Packet) {
        switch (aPacket.title) {
            case PackTitle.sign:
                // aPacket.data == signData
                
                break;
        
            default:
                // unknown packet title
                this.logError(`Unknown Packet Title: ${aPacket.title}`);
                break;
        }
    }

    on() {

    }

    emit() {

    }
    
}