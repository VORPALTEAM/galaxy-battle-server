import { Socket } from "socket.io";
import { PackTitle } from "./data/Packages.js";

export class Client {
    private _socket: Socket;
    private _isAuth = false;

    constructor(aSocket: Socket) {
        this._socket = aSocket;
        this.initListeners();
    }

    private initListeners() {
        
        
    }

}