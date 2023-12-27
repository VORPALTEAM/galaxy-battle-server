import { Socket } from "socket.io";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { PackTitle } from "../data/Types.js";

export enum ClientState {
    idle = 'idle',
    search = 'search',
    game = 'game'
}

export class Client implements ILogger {
    protected _className: string;
    private _socket: Socket;
    private _walletId: string;
    private _state: ClientState;
    // flags
    protected _isSigned = false;
    protected _isSignPending = false;
    withBot = false;
    
    constructor(aSocket: Socket) {
        this._className = 'Client';
        this._socket = aSocket;
        this._state = ClientState.idle;
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

    sendPack(aPackTitle: PackTitle, aData: any) {
        this._socket.emit(aPackTitle, aData);
    }

    signRequest() {
        this.sendPack(PackTitle.sign, {
            cmd: 'request'
        });
    }

    signReject(aMsg?: string) {
        this.sendPack(PackTitle.sign, {
            cmd: 'reject',
            message: aMsg
        });
    }

    signSuccess(aWalletId: string) {
        this.sendPack(PackTitle.sign, {
            cmd: 'success',
            walletId: aWalletId
        });
    }

    startGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: 'start'
        });
    }

    
    
}