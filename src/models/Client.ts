import { Socket } from "socket.io";
import { ILogger } from "../interfaces/ILogger.js";
import { LogMng } from "../utils/LogMng.js";
import { PackTitle } from "../data/Types.js";
import { Signal } from "../utils/events/Signal.js";

export class Client implements ILogger {

    protected _className: string;
    protected _socket: Socket;
    protected _id: string;
    protected _walletId: string;

    // flags
    protected _isSigned = false;
    protected _isSignPending = false;
    protected _isDisconnected = false;
    private _isWithBot = false;
    
    onStartSearchGame = new Signal();
    onStopSearchGame = new Signal();
    onLaser = new Signal();
    onExitGame = new Signal();
    onDisconnect = new Signal();


    constructor(aSocket: Socket) {
        this._className = 'Client';
        this._socket = aSocket;
        this.setIdBySocket();
        this.initListeners();
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

    protected setIdBySocket() {
        this._id = this._socket.id;
    }

    protected initListeners() {

        this._socket.on(PackTitle.startSearchGame, (aData?: { withBot: boolean }) => {
            // client.withBot = aData?.withBot;
            this._isWithBot = aData?.withBot;
            if (this._isWithBot) {
                this.logDebug(`search game with bot request...`);
            }
            else {
                this.logDebug(`search game request...`);
            }
            // this.onStartSearchGame(client);
            this.onStartSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.stopSearchGame, () => {
            this.logDebug(`stop game searching request...`);
            this.onStopSearchGame.dispatch(this);
        });

        this._socket.on(PackTitle.planetLaser, () => {
            // laser click event
            this.onLaser.dispatch(this);
        });

        this._socket.on(PackTitle.exitGame, () => {
            // client click exit
            this.onExitGame.dispatch(this);
        });

        this._socket.on('disconnect', () => {
            // this.onDisconnect(clientId);
            this._isDisconnected = true;
            this.onDisconnect.dispatch(this);
        });

    }

    get socket(): Socket {
        return this._socket;
    }

    get id(): string {
        return this._id;
    }

    get isSigned() {
        return this._isSigned;
    }

    get isSignPending() {
        return this._isSignPending;
    }

    set isSignPending(value) {
        this._isSignPending = value;
    }

    get walletId(): string {
        return this._walletId;
    }

    get isDisconnected() {
        return this._isDisconnected;
    }

    get isWithBot() {
        return this._isWithBot;
    }

    sign(aPublicKey: string) {
        this._walletId = aPublicKey;
        this._isSigned = true;
        this.logDebug(`signed...`);
    }

    sendPack(aPackTitle: PackTitle, aData: any) {
        if (this._isDisconnected) return;
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

    sendStartGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: 'start'
        });
    }

    sendStopGameSearch() {
        this.sendPack(PackTitle.gameSearching, {
            cmd: 'stop'
        });
    }



}