import { Socket } from "socket.io";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";

export enum ClientState {
    idle = 'idle',
    search = 'search',
    game = 'game'
}

export class Client implements ILogger {
    private _socket: Socket;
    private _walletId: string;
    private _state: ClientState;
    // flags
    private _isSigned = false;
    private _isSignPending = false;
    
    constructor(aSocket: Socket) {
        this._socket = aSocket;
        this._state = ClientState.idle;
    }

    logDebug(aMsg: string, aData?: any): void {
        LogMng.debug(`Client: ${aMsg}`, aData);
    }
    logWarn(aMsg: string, aData?: any): void {
        LogMng.warn(`Client: ${aMsg}`, aData);
    }
    logError(aMsg: string, aData?: any): void {
        LogMng.error(`Client: ${aMsg}`, aData);
    }

    public get socket(): Socket {
        return this._socket;
    }

    public get id(): string {
        return this.socket.id;
    }

    public get isSigned() {
        return this._isSigned;
    }

    public get isSignPending() {
        return this._isSignPending;
    }
    
    public set isSignPending(value) {
        this._isSignPending = value;
    }

    public get walletId(): string {
        return this._walletId;
    }

    sign(aPublicKey: string) {
        this._walletId = aPublicKey;
        this._isSigned = true;
        this.logDebug(`signed...`);
    }

}