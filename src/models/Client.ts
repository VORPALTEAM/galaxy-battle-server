import { Socket } from "socket.io";

export enum ClientState {
    idle = 'idle',
    search = 'search',
    game = 'game'
}

export class Client {
    private _socket: Socket;
    private _publicKey: string;
    private _state: ClientState;
    // flags
    private _isSigned = false;
    private _isSignPending = false;
    
    constructor(aSocket: Socket) {
        this._socket = aSocket;
        this._state = ClientState.idle;
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

    public get publicKey(): string {
        return this._publicKey;
    }

    sign(aPublicKey: string) {
        this._publicKey = aPublicKey;
        this._isSigned = true;
    }

}